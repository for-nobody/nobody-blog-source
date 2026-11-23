const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const { once } = require('node:events');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');
const WebSocket = require('ws');
const { createTemporaryDirectory, removeTemporaryDirectory } = require('./site-fixture.cjs');

async function until(read, label, ms = 8000) {
  const deadline = Date.now() + ms;
  do {
    const value = await read();
    if (value) return value;
    await delay(50);
  } while (Date.now() < deadline);
  throw new Error('Timed out: ' + label);
}

async function serve(fixtures) {
  const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png' };
  const failures = [];
  const server = http.createServer((req, res) => {
    const url = new URL(req.url, 'http://127.0.0.1');
    const fixture = fixtures.find(({ prefix }) => url.pathname.startsWith(prefix + '/'));
    const relative = decodeURIComponent(url.pathname.slice(fixture.prefix.length));
    const file = path.resolve(fixture.publicDir, '.' + relative + (relative.endsWith('/') ? 'index.html' : ''));
    if (file.startsWith(fixture.publicDir + path.sep) && fs.existsSync(file) && fs.statSync(file).isFile()) {
      res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
      fs.createReadStream(file).pipe(res);
    } else {
      failures.push(url.pathname);
      res.writeHead(404).end();
    }
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  return {
    origin: 'http://127.0.0.1:' + server.address().port,
    failures,
    close() {
      server.closeAllConnections();
      return new Promise(resolve => server.close(resolve));
    }
  };
}

async function openChromium() {
  const binary = process.env.CHROME_BIN || [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
  ].find(file => fs.existsSync(file));
  assert.ok(binary, 'Set CHROME_BIN to an installed Chrome or Edge executable.');
  const profile = createTemporaryDirectory();
  const proc = spawn(binary, [
    '--headless=new', '--no-first-run', '--disable-background-networking', '--disable-gpu',
    '--remote-debugging-port=0', '--user-data-dir=' + profile, 'about:blank'
  ], { stdio: ['ignore', 'ignore', 'pipe'], windowsHide: true });
  let launchError;
  let stderr = '';
  let socket;
  proc.on('error', error => { launchError = error; });
  proc.stderr.setEncoding('utf8').on('data', chunk => { stderr = (stderr + chunk).slice(-2000); });
  const closed = once(proc, 'close').catch(() => {});
  async function close() {
    socket?.close();
    proc.kill();
    await closed;
    removeTemporaryDirectory(profile);
  }

  try {
    const endpoint = await until(() => {
      if (launchError) throw launchError;
      if (proc.exitCode !== null) throw new Error(stderr || 'Chromium exited during launch.');
      const file = path.join(profile, 'DevToolsActivePort');
      if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8').trim().split('\n')[0];
    }, 'Chromium DevTools endpoint');
    const debuggerRoot = 'http://127.0.0.1:' + endpoint;
    const version = (await fetch(debuggerRoot + '/json/version').then(res => res.json())).Browser;
    const targets = await fetch(debuggerRoot + '/json/list').then(res => res.json());
    socket = new WebSocket(targets.find(target => target.type === 'page').webSocketDebuggerUrl);
    await once(socket, 'open');
    socket.on('error', () => {});

    let id = 0;
    const pending = new Map();
    const exceptions = [];
    const responses = [];
    const requests = new Map();
    const networkErrors = [];
    const consoleErrors = [];
    socket.on('message', data => {
      const message = JSON.parse(data);
      const { method, params } = message;
      if (method === 'Runtime.exceptionThrown') exceptions.push(params.exceptionDetails);
      if (method === 'Runtime.consoleAPICalled' && params.type === 'error') consoleErrors.push(params.args);
      if (method === 'Network.requestWillBeSent') requests.set(params.requestId, params.request.url);
      if (method === 'Network.responseReceived') responses.push(params.response);
      if (method === 'Network.loadingFailed' && !params.canceled) {
        networkErrors.push({ url: requests.get(params.requestId), error: params.errorText });
      }
      pending.get(message.id)?.(message);
    });

    function send(method, params = {}) {
      return new Promise((resolve, reject) => {
        const current = ++id;
        const timer = setTimeout(() => {
          pending.delete(current);
          reject(new Error('DevTools command timed out: ' + method + '\n' + stderr));
        }, 10000);
        pending.set(current, reply => {
          clearTimeout(timer);
          pending.delete(current);
          if (reply.error) reject(new Error(method + ': ' + reply.error.message));
          else resolve(reply.result);
        });
        socket.send(JSON.stringify({ id: current, method, params }));
      });
    }

    async function evaluate(fn, ...args) {
      const query = '(' + fn.toString() + ')(...' + JSON.stringify(args) + ')';
      const result = await send('Runtime.evaluate', { expression: query, returnByValue: true, awaitPromise: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
      return result.result.value;
    }

    async function waitFor(fn, args, label) {
      return until(async () => {
        try {
          return await evaluate(fn, ...args);
        } catch (error) {
          if (!/execution context|navigat/i.test(error.message)) throw error;
          return false;
        }
      }, label);
    }

    for (const domain of ['Page', 'Runtime', 'Network']) await send(domain + '.enable');
    return { send, evaluate, waitFor, close, version, exceptions, responses, networkErrors, consoleErrors };
  } catch (error) {
    await close();
    throw error;
  }
}

module.exports = { openChromium, serve };
