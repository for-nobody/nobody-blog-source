# nobody-lab 🌌

> 在确定性之外，寻找未被命名的可能。—— nobody，即无限。

**nobody-lab** 是我的个人博客与项目展示站点，一个关于技术、生活与思考的独立空间。

## ✨ 特性

- 🌓 **暗色/亮色主题切换** —— 支持手动切换，默认深色模式
- 📱 **响应式设计** —— 适配桌面端与移动端
- 🧭 **毛玻璃导航栏** —— 固定在左上角的垂直导航
- 📖 **阅读进度条** —— 实时显示页面阅读进度
- 🚀 **纯静态站点** —— 零依赖，原生 HTML / CSS / JavaScript 构建
- 🔗 **SEO 友好** —— Open Graph / Twitter Card 元标签

## 🛠 技术栈

| 类别 | 技术 |
|------|------|
| 结构 | HTML5 |
| 样式 | CSS3（多版本主题：`style.css` / `style-v2.css` / `style-v3.css`） |
| 脚本 | 原生 JavaScript（多版本：`script.js` / `script-v2.js` / `script-v3.js`） |
| 图标 | [Font Awesome 6.5](https://fontawesome.com/) (CDN) |
| 开发环境 | VS Code + AI API |

## 📁 项目结构

```
website_demo/
├── index.html          # 首页
├── about.html          # 关于我
├── articles.html       # 文章列表
├── projects.html       # 项目展示
├── style.css           # 样式 v1
├── style-v2.css        # 样式 v2
├── style-v3.css        # 样式 v3（当前默认）
├── script.js           # 脚本 v1
├── script-v2.js        # 脚本 v2
├── script-v3.js        # 脚本 v3（当前默认）
├── .gitignore          # Git 忽略规则
└── README.md           # 项目说明
```

> 版本通过 `localStorage` 中的 `nobody-lab-version` 键控制，默认加载 `v3`。

## 🚀 本地运行

这是一个纯静态网站，无需任何构建工具或服务器。直接用浏览器打开 `index.html` 即可：

```bash
# 方式一：双击打开
start index.html

# 方式二：使用 VS Code Live Server 扩展
# 右键 index.html → "Open with Live Server"

# 方式三：Python 简易服务器
python -m http.server 8080
# 访问 http://localhost:8080
```

## 📄 页面说明

| 页面 | 路径 | 说明 |
|------|------|------|
| 首页 | `index.html` | 博客入口，展示最新动态与概览 |
| 关于我 | `about.html` | 个人介绍与技能标签 |
| 文章 | `articles.html` | 技术文章列表 |
| 项目 | `projects.html` | 项目展示（C++、算法、解决方案等） |

## 📝 License

本项目采用**双协议**，针对不同内容分别授权：

### 🖥️ 网站源码

本站所有 HTML / CSS / JavaScript 代码基于 **[MIT License](LICENSE)** 开源。

```
MIT License

Copyright (c) 2026 nobody-lab

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

### 📝 文章及内容

本站所有文章、博文、图片及文字内容遵循 **[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh)** 协议。

| 标识 | 含义 |
|------|------|
| **BY**（署名） | 转载时必须注明原作者及出处 |
| **NC**（非商业性使用） | 不得将内容用于商业目的 |
| **SA**（相同方式共享） | 基于此内容创作的衍生作品须采用相同协议发布 |

> 简单来说：你可以自由分享、转载我的文章，但**必须署名、不能商用、且须以相同协议分享**。

---

*Made with ❤️ by nobody-lab*
