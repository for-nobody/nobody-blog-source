# nobody-lab

> 在确定性之外，寻找未被命名的可能。—— nobody，即无限。

nobody-lab 是个人博客与项目展示站，使用 Hexo、自定义 EJS 主题和原生 CSS、JavaScript。

## 本地开发

需要 Node.js 20.19 或更新版本及 npm。在仓库根目录运行以下命令。

```sh
cd hexo-core
npm ci
npm run server
```

在浏览器打开 `http://localhost:4000/`。用 `npm run clean` 清理生成结果，再用 `npm run build` 生成静态站点到 `hexo-core/public/`。依赖版本由 `hexo-core/package-lock.json` 锁定。Git 会忽略本地依赖、生成页面和 Hexo 数据库。

| 路由 | 内容 |
| --- | --- |
| `/` | 首页 |
| `/about/` | 关于及技能展示 |
| `/archives/` | 文章归档、树状分类、筛选和分页 |
| `/projects/` | 项目展示及分类 |
| `/年/月/日/文章路径/` | 文章详情，可进入分类与标签归档 |

### 界面

页脚可在 Apple v2 与 Acid v3 间切换，首次访问默认使用 Acid v3。主导航中的主题按钮单独控制明暗模式，首次访问跟随系统。浏览器在 `nobody-lab-version` 和 `nobody-lab-theme` 中分别保存两项设置。主题位于 `hexo-core/themes/nobody-lab/`，其 `layout/` 和 `source/` 分别存放模板与资源。`_design_backup/` 保存迁移前的静态原型，供视觉与交互参考。

### 写文章

从 `hexo-core/` 执行 `npx hexo new post "文章标题"`，然后编辑 `source/_posts/` 中生成的 Markdown。以下 front matter 示例为同一篇文章设置两个并列分类。

```yaml
---
title: 文章标题
date: 2026-01-10 12:00:00
categories:
  - [技术]
  - [教程]
tags: [Hexo]
---
```

文章归档、分类页和标签页按站点日历日期降序排列，同一天按源文件名升序排列，再按所属路由分页。树状面板和筛选均作用于当前页。分类名称或 slug 匹配 `技术 / tech`、`生活 / life`、`思考 / thought` 或 `教程 / tutorial` 时归入对应组，英文大小写不敏感。一篇文章可同时进入多组。其余分类与未分类文章可通过「其他 / 未分类」及「全部」找到。标签仍可从文章详情进入独立归档。

### 验证

在 `hexo-core/` 运行 `npm test`，检查干净生成结果、路由、链接及 0、1、13 篇文章的边界。用 `npm run test:browser` 在已安装的 Chrome 或 Edge 中运行浏览器用例。若浏览器安装在自定义路径，将 `CHROME_BIN` 设为可执行文件路径。两套测试均使用隔离的临时站点及锁文件中的依赖，浏览器用例通过回环地址访问测试站点。

## 部署状态

`hexo-core/_config.yml` 的 `url` 目前为 `http://example.com`。生产地址、自定义域名、GitHub Pages 发布方式和上线 SEO 均待部署阶段确认。开发任务和验收记录见 [tasks/README.md](tasks/README.md)。

## 许可

网站源码依据 [MIT License](LICENSE) 授权。本站文章、博文、图片及文字内容按 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh) 授权，转载与改作须署名、限非商业使用，并以相同协议共享衍生作品。
