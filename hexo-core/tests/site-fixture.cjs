const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { JSDOM } = require('jsdom');

const project = path.resolve(__dirname, '..');
const temporaryRoot = fs.realpathSync(os.tmpdir());
const testTitle = '长标题 <note> & "引号" ' + '可重复验证'.repeat(35);
const lastPost = '/2026/10/13/fixture-13/';
const realPost = '/2026/07/05/first/';
const fixtureGroups = [
  [], ['Travel'], [], ['教程'], ['技术'], ['生活'], ['思考'],
  [], ['映射分类'], ['教程'], ['Travel'], ['思考'], ['技术', '生活']
];
const expectedGroups = [
  [], [], [], ['tutorial'], ['tech'], ['life'], ['thought'],
  [], ['tech'], ['tutorial'], [], ['thought'], ['tech', 'life']
];

function createTemporaryDirectory() {
  return fs.mkdtempSync(path.join(temporaryRoot, 'nobody-stage1-'));
}

function removeTemporaryDirectory(directory) {
  assert.equal(path.dirname(directory), temporaryRoot);
  assert.match(path.basename(directory), /^nobody-stage1-[A-Za-z0-9]+$/);
  fs.rmSync(directory, { recursive: true, force: true, maxRetries: 5 });
}

function writeManyPosts(directory) {
  const posts = path.join(directory, 'source', '_posts');
  fs.rmSync(path.join(posts, 'first.md'));
  for (const [index, categories] of fixtureGroups.entries()) {
    const day = String(index + 1).padStart(2, '0');
    const title = index === 12 ? testTitle : '测试文章 ' + day;
    const metadata = [
      '---',
      'title: ' + JSON.stringify(title),
      'date: 2026-10-' + day + ' 12:00:00',
      'categories: ' + JSON.stringify(categories.map(category => [category])),
      'tags: ["标签", "verification"]',
      '---',
      ''
    ];
    const lines = [
      '摘要 **粗体** &amp; &lt;示例&gt; ' + '超长摘要'.repeat(45),
      '',
      '<!-- more -->',
      '',
      '## Markdown 小节',
      '',
      '[关于](../../../../about/) 与 ![测试图片](/media/pixel.png)',
      '',
      '~~~javascript',
      'const line = "' + 'abcd'.repeat(80) + '";',
      '~~~',
      '',
      ...Array(24).fill('用于验证滚动阅读进度的测试段落。\n')
    ];
    fs.writeFileSync(path.join(posts, 'fixture-' + day + '.md'), [...metadata, ...lines].join('\n'));
  }
  const media = path.join(directory, 'source', 'media');
  fs.mkdirSync(media);
  fs.writeFileSync(path.join(media, 'pixel.png'), Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5ioAAAAASUVORK5CYII=', 'base64'
  ));
}

function buildFixture(count, prefix = '') {
  const directory = createTemporaryDirectory();
  try {
    for (const name of ['source', 'themes', 'scaffolds']) {
      fs.cpSync(path.join(project, name), path.join(directory, name), { recursive: true });
    }
    fs.copyFileSync(path.join(project, 'package.json'), path.join(directory, 'package.json'));
    const config = fs.readFileSync(path.join(project, '_config.yml'), 'utf8')
      .replace(/^url: .+$/m, 'url: http://127.0.0.1' + prefix)
      .replace(/^category_map: *$/m, 'category_map: { 映射分类: tech }');
    fs.writeFileSync(path.join(directory, '_config.yml'), config);
    fs.symlinkSync(path.join(project, 'node_modules'), path.join(directory, 'node_modules'),
      process.platform === 'win32' ? 'junction' : 'dir');
    if (count === 0) fs.rmSync(path.join(directory, 'source', '_posts', 'first.md'));
    if (count === 13) writeManyPosts(directory);
    assert.ok([0, 1, 13].includes(count), 'unsupported fixture count');

    const cli = path.join(project, 'node_modules', 'hexo', 'bin', 'hexo');
    const build = execFileSync(process.execPath, [cli, 'generate'], { cwd: directory, encoding: 'utf8' });
    assert.ok(!/^ERROR\b/m.test(build), build);
    return {
      publicDir: path.join(directory, 'public'),
      prefix,
      build,
      close: () => removeTemporaryDirectory(directory)
    };
  } catch (error) {
    removeTemporaryDirectory(directory);
    throw error;
  }
}

function page(fixture, route) {
  const target = path.join(fixture.publicDir, route, 'index.html');
  const url = new URL(fixture.prefix + route, 'http://127.0.0.1');
  return new JSDOM(fs.readFileSync(target, 'utf8'), { url }).window.document;
}

module.exports = {
  buildFixture, page, createTemporaryDirectory, removeTemporaryDirectory,
  testTitle, lastPost, realPost, expectedGroups, project
};
