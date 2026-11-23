# 任务目标：Hexo 博客全站 UI 迁移与双版本 UI 架构重构

## 🌟 1. 背景与当前状态
当前项目根目录下有两个核心文件夹：
1. `website_demo/`：包含了我手写的静态页面（HTML/CSS/JS）。其中包含了**双版本 UI 架构**（`style-v2.css`/`script-v2.js` 和 `style-v3.css`/`script-v3.js`），通过 `localStorage` 和底部的开关进行动态切换。
2. `articles/`：这是我初始化的 Hexo 博客根目录。目前我已经在 `themes/nobody-lab/` 下创建了自定义主题，并在 `layout/` 中初步提取了基础的 `layout.ejs`、`index.ejs` 和 `page.ejs`。

**核心诉求：**
请帮我完成剩余网页的 Hexo 模板化，将项目文件夹重构为统一规范的目录。**特别注意：必须完美保留原本的双版本 UI 切换功能（v2 和 v3 动态加载）。**

---

## 2. 执行步骤指令

请严格按照以下步骤执行代码重构与迁移：

### 步骤 1：重构与统一项目目录
1. 在根目录创建一个新文件夹 `Nobody-Blog`。
2. 将现有的 `articles/` 文件夹移动到 `Nobody-Blog/` 下，并重命名为 `hexo-core/`。
3. 将 `website_demo/` 文件夹移动到 `Nobody-Blog/` 下，并重命名为 `_design_backup/`（作为设计原型的备份）。
*(后续所有 Hexo 相关的路径操作，请在 `Nobody-Blog/hexo-core/` 下进行)*

### 步骤 2：保留双版本静态资源 (source)
1. 检查 `hexo-core/themes/nobody-lab/source/` 目录。
2. **不要重命名文件**，请确保将 `_design_backup/` 中的 `style-v2.css`、`style-v3.css`、`script-v2.js`、`script-v3.js` 这 4 个核心文件全部复制并保留在 `source/` 目录下。

### 步骤 3：升级全局骨架注入双版本切换逻辑 (layout.ejs)
打开 `hexo-core/themes/nobody-lab/layout/layout.ejs`，进行以下动态渲染的修改：
1. **动态加载 CSS**：在 `<head>` 中，替换原有的固定 CSS 链接，改为兼容 Hexo 路径的动态加载脚本：
   ```html
   <script>
       (function(){
           var v = localStorage.getItem('nobody-lab-version') || 'v3';
           var cssPath = '<%- url_for("/") %>style-' + v + '.css';
           document.write('<link rel="stylesheet" href="' + cssPath + '">');
       })();
   </script>

   ```

2. **植入切换开关**：将 `_design_backup/index.html` 页脚中的 `<div class="version-switch-container">...</div>` 完整 HTML 提取出来，放到 `layout.ejs` 的 `<footer class="footer-minimal">` 内部，让全站所有页面都能切换 UI。
3. **动态加载 JS**：在 `</body>` 标签前，使用同样的逻辑动态加载 JS：
```html
<script>
    (function(){
        var v = localStorage.getItem('nobody-lab-version') || 'v3';
        var jsPath = '<%- url_for("/") %>script-' + v + '.js';
        document.write('<script src="' + jsPath + '"><\\/script>');
    })();
</script>

```



### 步骤 4：完成文章列表页动态化 (archive.ejs)

1. 在 `hexo-core/themes/nobody-lab/layout/` 下新建 `archive.ejs`。
2. 提取 `_design_backup/articles.html` 中 `<main class="articles-main">` 的外层结构。
3. 找到 `<div class="articles-waterfall">` 容器，**删除内部写死的文章卡片**。
4. 在容器内部使用 Hexo 的 EJS 语法 `<% page.posts.each(function(post, i){ %>` 遍历文章。
5. 在循环内部，构建动态的 `.card-glass-surface` 文章卡片：
* 动态绑定文章标题：`<%= post.title %>`
* 动态绑定文章链接：`<%- url_for(post.path) %>`
* 动态绑定日期：`<%= date(post.date, 'YYYY-MM-DD') %>`
* (可选) 根据循环索引 `i` 赋予卡片 `card-size-lg/md/sm` 来维持瀑布流错落感。



### 步骤 5：新增文章详情页模板 (post.ejs)

1. 新建 `hexo-core/themes/nobody-lab/layout/post.ejs`。
2. 构建一个 `<main class="about-main">`（借用此布局限制最大宽度）。
3. 顶部使用 `<h1><%= page.title %></h1>` 展示标题。
4. 使用 `<div class="post-content glass-card"><%- page.content %></div>` 来承载并渲染 Markdown 正文内容。

### 步骤 6：完成“项目”独立页面 (projects)

1. 在 `hexo-core/themes/nobody-lab/layout/` 新建 `projects.ejs`。
2. 将 `_design_backup/projects.html` 中 `<main class="projects-main">` 以及右侧标签栏 `<div class="project-tag-sidebar">` 的全部 HTML 代码复制进 `projects.ejs`。
3. 在终端执行 `hexo new page projects` 生成独立页面。
4. 打开生成的 `hexo-core/source/projects/index.md`，在 Front-matter 中添加 `layout: projects`，强制该页面使用刚才创建的模板。

---

## 3. 验收标准

请逐一完成上述步骤并告诉我。最终我运行 `hexo server` 时：

1. 网站能够正常启动且目录结构整洁（`Nobody-Blog` 为根）。
2. 在任意页面（首页、文章、项目），点击底部的 Version Toggle 开关，页面能刷新并完美在 Apple v2 纯净风格和 Acid v3 酸性风格之间切换。
3. Hexo 能正常解析并循环输出 markdown 文章列表和详情页。
