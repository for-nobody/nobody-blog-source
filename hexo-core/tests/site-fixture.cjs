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
const singlePost = {
  slug: 'fixture-single',
  title: '单篇测试文章',
  date: '2026-10-01',
  tags: ['日常', '测试'],
  body: '这篇固定测试文章用于验证 Markdown 到 HTML 的渲染。'
};
const singlePostPath = '/' + singlePost.date.replaceAll('-', '/') + '/' + singlePost.slug + '/';
const fixtureMedia = 'fixture-media';
const fixtureGroups = [
  [], ['Travel'], ['教程'], ['教程'], ['技术'], ['生活'], ['思考'],
  [], ['映射分类'], ['教程'], ['Travel'], ['思考'], ['技术', '生活']
];
const expectedGroups = [
  [], [], ['tutorial'], ['tutorial'], ['tech'], ['life'], ['thought'],
  [], ['tech'], ['tutorial'], [], ['thought'], ['tech', 'life']
];
const expectedArchiveOrder = [13, 12, 11, 10, 9, 8, 7, 6, 5, 3, 4, 2, 1];

function createTemporaryDirectory() {
  return fs.mkdtempSync(path.join(temporaryRoot, 'nobody-stage1-'));
}

function removeTemporaryDirectory(directory) {
  assert.equal(path.dirname(directory), temporaryRoot);
  assert.match(path.basename(directory), /^nobody-stage1-[A-Za-z0-9]+$/);
  fs.rmSync(directory, { recursive: true, force: true, maxRetries: 5 });
}

function writeSinglePost(posts) {
  fs.writeFileSync(path.join(posts, singlePost.slug + '.md'), [
    '---',
    'title: ' + JSON.stringify(singlePost.title),
    'date: ' + singlePost.date + ' 12:00:00',
    'tags: ' + JSON.stringify(singlePost.tags),
    '---',
    singlePost.body,
    ''
  ].join('\n'));
}

function writeManyPosts(posts, media) {
  // These posts share a site day but have different times and straddle the page boundary.
  const sameDayDates = {
    '03': '2026-10-03 02:00:00',
    '04': '2026-10-03 23:45:00'
  };
  for (const [index, categories] of fixtureGroups.entries()) {
    const number = String(index + 1).padStart(2, '0');
    const title = index === 12 ? testTitle : '测试文章 ' + number;
    const date = sameDayDates[number] ?? `2026-10-${number} 12:00:00`;
    const metadata = [
      '---',
      'title: ' + JSON.stringify(title),
      'date: ' + date,
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
      `[关于](../../../../about/) 与 ![测试图片](/${fixtureMedia}/pixel.png)`,
      '',
      '{% post_link fixture-04 %}',
      '',
      '~~~javascript',
      'const line = "' + 'abcd'.repeat(80) + '";',
      '~~~',
      '',
      ...Array(24).fill('用于验证滚动阅读进度的测试段落。\n')
    ];
    fs.writeFileSync(path.join(posts, 'fixture-' + number + '.md'), [...metadata, ...lines].join('\n'));
  }
  fs.mkdirSync(media);
  fs.writeFileSync(path.join(media, 'pixel.png'), Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a5ioAAAAASUVORK5CYII=', 'base64'
  ));
}

function buildFixture(count, prefix = '') {
  assert.ok([0, 1, 13].includes(count), 'unsupported fixture count');
  const directory = createTemporaryDirectory();
  try {
    const projectSource = path.join(project, 'source');
    const fixtureSource = path.join(directory, 'source');
    const fixtureOwned = new Set([path.join(projectSource, '_posts'), path.join(projectSource, fixtureMedia)]);
    fs.cpSync(projectSource, fixtureSource, { recursive: true, filter: file => !fixtureOwned.has(file) });
    const posts = path.join(fixtureSource, '_posts');
    fs.mkdirSync(posts);
    if (count === 1) writeSinglePost(posts);
    if (count === 13) writeManyPosts(posts, path.join(fixtureSource, fixtureMedia));

    for (const name of ['themes', 'scaffolds']) {
      fs.cpSync(path.join(project, name), path.join(directory, name), { recursive: true });
    }
    fs.copyFileSync(path.join(project, 'package.json'), path.join(directory, 'package.json'));
    const config = fs.readFileSync(path.join(project, '_config.yml'), 'utf8')
      .replace(/^url: .+$/m, 'url: http://127.0.0.1' + prefix)
      .replace(/^category_map: *$/m, 'category_map: { 映射分类: tech }');
    fs.writeFileSync(path.join(directory, '_config.yml'), config);
    fs.symlinkSync(path.join(project, 'node_modules'), path.join(directory, 'node_modules'),
      process.platform === 'win32' ? 'junction' : 'dir');

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
  testTitle, lastPost, singlePost, singlePostPath, expectedGroups, expectedArchiveOrder, project
};
