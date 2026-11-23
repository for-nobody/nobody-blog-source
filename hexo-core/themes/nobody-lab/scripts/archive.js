const { unescapeHTML } = require('hexo-util');

const categories = [
  { key: 'all', label: '全部', icon: 'fa-globe-asia' },
  { key: 'tech', label: '技术', icon: 'fa-laptop-code', position: '--btn-x:68%;--btn-y:48%' },
  { key: 'life', label: '生活', icon: 'fa-heart', position: '--btn-x:14%;--btn-y:30%' },
  { key: 'thought', label: '思考', icon: 'fa-lightbulb', position: '--btn-x:82%;--btn-y:20%' },
  { key: 'tutorial', label: '教程', icon: 'fa-graduation-cap', position: '--btn-x:32%;--btn-y:12%' },
  { key: 'other', label: '其他 / 未分类', icon: 'fa-folder' }
];

const groupsByAlias = new Map(categories.filter(category => category.position).flatMap(({ key, label }) => [
  [key, key], [label, key]
]));

hexo.extend.helper.register('archive_articles', function (posts) {
  const articles = [];
  // Use this route's page.posts for both views. This preserves taxonomy and pagination scope.
  posts?.forEach(post => {
    const names = [];
    const groups = new Set();
    post.categories?.forEach(category => {
      names.push(category.name);
      for (const alias of [category.slug, category.name]) {
        const key = groupsByAlias.get(String(alias || '').trim().toLowerCase());
        if (key) groups.add(key);
      }
    });

    const source = (post.excerpt || post.content || '').replace(
      /<\/(?:p|li|pre|h[1-6])\s*>|<br\s*\/?\s*>/gi, '$& '
    );
    const text = unescapeHTML(this.strip_html(source)).replace(/\s+/gu, ' ').trim();
    const characters = Array.from(text);
    articles.push({
      post,
      names,
      groups: groups.size ? [...groups] : ['other'],
      date: this.date(post.date, 'YYYY-MM-DD'),
      summary: characters.length > 150 ? characters.slice(0, 150).join('') + '…' : text
    });
  });
  return { categories, articles };
});

// The built-in archive generator returns no routes when there are no published posts.
hexo.extend.generator.register('empty_archive', function ({ posts }) {
  if (posts.length) return;
  return {
    path: this.config.archive_dir.replace(/\/+$/, '') + '/',
    layout: 'archive',
    data: { archive: true, posts }
  };
});
