const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const { test } = require('node:test');
const { JSDOM } = require('jsdom');
const {
  buildFixture, page, testTitle, lastPost, singlePost, singlePostPath, expectedGroups, expectedArchiveOrder, project
} = require('./site-fixture.cjs');

function cards(document) {
  return [...document.querySelectorAll('.article-card-waterfall')];
}

function cardPaths(document) {
  return cards(document).map(card => card.querySelector('h2 a').getAttribute('href'));
}

function fixtureNumbers(document) {
  return cardPaths(document).map(href => Number(href.match(/\/fixture-(\d{2})\/$/)[1]));
}

function inspectOutput(fixture) {
  const routes = fs.readdirSync(fixture.publicDir, { recursive: true })
    .filter(name => name.endsWith('.html')).map(name => name.replaceAll(path.sep, '/'));
  for (const route of routes) {
    const url = new URL(fixture.prefix + '/' + route.replace(/index\.html$/, ''), 'http://127.0.0.1');
    const html = fs.readFileSync(path.join(fixture.publicDir, route), 'utf8');
    const { document } = new JSDOM(html, { url }).window;
    assert.equal(document.querySelectorAll('main').length, 1, route);
    assert.equal(document.querySelectorAll('h1').length, 1, route);
    assert.equal(document.querySelectorAll('.glass-nav-vertical [aria-current]').length, 1, route);
    assert.equal(document.querySelectorAll('a[href="#"]').length, 0, route);
    const ids = [...document.querySelectorAll('[id]')].map(element => element.id);
    assert.equal(new Set(ids).size, ids.length, 'duplicate IDs in ' + route);
    const bootstrap = document.querySelector('script[data-acid-style]');
    const links = [...document.querySelectorAll('a[href], link[href], script[src], img[src]')]
      .map(element => element.getAttribute('href') ?? element.getAttribute('src'))
      .concat(Object.values(bootstrap.dataset));
    for (const value of links) {
      const link = new URL(value, url);
      if (link.origin !== url.origin) continue;
      assert.ok(link.pathname.startsWith(fixture.prefix + '/'), value);
      assert.doesNotMatch(link.pathname, /\/(?:about|articles|projects)\.html$/);
      const relative = decodeURIComponent(link.pathname.slice(fixture.prefix.length));
      const target = path.join(fixture.publicDir, relative.endsWith('/') ? relative + 'index.html' : relative);
      assert.ok(fs.existsSync(target), route + ' has missing link: ' + value);
    }
  }
  return routes;
}

test('JS syntax and four version files', () => {
  for (const name of ['site.js', 'script-v2.js', 'script-v3.js']) {
    execFileSync(process.execPath, ['--check', path.join(project, 'themes/nobody-lab/source', name)]);
  }
  for (const name of ['style-v2.css', 'style-v3.css']) {
    assert.ok(fs.statSync(path.join(project, 'themes/nobody-lab/source', name)).size);
  }
});

test('zero posts render the home, archive empty state, about and projects', t => {
  const fixture = buildFixture(0);
  t.after(fixture.close);
  assert.equal(inspectOutput(fixture).length, 4);
  const archive = page(fixture, '/archives/');
  assert.equal(archive.querySelector('.archive-empty').textContent.trim(), '暂无文章。');
  assert.deepEqual(cardPaths(archive), []);
  assert.equal(archive.querySelector('#articlesTree'), null);
});

test('one fixture post is visible and linked under all and other', t => {
  const fixture = buildFixture(1);
  t.after(fixture.close);
  assert.equal(inspectOutput(fixture).length, 9);
  const archive = page(fixture, '/archives/');
  assert.deepEqual(cardPaths(archive), [singlePostPath]);
  assert.equal(cards(archive)[0].dataset.category, 'other');
  assert.equal(archive.querySelector('.droplet-article'), null);
  assert.equal(archive.querySelector('article[hidden]'), null);
  const post = page(fixture, singlePostPath);
  assert.equal(post.querySelector('h1').textContent, singlePost.title);
  assert.equal(post.querySelector('time').dateTime, singlePost.date);
  assert.equal(post.querySelector('.post-content p').textContent, singlePost.body);
  assert.deepEqual([...post.querySelectorAll('.post-taxonomies li')].map(li => li.textContent.trim()), singlePost.tags);
});

test('13 posts, same-day ordering, taxonomy mapping, pagination, escaped text and nested base paths', t => {
  const fixture = buildFixture(13, '/preview/blog');
  t.after(fixture.close);
  const routes = inspectOutput(fixture);
  assert.ok(!routes.includes('page/2/index.html'), 'landing page is not paginated');
  const first = page(fixture, '/archives/');
  const second = page(fixture, '/archives/page/2/');
  assert.deepEqual([cards(first).length, cards(second).length], [10, 3]);
  assert.equal(first.querySelector('[rel=next]').getAttribute('href'), fixture.prefix + '/archives/page/2/');
  assert.equal(second.querySelector('[rel=prev]').getAttribute('href'), fixture.prefix + '/archives/');
  const allCards = [...cards(first), ...cards(second)];
  assert.deepEqual(fixtureNumbers(first), expectedArchiveOrder.slice(0, 10));
  assert.deepEqual(fixtureNumbers(second), expectedArchiveOrder.slice(10));
  const latePost = fixture.prefix + '/2026/10/03/fixture-04/';
  assert.equal(cardPaths(second)[0], latePost);
  for (const [index, card] of allCards.entries()) {
    const expected = expectedGroups[expectedArchiveOrder[index] - 1];
    assert.deepEqual(card.dataset.category.split(' ').sort(), expected.length ? [...expected].sort() : ['other']);
  }
  assert.deepEqual([...first.querySelectorAll('.tree-category')].map(group => [
    group.dataset.category,
    [...group.querySelectorAll('.droplet-title')].map(link => link.getAttribute('href'))
  ]), ['tech', 'life', 'thought', 'tutorial'].map(key => [
    key,
    cards(first).filter(card => card.dataset.category.split(' ').includes(key))
      .map(card => card.querySelector('h2 a').getAttribute('href'))
  ]));
  assert.ok(!first.querySelector('note'));
  assert.equal(first.querySelector('.card-glass-body h2').textContent, testTitle);
  const summary = first.querySelector('.card-glass-body p');
  assert.match(summary.textContent, /摘要 粗体 & <示例>/);
  assert.equal(summary.children.length, 0);
  assert.equal(Array.from(summary.textContent).length, 151);

  const detail = page(fixture, lastPost);
  assert.equal(detail.querySelector('h1').textContent, testTitle);
  assert.equal(detail.querySelector('meta[property="og:title"]').content, testTitle + ' | nobody-lab');
  assert.equal(detail.querySelector('note'), null);
  assert.equal(detail.querySelector('time').dateTime, '2026-10-13');
  assert.ok(detail.querySelector('.post-content h2'));
  assert.ok(detail.querySelector('.post-content .highlight pre'));
  assert.ok(detail.querySelector('.post-content img'));
  assert.ok(detail.querySelector(`.post-content a[href="${latePost}"]`));
  const taxonomy = [...detail.querySelectorAll('.post-taxonomies a')].map(a => [
    a.textContent, a.getAttribute('href')
  ]);
  for (const [name, href] of taxonomy) {
    const archive = page(fixture, decodeURIComponent(href.slice(fixture.prefix.length)));
    assert.equal(archive.querySelector('h1').textContent.trim(), name);
    assert.ok(cardPaths(archive).includes(fixture.prefix + lastPost));
  }
  for (const route of ['/archives/2026/', '/archives/2026/10/', '/tags/标签/']) {
    assert.deepEqual(fixtureNumbers(page(fixture, route)), expectedArchiveOrder.slice(0, 10), route);
    assert.deepEqual(fixtureNumbers(page(fixture, route + 'page/2/')), expectedArchiveOrder.slice(10), route);
  }
  const tagged = page(fixture, '/tags/标签/page/2/');
  assert.equal(tagged.querySelector('h1').textContent.trim(), '标签');
  assert.deepEqual(fixtureNumbers(page(fixture, '/categories/教程/')), [10, 3, 4]);
});
