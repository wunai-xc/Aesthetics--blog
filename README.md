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

## 目录结构

```
index.html                 唯一页面：页头、页脚、命令面板、设置面板、加载层
assets/css/tokens.css      设计变量 + 八套配色（[data-palette="..."]）
assets/css/base.css        重置、正文排版、颗粒/氛围光/光标/代码块
assets/css/layout.css      站点骨架：页头、导航、移动菜单、页脚
assets/css/components.css  按钮、卡片、跑马灯、弹层、提示、加载动画
assets/css/views.css       六个视图各自的版式
assets/css/animations.css  关键帧、滚动揭示、路由过渡、动效降级
assets/js/data.js          站点信息、配色表、命令表、文章正文（唯一的数据源）
assets/js/store.js         localStorage 偏好、配色切换、收藏/点赞/阅读进度
assets/js/fx.js            交互引擎：canvas、光标、揭示、3D 倾斜、彩纸、目录
assets/js/views.js         六个视图：home / archive / post / lab / about / 404
assets/js/router.js        Hash 路由 + 三色遮罩过渡
assets/js/app.js           引导层：加载动画、配色面板、设置、命令面板、快捷键
```

## 路由

| Hash | 视图 |
| --- | --- |
| `#/` | 首页 |
| `#/archive`、`#/archive?tag=色彩` | 归档（标签过滤、关键词搜索、卡片/紧凑视图） |
| `#/post/<slug>` | 文章 |
| `#/lab` | 色彩实验室 |
| `#/about` | 关于 |
| 其他 | 404 |

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

## 交互与无障碍约定

- 所有偏好（配色、动效强度、光标、颗粒、氛围光、字号、点赞、收藏、阅读进度）只写 `localStorage`，不做任何网络请求。
- 动效分三档：完整 / 轻量 / 关闭；系统 `prefers-reduced-motion: reduce` 时默认降级为「轻量」，用户仍可手动选「完整」。
- 只动 `transform` 与 `opacity`；滚动读写统一在 `requestAnimationFrame` 内完成；标签页隐藏时停掉 canvas 循环。
- 键盘可达：跳转到正文的 skip link、命令面板方向键导航、`dialog` 原生焦点管理。
