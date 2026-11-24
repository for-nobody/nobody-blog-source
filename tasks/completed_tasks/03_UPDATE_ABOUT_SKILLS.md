# 03 · 更新「关于我」页的技能星图

状态：`COMPLETED`

请先读 `tasks/README.md`，检查当前工作树，将本任务标记为 `IN_PROGRESS`，然后直接实施并验收。

## 页面修改

编辑 `hexo-core/themes/nobody-lab/layout/about.ejs` 中的 `.skills-constellation`。Apple v2 和 Acid v3 共用这份模板。

| 位置 | 要求 |
| --- | --- |
| 区块标题 | 将「技能展示示例」改为「技能」，保留标题两侧的 ◆ 装饰。 |
| 原 Vue.js 节点 | 在原位将标签改为 `QT`，同时替换 `fa-vuejs` 图标。 |
| 新技能 | 在 Docker 之后追加一个独立的 `NGINX` 节点。 |

保留 React、Node.js、Python、数据库、Docker 五个节点及其顺序。QT 和 NGINX 沿用现有节点样式，可用 `Qt` 和 `N` 字标作为图形。用户未提供新技能的熟练度，避免为它们填写百分比。

桌面星图通过 `--node-x`、`--node-y` 定位。为 NGINX 选择有足够空隙的位置，并沿用现有虚线样式与相邻节点相连。窄屏沿用现有换行布局。仅在模板调整不足时修改对应主题样式。

## 验收与归档

1. 在 `hexo-core/` 运行 `npm run build` 和 `npm test`，记录结果。
2. 打开本地 `/about/`，核对技能区标题为「技能」。区内应恰有七个节点，QT 与 NGINX 各出现一次，原 Vue.js 标签与图标均已移除。
3. 在 Apple v2 和 Acid v3 的亮色、暗色模式下检查图标与标签均清晰可读。分别用桌面和手机宽度查看星图，确认新增节点完整可见，悬停时不会遮住相邻标签，窄屏换行后无裁切或横向溢出。
4. 按 `tasks/README.md` 将实际结果回填到本文件。全部通过后标记为 `COMPLETED` 并移入 `tasks/completed_tasks/`。仍有失败或未测项时，保留在 `tasks/` 并注明原因。

## 执行记录

| 项目 | 状态 | 命令、环境或观察结果 |
| --- | --- | --- |
| 实际修改文件 | PASS | `hexo-core/themes/nobody-lab/layout/about.ejs` 更新标题和节点，NGINX 位于 `(32%, 82%)` 并以虚线连接 Python。`source/style-v2.css` 调整 Apple v2 亮色图标对比度。`source/site.css` 为窄屏头像轨道预留旋转空间。 |
| 构建与现有测试 | PASS | 在 `hexo-core/` 执行 `npm.cmd run build`、`npm.cmd test`，均退出 0。修改前后的现有静态测试均为 4/4。 |
| 标题、七项标签及图标 | PASS | 本地 `/about/` 返回 HTTP 200。标题为「技能」，保留两侧 ◆。顺序为 QT、React、Node.js、Python、数据库、Docker、NGINX。旧 Vue.js 标签和图标已移除，新增 `Qt` 和 `N` 字标，两个节点均无熟练度条。 |
| 双主题亮暗模式、桌面与窄屏布局 | PASS | Chrome 157.0.8103.80 实测 Apple v2、Acid v3 各自亮暗模式，在 1440×900、390×844、320×800 共 12 个组合均完整显示图标和标签。桌面验证连线端点与 28 次逐节点悬停，所有相邻标签均可见。手机上节点换行，页面无横向溢出。 |

2026-11-24（Australia/Brisbane），Windows PowerShell、Node v26.13.1、npm 11.20.0。首次手机检查发现已有头像轨道旋转时会扩大横向滚动范围，限制窄屏头像尺寸后复测通过。Apple v2 亮色截图中原浅色图标在悬停后对比度偏低，切换至该主题的深色文字后检查了普通和悬停状态。四种外观的桌面、390 px 手机及桌面 NGINX 悬停截图共 12 张，保存在本地 `$env:TEMP/nobody-task03-2SDIaa/`。
