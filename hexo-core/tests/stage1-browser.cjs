const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { setTimeout: delay } = require('node:timers/promises');
const { openChromium, serve } = require('./chromium.cjs');
const { buildFixture, lastPost, singlePostPath, expectedGroups, expectedArchiveOrder } = require('./site-fixture.cjs');
const { measureVortex } = require('./vortex.cjs');

const prefix = '/preview/blog';
const fixtures = [];
let web;
let browser;

async function run() {
  fixtures.push(buildFixture(13, prefix), buildFixture(1));
  web = await serve(fixtures);
  browser = await openChromium();
  const { send, evaluate, waitFor } = browser;
  console.log(browser.version);

  const versionKey = 'nobody-lab-version';
  const themeKey = 'nobody-lab-theme';
  async function viewport(width, height, touch = false, reduce = false) {
    await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: touch });
    await send('Emulation.setTouchEmulationEnabled', { enabled: touch });
    await send('Emulation.setEmulatedMedia', { features: [
      { name: 'prefers-color-scheme', value: 'dark' },
      { name: 'prefers-reduced-motion', value: reduce ? 'reduce' : 'no-preference' }
    ] });
  }

  async function ready(route, version, after = 0) {
    await waitFor((route, version, after) => {
      const script = document.getElementById('variant-script');
      return document.readyState === 'complete' && decodeURIComponent(location.pathname) === route &&
        performance.timeOrigin > after && document.documentElement.dataset.uiVersion === version &&
        script && performance.getEntriesByName(script.src).some(entry => entry.duration > 0);
    }, [route, version, after], route + ' with loaded ' + version);
    const asset = await evaluate(() => {
      const sheet = document.getElementById('variant-style');
      return { css: new URL(sheet.href).pathname, loaded: !!sheet.sheet, js: new URL(document.getElementById('variant-script').src).pathname };
    });
    const base = route.startsWith(prefix + '/') ? prefix : '';
    assert.deepEqual(asset, { css: base + '/style-' + version + '.css', loaded: true, js: base + '/script-' + version + '.js' }, route);
  }

  async function visit(route, version) {
    const previous = await evaluate(() => performance.timeOrigin);
    const navigation = await send('Page.navigate', { url: web.origin + route });
    assert.ok(!navigation.errorText, navigation.errorText);
    await ready(route, version, previous);
  }

  async function position(selector, scroll = true) {
    const point = await evaluate(async (selector, scroll) => {
      const el = document.querySelector(selector);
      if (scroll) {
        el?.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'instant' });
        await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      }
      const rect = el?.getBoundingClientRect();
      return rect && { x: Math.max(1, rect.left) + Math.min(rect.width, innerWidth - Math.max(1, rect.left) - 1) / 2,
        y: rect.top + rect.height / 2 };
    }, selector, scroll);
    assert.ok(point, selector);
    return point;
  }

  async function click(selector) {
    const point = await position(selector);
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', ...point, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', ...point, button: 'left', clickCount: 1 });
  }

  async function tap(selector) {
    const point = await position(selector);
    assert.ok(await evaluate((selector, { x, y }) => document.elementFromPoint(x, y)?.closest(selector) != null,
      selector, point), 'Touch target hidden or covered: ' + selector + ' ' + JSON.stringify(point));
    await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [point] });
    await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }

  async function key(key, windowsVirtualKeyCode) {
    const options = { key, code: key, windowsVirtualKeyCode };
    if (key === 'Enter') await send('Input.dispatchKeyEvent', { type: 'keyDown', ...options, text: '\r' });
    else await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', ...options });
    await send('Input.dispatchKeyEvent', { type: 'keyUp', ...options });
  }

  async function chooseVersion(route, version) {
    const previous = await evaluate(() => performance.timeOrigin);
    await click('#versionToggle');
    await ready(route, version, previous);
    assert.equal(await evaluate(key => localStorage.getItem(key), versionKey), version);
  }

  async function focus(selector) {
    await evaluate(selector => document.querySelector(selector).focus(), selector);
  }

  async function theme() {
    return evaluate(() => [document.documentElement.dataset.theme,
      document.getElementById('themeToggle').getAttribute('aria-pressed')]);
  }

  const background = () => evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--bg-deep'));

  async function expectVortex(label) {
    await waitFor(() => !document.body.getAnimations().some(animation => animation.animationName === 'pageEnter'),
      [], label + ' pageEnter');
    const changes = await measureVortex(browser);
    assert.ok(changes.filter(percent => percent >= 50).length >= 2,
      label + ' vortex pixel changes by region (%): ' + changes.join(', '));
    return changes.join('/');
  }

  async function checkHomeVortex(version, mode) {
    const label = version + ' ' + mode;
    const afterEntry = await expectVortex(label + ' after pageEnter');
    const previous = await evaluate(() => performance.timeOrigin);
    await send('Page.reload');
    await ready('/', version, previous);
    assert.equal((await theme())[0], mode);
    await delay(5000);
    const afterReload = await expectVortex(label + ' five seconds after reload');
    console.log('PASS ' + label + ' vortex pixels (%) after entry ' + afterEntry + ', after reload ' + afterReload);
  }

  await viewport(1440, 900);
  await visit('/', 'v3');
  assert.deepEqual(await theme(), ['dark', 'false']);
  const acidDark = await background();
  await checkHomeVortex('v3', 'dark');
  await click('#themeToggle');
  assert.deepEqual(await theme(), ['light', 'true']);
  assert.notEqual(await background(), acidDark);
  await checkHomeVortex('v3', 'light');
  await chooseVersion('/', 'v2');
  assert.deepEqual(await theme(), ['light', 'true']);
  const appleLight = await background();
  await checkHomeVortex('v2', 'light');
  await click('#themeToggle');
  assert.deepEqual(await theme(), ['dark', 'false']);
  assert.notEqual(await background(), appleLight);
  await checkHomeVortex('v2', 'dark');
  await click('#themeToggle');
  assert.deepEqual(await theme(), ['light', 'true']);
  await click('.glass-nav-vertical a[href="/about/"]');
  await ready('/about/', 'v2');
  assert.ok(await evaluate(() => document.querySelector('.constellation-map') && document.querySelector('.stat-num-glitch')));
  await click('.glass-nav-vertical a[href="/projects/"]');
  await ready('/projects/', 'v2');
  await chooseVersion('/projects/', 'v3');
  assert.deepEqual(await theme(), ['light', 'true']);
  await evaluate(() => history.back());
  await ready('/about/', 'v3');
  await evaluate(() => history.forward());
  await ready('/projects/', 'v3');
  assert.equal(await evaluate(key => localStorage.getItem(key), themeKey), 'light');
  // Check a corrupted choice and the ordinary refresh path on a nested route.
  await evaluate(key => localStorage.setItem(key, 'unknown-version'), versionKey);
  const prior = await evaluate(() => performance.timeOrigin);
  await send('Page.reload');
  await ready('/projects/', 'v3', prior);
  assert.deepEqual(await theme(), ['light', 'true']);
  console.log('PASS default, v2/v3, theme independence, navigation, reload, history and invalid storage');

  await visit('/', 'v3');
  await click('.glass-nav-vertical a[href="/archives/"]');
  await ready('/archives/', 'v3');
  await click('[data-filter="other"]');
  assert.equal(await evaluate(() => document.querySelectorAll('.article-card-waterfall:not([hidden])').length), 1);
  await click('[data-filter="tech"]');
  assert.ok(await evaluate(() => !document.querySelector('[data-filter-empty]').hidden));
  await click('[data-filter="all"]');
  await click('.article-card-waterfall h2 a');
  await ready(singlePostPath, 'v3');
  assert.equal(await evaluate(() => document.querySelector('.nav-btn-glass.active').getAttribute('href')), '/archives/');
  console.log('PASS unclassified fixture post is reachable, empty filter and reset work');

  const archive = prefix + '/archives/';
  for (const [versionIndex, version] of ['v3', 'v2'].entries()) {
    await visit(archive, 'v3');
    if (versionIndex) await chooseVersion(archive, version);
    for (const key of ['tech', 'life', 'thought', 'tutorial', 'other', 'all']) {
      await click('[data-filter="' + key + '"]');
      const expected = expectedArchiveOrder.slice(0, 10).map(number => expectedGroups[number - 1]).filter(groups =>
        key === 'all' || groups.includes(key) || (key === 'other' && !groups.length)).length;
      const state = await evaluate(() => ({
        visible: document.querySelectorAll('.article-card-waterfall:not([hidden])').length,
        pressed: document.querySelector('.filter-pill[aria-pressed="true"]').dataset.filter
      }));
      assert.deepEqual(state, { visible: expected, pressed: key }, key + ' ' + version);
    }
    await evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', ...await position('.tree-tag-btn[data-category="tech"]') });
    await waitFor(() => !document.getElementById('droplet-tech').hidden, [], 'hover opens tree panel');
    const link = '#droplet-tech .droplet-title';
    const buttonPoint = await position('.tree-tag-btn[data-category="tech"]', false);
    const linkPoint = await position(link, false);
    // Cross the shared boundary from the trigger into the panel with the mouse.
    for (let step = 1; step <= 4; step++) {
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved',
        x: buttonPoint.x + (linkPoint.x - buttonPoint.x) * step / 4,
        y: buttonPoint.y + (linkPoint.y - buttonPoint.y) * step / 4 });
    }
    assert.equal(await evaluate(() => document.getElementById('droplet-tech').hidden), false);
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 145, y: 25 });
    await focus('#themeToggle');
    await key('Tab', 9);
    assert.equal(await evaluate(() => document.activeElement.dataset.category), 'tech');
    assert.equal(await evaluate(() => getComputedStyle(document.activeElement).outlineStyle), 'solid');
    await key('Enter', 13);
    assert.equal(await evaluate(() => document.activeElement.getAttribute('aria-expanded')), 'true');
    await key('Tab', 9);
    assert.equal(await evaluate(() => document.activeElement.className), 'droplet-title');
    await key('Escape', 27);
    assert.equal(await evaluate(() => document.activeElement.getAttribute('aria-expanded')), 'false');
    await key('Enter', 13);
    await key('Tab', 9);
    await key('Enter', 13);
    await ready(prefix + lastPost, version);
    await visit(archive, version);
    await click('[rel=next]');
    await ready(archive + 'page/2/', version);
    assert.equal(await evaluate(() => document.querySelectorAll('.article-card-waterfall').length), 3);
    await click('[rel=prev]');
    await ready(archive, version);
    await visit(prefix + lastPost, version);
    await evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
    await waitFor(() => parseFloat(document.getElementById('progress-bar').style.width) > 95, [], 'reading progress');
    await expectVortex(version + ' after scrolling the article');
    assert.ok(await evaluate(() => document.querySelector('.post-content img').naturalWidth > 0));
    assert.ok(await evaluate(() => document.querySelector('.post-content .highlight .code pre').textContent.includes('abcd')));
    const taxonomy = await evaluate(() => decodeURIComponent(new URL(document.querySelector('.post-taxonomies a').href).pathname));
    assert.match(taxonomy, /\/categories\//);
    await click('.post-taxonomies a');
    await ready(taxonomy, version);
    assert.equal(await evaluate(() => document.querySelector('.nav-btn-glass.active').getAttribute('href')), archive);
    // Reset before visiting the other version using the same origin.
    await evaluate(key => localStorage.removeItem(key), versionKey);
    console.log('PASS ' + version + ' nested routes, filters, tree mouse/keyboard, pagination, detail and progress');
  }

  for (const version of ['v3', 'v2']) {
    await viewport(1440, 900);
    await visit('/', 'v3');
    if (version === 'v2') await chooseVersion('/', 'v2');
    for (const [width, height, touch] of [[1440, 900, false], [768, 1024, true], [390, 844, true]]) {
      await viewport(width, height, touch, touch);
      for (const route of [prefix + '/', prefix + '/about/', archive, prefix + lastPost, prefix + '/projects/']) {
        await visit(route, version);
        const layout = await evaluate(touch => {
          const root = document.documentElement;
          const nav = document.querySelector('.glass-nav-vertical').getBoundingClientRect();
          const main = document.querySelector('main');
          const heading = main.querySelector('h1, .logo-glitch').getBoundingClientRect();
          return {
            overflow: root.scrollWidth - root.clientWidth,
            blocked: touch ? heading.top < nav.bottom : heading.left < nav.right && heading.top < nav.bottom,
            navHeight: nav.height,
            navInView: nav.left >= 0 && nav.right <= innerWidth
          };
        }, touch);
        assert.ok(layout.overflow <= 1 && !layout.blocked && layout.navInView,
          version + ' ' + width + ' ' + route + ' ' + JSON.stringify(layout));
        if (width === 390) await expectVortex(version + ' ' + width + ' reduced motion ' + route);
        if (route === archive && touch) {
          await tap('.tree-tag-btn[data-category="tech"]');
          assert.equal(await evaluate(() => document.getElementById('droplet-tech').hidden), false);
          assert.ok(await evaluate(() => {
            const panel = document.getElementById('droplet-tech').getBoundingClientRect();
            return panel.left >= 0 && panel.right <= innerWidth;
          }));
          await tap('[data-filter="life"]');
          await waitFor(() => document.querySelector('.filter-pill[aria-pressed="true"]').dataset.filter === 'life',
            [], 'touch article filter');
        }
        if (route.endsWith('/projects/')) {
          const button = '.project-tag-btn[data-category="cpp"]';
          if (touch) {
            assert.ok(await evaluate(() => [...document.querySelectorAll('.project-tag-btn')].every(el => {
              const rect = el.getBoundingClientRect();
              return rect.width >= 44 && rect.height >= 44 && rect.left >= 0 && rect.right <= innerWidth;
            })));
            await tap(button);
          } else {
            await focus('#themeToggle');
            await key('Tab', 9);
            assert.equal(await evaluate(() => document.activeElement.dataset.category), 'cpp');
            assert.ok(await evaluate(() => document.activeElement.getBoundingClientRect().right <= innerWidth));
            await key('Enter', 13);
          }
          await waitFor(() => document.getElementById('panel-cpp').classList.contains('active'), [], 'project panel');
          assert.equal(await evaluate(selector => document.querySelector(selector).getAttribute('aria-pressed'), button), 'true');
          if (!touch) await waitFor(() => !document.querySelector('.circle-reveal-overlay.collapsing'), [], 'project transition');
          if (touch) await tap(button);
          else await key('Enter', 13);
          await waitFor(() => document.getElementById('panel-default').classList.contains('active'), [], 'project reset');
        }
        if (process.env.STAGE1_SCREENSHOTS && width !== 768 && (route === archive || route.endsWith('/projects/'))) {
          await evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
          if (!touch) await delay(1600);
          const name = version + '-' + width + '-' + (route === archive ? 'archives' : 'projects') + '.png';
          const { data } = await send('Page.captureScreenshot', { format: 'png' });
          fs.writeFileSync(path.join(process.env.STAGE1_SCREENSHOTS, name), Buffer.from(data, 'base64'));
        }
      }
      console.log('PASS ' + version + ' ' + width + 'x' + height + ' 5 layouts, ' + (touch ? 'touch and reduced motion' : 'keyboard and project transition'));
    }
    await evaluate(key => localStorage.removeItem(key), versionKey);
  }

  const { identifier } = await send('Page.addScriptToEvaluateOnNewDocument', {
    source: 'Object.defineProperty(window, "localStorage", { get() { throw new Error("storage denied"); } });'
  });
  await visit(archive, 'v3');
  assert.ok(await evaluate(() => document.getElementById('versionToggle').disabled));
  await tap('#themeToggle');
  assert.deepEqual(await theme(), ['light', 'true']);
  await send('Page.removeScriptToEvaluateOnNewDocument', { identifier });
  await send('Emulation.setScriptExecutionDisabled', { value: true });
  await send('Page.navigate', { url: web.origin + archive });
  await waitFor(() => document.readyState === 'complete' &&
    !document.querySelector('#variant-script') && document.querySelector('.article-card-waterfall'), [], 'no-JS archive');
  assert.equal(await evaluate(() => [...document.querySelectorAll('.article-card-waterfall')]
    .filter(card => getComputedStyle(card).display !== 'none').length), 10);
  assert.ok(await evaluate(() => document.querySelector('.archive-filters').hidden &&
    document.querySelector('#articlesTree').hidden));
  console.log('PASS blocked storage and JavaScript-disabled archive');

  assert.deepEqual(browser.exceptions, [], 'uncaught browser exceptions');
  assert.deepEqual(browser.consoleErrors, [], 'console errors');
  assert.deepEqual(web.failures, [], 'missing local routes or assets');
  assert.deepEqual(browser.networkErrors.filter(error => error.url?.startsWith(web.origin)), [], 'local network errors');
  const externalErrors = browser.networkErrors.filter(error => error.url && !error.url.startsWith(web.origin));
  const externalFailures = browser.responses.filter(response => response.status >= 400 && !response.url.startsWith(web.origin));
  console.log('HTTP responses:', browser.responses.length, 'local 404s:', web.failures.length);
  if (externalErrors.length || externalFailures.length) {
    console.log('External resource errors:', JSON.stringify([...new Set(externalErrors.map(error => error.error))]),
      [...new Set(externalFailures.map(response => response.status))]);
  }
}

run().catch(error => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  try {
    await browser?.close();
    await web?.close();
  } finally {
    fixtures.forEach(fixture => fixture.close());
  }
}).catch(error => {
  console.error(error);
  process.exitCode = 1;
});
