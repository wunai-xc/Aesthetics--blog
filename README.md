# AESTHETICS — 纯粹色彩美学博客

一个零依赖的静态博客：八套配色系统、滚动叙事、可交互的色彩实验室。
没有构建步骤、没有框架、没有一张位图——所有封面与氛围光都是 CSS 渐变与 canvas 实时算出来的。

## 运行

```bash
# 方式一：直接双击 index.html（file:// 下也能用，复制功能会走 execCommand 兜底）

# 方式二：起一个静态服务器（推荐，剪贴板与分享 API 在 https/localhost 下才可用）
python3 -m http.server 8080
# 然后打开 http://localhost:8080
```

部署时把整个目录丢到任意静态托管（GitHub Pages / Netlify / 对象存储）即可，无需后端。

页面**不引用任何外部资源**：没有 CDN、没有外链字体、没有图片（favicon 是行内 SVG data URI），
字体全部走系统字体栈（见 `tokens.css` 的 `--font-*`），因此离线打开与国内直连都正常。
想换回 Fraunces / Space Grotesk / JetBrains Mono，把 `index.html` 顶部注释里的那行 `<link>` 放回 `head` 即可。

> ⚠️ 部署后线上页面**会多出一个外部脚本**：Cloudflare Pages 的 Web Analytics 会注入
> `static.cloudflareinsights.com/beacon.min.js`。它不在本仓库里，在 Cloudflare 控制台的
> Web Analytics 里关掉即可——关掉之后页面才是真正的「零外部请求」。

## 目录结构

```
index.html                 唯一页面：页头、页脚、命令面板、设置面板、加载层
assets/css/tokens.css      设计变量 + 八套配色（[data-palette="..."]）
assets/css/base.css        重置、正文排版、颗粒/氛围光/光标/代码块
assets/css/layout.css      站点骨架：页头、导航、移动菜单、页脚
assets/css/components.css  按钮、卡片、跑马灯、弹层、提示、加载动画
assets/css/views.css       各视图版式（归档、文章、实验室、书架、隐私页）
assets/css/animations.css  关键帧、滚动揭示、路由过渡、动效降级
assets/css/glass.css       液态玻璃卡片面：卡片 / 面板 / 弹层共用的一层玻璃（参数在 tokens.css）
assets/js/data.js          站点信息、配色表、命令表、文章正文（唯一的数据源）
assets/js/store.js         localStorage 偏好、配色切换、收藏/点赞/阅读进度
assets/js/fx.js            交互引擎：canvas、光标、揭示、3D 倾斜、彩纸、目录、小节链接
assets/js/views.js         八个视图：home / archive / post / lab / about / saved / privacy / 404
assets/js/router.js        Hash 路由 + 三色遮罩过渡（切换前清掉旧视图的监听）
assets/js/app.js           引导层：加载动画、配色面板、设置、命令面板、快捷键
feed.xml                   手写的 RSS（Hash 路由链接，域名变更时全局替换前缀）
404.html                   服务器级 404（Cloudflare Pages 用它渲染未知路径，不加载 JS）
robots.txt / sitemap.xml   抓取规则与站点地图（只有根地址是规范 URL）
_headers                   Cloudflare Pages 响应头（安全头 + 资源短缓存）
```

## 路由

| Hash | 视图 |
| --- | --- |
| `#/` | 首页 |
| `#/archive`、`#/archive?tag=色彩` | 归档（标签过滤、关键词搜索、卡片/紧凑视图） |
| `#/post/<slug>` | 文章 |
| `#/post/<slug>?s=sec-2` | 文章，并定位到第 2 个小节（由标题旁的 `#` 按钮复制而来） |
| `#/lab` | 色彩实验室 |
| `#/about` | 关于 |
| `#/saved` | 本地书架（收藏 · 点赞 · 在读进度） |
| `#/privacy` | 隐私与数据（列出本机此刻真实存着的值） |
| 其他 | 404 |

`#sec-2` 这类页内锚点不算路由：文章页的目录点击后交给浏览器滚动，不会把视图重新渲染一遍。

## 快捷键

| 键 | 作用 |
| --- | --- |
| `K` / `⌘K` / `Ctrl+K` | 命令面板（搜索文章、标签、配色与命令） |
| `P` | 切换下一套配色 |
| `L` | 随机生成一套配色 |
| `C` | 撒一把彩纸 |
| `G` | 回到顶部 |
| `?` / `⌘,` | 显示设置 |
| `Esc` | 关闭弹层 / 移动菜单 |

隐藏彩蛋：`↑ ↑ ↓ ↓ ← → ← → B A`。

## 本地数据、阅读进度与书架

全部都写在 `localStorage` 的 `aesthetics:prefs:v1` 这一个键里，没有账号也没有同步：

- **阅读进度**：文章页滚动时按比例写入（低于 5% 不记，避免刚点开就显示「已读」），卡片与归档里的进度条读的就是它。
- **回到上次位置**：正文顶部会出现「上次读到 x%」加两个按钮（跳回 / 从头开始），但**不自动跳转**——自动跳会打断刚打开页面的人。
- **本地书架** `#/saved`：汇总收藏、点赞与在读进度，底部可分别清空这三类记录。
- **对比度检查**：色彩实验室底部按 WCAG 相对亮度公式实算 6 组前景/背景的比值（AAA / AA / 仅大字 / 不达标），跟着滑杆与配色实时变化。
- **隐私与数据** `#/privacy`：把本机此刻真实存着的值列成表，并写明站点不做什么。

凡是在浏览器开发者工具里能看到的与这一页不一致的，都算这里写错了。

## 加一篇文章

在 `assets/js/data.js` 的 `AB.POSTS` 里追加一个对象，刷新即可：

```js
{
  slug: 'my-post',              // 用于 #/post/my-post，必须唯一
  title: '标题',
  kicker: '分类标签',
  date: '2026-03-01',           // 归档按此倒序
  minutes: 8,
  tags: ['色彩', '排版'],        // 会出现在归档筛选与标签云里
  excerpt: '列表页摘要。',
  featured: 0,                  // 1/2/3 会进首页「先读这三篇」
  cover: ['#c8ff2f', '#6b5cff', '#ff4d6d'],
  body: `...HTML 片段...`       // 支持 h2/h3 自动生成右侧目录
}
```

代码块用 `<pre class="code-block" data-lang="js|css|html|sh"><code>…</code></pre>`：
`fx.highlight()` 会按 `data-lang` 自动着色（从 `textContent` 重新着色，可重复调用），
`data.js` 里已手写的 `tok-*` 片段只是「关掉 JS 时仍然有色」的兜底版。

加完文章后，顺手在 `feed.xml` 顶部补一个 `<item>`（内容取自 `title` / `date` / `excerpt` / `tags`）。

## 部署（Cloudflare Pages）

线上地址：<https://aeblog.wunai.top>　仓库：<https://github.com/wunai-xc/Aesthetics--blog>

仓库已连接 Cloudflare Pages，改完推 `main` 分支即自动部署。项目设置：

| 项 | 值 |
| --- | --- |
| Framework preset | None |
| Build command | 留空（没有构建步骤） |
| Build output directory | `/`（仓库根目录） |
| Production branch | `main` |

因为用的是 Hash 路由，服务器只需要提供 `index.html`，**不需要** `_redirects` 把路径回退到入口文件。
未知路径由根目录的 `404.html` 渲染（该文件里所有资源引用都是根绝对路径 `/assets/…`：
404 响应会带着原始 URL 返回，相对路径会被解析到错误的位置）。

### 部署与 SEO 的现实

- **每篇文章没有独立 URL。** `#/post/<slug>` 里的片段不会发给服务器，搜索引擎也不把它当作独立页面收录。
  所以 `sitemap.xml` 只声明了根地址，`robots.txt` 允许全站抓取。
- 想让每篇文章各自可被索引，需要把路由从 hash 改成路径（`/post/<slug>`），再在 Pages 上加一条
  `/* /index.html 200` 的 `_redirects` 回退；`router.js` 的解析、`feed.xml` 与 `sitemap.xml` 的链接要一起改。
- RSS 里的链接是绝对地址，换域名时全局替换 `https://aeblog.wunai.top/` 前缀即可（`feed.xml`、`sitemap.xml`、`robots.txt` 三处）。

## 交互与无障碍约定

- 所有偏好（配色、动效强度、光标、颗粒、氛围光、字号、点赞、收藏、阅读进度）只写 `localStorage`，不做任何网络请求。
- 动效分三档：完整 / 轻量 / 关闭；系统 `prefers-reduced-motion: reduce` 时默认降级为「轻量」，用户仍可手动选「完整」。
- 只动 `transform` 与 `opacity`；滚动读写统一在 `requestAnimationFrame` 内完成；标签页隐藏时停掉 canvas 循环。
- 键盘可达：跳转到正文的 skip link、命令面板方向键导航、`dialog` 原生焦点管理。
- 卡片表面统一走 `glass.css` 的液态玻璃层（`backdrop-filter`）：不支持虚化、系统开了「减少透明度」
  （`prefers-reduced-transparency: reduce`）或动效关闭时，自动换成更实的底色，正文对比度不靠玻璃撑。
