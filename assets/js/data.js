/* ==========================================================================
   data.js — 站点信息、配色系统、文章数据
   纯静态数据层：没有任何请求，全部内联。想加文章就往 AB.POSTS 里追加。
   ========================================================================== */
window.AB = window.AB || {};

/* 站点信息 --------------------------------------------------------------- */
AB.SITE = {
  name: 'AESTHETICS',
  tagline: '色彩即结构',
  description: '一个关于色彩、动效与排版的静态博客：八套配色系统、滚动动效、交互式色彩实验室，零依赖手写。',
  author: 'wunai',
  email: 'hello@aesthetics.blog',
  repo: 'https://github.com/wunai-xc/Aesthetics--blog',
  since: 2019,
  now: '配色系统与滚动叙事的边界'
};

/* 首屏文案 --------------------------------------------------------------- */
AB.HERO = {
  lines: ['把颜色', '排进', '结构里'],
  kicker: ['Static · Interactive', '八套配色系统'],
  sub: '这里没有一张位图。所有封面、纹理与氛围光都是实时算出来的颜色：色块、渐变、噪点，加上随滚动与鼠标呼吸的动效。'
};

/* 配色系统 --------------------------------------------------------------- */
AB.PALETTES = [
  { id: 'void',      name: 'Void',      mood: '深空酸柠', scheme: 'dark',  bg: '#07070a', swatches: ['#c8ff2f', '#6b5cff', '#ff4d6d'] },
  { id: 'bloom',     name: 'Bloom',     mood: '霓虹绽放', scheme: 'dark',  bg: '#0a0513', swatches: ['#ff2fb9', '#00e5ff', '#ffd166'] },
  { id: 'ember',     name: 'Ember',     mood: '余烬',     scheme: 'dark',  bg: '#0d0906', swatches: ['#ff6a13', '#ffe14d', '#ff2e63'] },
  { id: 'abyss',     name: 'Abyss',     mood: '深海',     scheme: 'dark',  bg: '#04121a', swatches: ['#14f1c8', '#ffc857', '#4f8cff'] },
  { id: 'solar',     name: 'Solar',     mood: '正午烈阳', scheme: 'light', bg: '#f6efe3', swatches: ['#ff4b1f', '#1b3bd8', '#ffb703'] },
  { id: 'riso',      name: 'Riso',      mood: '丝网印',   scheme: 'light', bg: '#f3f3ee', swatches: ['#ff5c8a', '#2f6bff', '#ffd400'] },
  { id: 'porcelain', name: 'Porcelain', mood: '瓷白',     scheme: 'light', bg: '#f5f4f8', swatches: ['#4a3aff', '#ff7a9c', '#12b981'] },
  { id: 'mint',      name: 'Mint',      mood: '薄荷',     scheme: 'light', bg: '#ecf6f1', swatches: ['#0f9d63', '#ff6b5e', '#1a5cff'] }
];

/* 站内命令（命令面板用） ------------------------------------------------- */
AB.COMMANDS = [
  { id: 'go-home',    title: '前往：首页',        sub: 'Hash 路由 #/',        icon: '#c8ff2f', run: '#/' },
  { id: 'go-archive', title: '前往：全部文章',    sub: 'Hash 路由 #/archive', icon: '#6b5cff', run: '#/archive' },
  { id: 'go-lab',     title: '前往：色彩实验室',  sub: 'Hash 路由 #/lab',     icon: '#ff4d6d', run: '#/lab' },
  { id: 'go-about',   title: '前往：关于本站',    sub: 'Hash 路由 #/about',   icon: '#ffd166', run: '#/about' },
  { id: 'act-palette', title: '动作：切换下一套配色', sub: '快捷键 P',        icon: '#14f1c8', action: 'palette' },
  { id: 'act-random',  title: '动作：随机生成一套配色', sub: '快捷键 L',      icon: '#ff2fb9', action: 'random-palette' },
  { id: 'act-confetti', title: '动作：撒一把彩纸',  sub: '快捷键 C',          icon: '#ffe14d', action: 'confetti' },
  { id: 'act-settings', title: '动作：打开显示设置', sub: '动效强度 / 光标 / 颗粒', icon: '#4f8cff', action: 'settings' },
  { id: 'act-top',      title: '动作：回到顶部',    sub: '快捷键 G',          icon: '#ff6a13', action: 'top' }
];

/* 文章 ------------------------------------------------------------------- */
AB.POSTS = [
  {
    slug: 'color-as-structure',
    title: '色彩即结构：先把颜色排进网格，再写字',
    kicker: '方法论',
    date: '2026-02-11',
    minutes: 9,
    tags: ['色彩', '排版'],
    excerpt: '大多数人先画版式再上色，结果颜色变成装饰。反过来做——先用三个色相把页面切成区块，字只是落在色块上的附属物。',
    featured: 1,
    cover: ['#c8ff2f', '#6b5cff', '#ff4d6d'],
    body: `
      <p>我做了很多次同一个实验：给朋友一张空白画布，让他们先排文字。十分钟后得到的永远是一个「还算像样」的文档。换一种指令——先铺三块颜色，再把文字放上去——十分钟后得到的通常是某种更锋利的东西。</p>
      <p>原因不复杂：<strong>颜色自带重量</strong>。一块高饱和的色块会立刻占据视觉的首要层级，文字会自动寻找它的位置。版式是从色彩里长出来的，不是反过来。</p>

      <h2>一、三色起步法</h2>
      <p>任何一套配色，先只允许三个角色：</p>
      <ul>
        <li><strong>地色</strong>：占据 60%–70% 面积，决定整页的呼吸感。可以是极深的墨黑，也可以是米白。</li>
        <li><strong>主色</strong>：20%–30%，用于强调、链接、按钮、进度条。它需要与地色有足够的明度差。</li>
        <li><strong>刺激色</strong>：5%–10%，只出现在你需要用户「看一眼」的地方，例如状态点、光标、悬停反馈。</li>
      </ul>
      <p>站内所有配色都是在保证这三个角色的比例关系：任何两套配色切换时，明度差与面积分配都不变，所以整站结构不会走形。</p>

      <blockquote>
        <p>先定面积，再定色相。面积是骨架，色相只是皮肤。</p>
      </blockquote>

      <h2>二、把色块当容器</h2>
      <p>色块一旦承担容器职责，很多排版问题会自动消失：不需要边框、不需要阴影、不需要刻意留白对齐。一个铺满色块的卡片天然就是分组。</p>
      <pre class="code-block" data-lang="css"><code><span class="tok-com">/* 色块即容器：不用边框也能分组 */</span>
<span class="tok-key">.card</span> {
  <span class="tok-val">background</span>: var(--surface);
  <span class="tok-val">border-radius</span>: var(--radius-l);
  <span class="tok-val">padding</span>: var(--space-m);
}
<span class="tok-com">/* 强调块只保留一条边，视觉上仍与卡片相融 */</span>
<span class="tok-key">.card--accent</span> {
  <span class="tok-val">background</span>: linear-gradient(120deg, var(--c1), var(--c2));
  <span class="tok-val">color</span>: var(--on-c1);
}</code></pre>

      <h2>三、明度阶比色相更重要</h2>
      <p>很多「看着脏」的界面不是色相错了，而是明度阶不均匀：主色和地色的对比只有 1.4:1，读起来像隔着一层雾。我的做法是先把主色放到灰度里看——如果灰度版本里三个层级依然清楚，颜色随便挑都不会崩。</p>
      <p>在色彩实验室里可以把任意颜色拆成 11 级明度条，切换配色前先在那里校准一次，比在浏览器里反复试色快得多。</p>

      <h2>四、让颜色动起来，但只动一种关系</h2>
      <p>动效最容易失控的地方，是同时改变了太多属性。我的约束是：<strong>每一次过渡只允许改变一种颜色关系</strong>。要么变亮度，要么变色相，要么变饱和，不要一起上。这样即使动效很多，观感也始终是同一个系统在呼吸。</p>
      <p>例如滚动时的进度条只改宽度、悬停卡片只改边框亮度、切换配色时只做 0.42s 的线性插值——三条独立通道，互不干扰。</p>

      <hr>
      <p>下一篇会把这套比例关系落到具体数值上：字阶、行高、留白与断点如何与色块面积对齐。</p>
    `
  },
  {
    slug: 'motion-for-reading',
    title: '为阅读而动的七个原则',
    kicker: '动效',
    date: '2026-02-03',
    minutes: 11,
    tags: ['动效', '前端'],
    excerpt: '动效不是装饰，它是给阅读指路的灯。七个可以直接照抄的原则，含每一条的反例与对应的 CSS 实现思路。',
    featured: 2,
    cover: ['#ff2fb9', '#00e5ff', '#ffd166'],
    body: `
      <p>一个会动的页面很容易变得吵闹。但阅读本身也是运动：视线在扫、手指在滚、注意力在切换。动效的价值在于<strong>把屏幕的变化讲清楚</strong>，而不是表演。</p>

      <h2>1. 只动刚被你碰过的东西</h2>
      <p>悬停动效必须由指针触发，滚动动效必须有元素进入视口。避免「屏幕自己在演」的画面：自动轮播、自动播放的装饰动画每多一个，读者的专注就少一分。</p>

      <h2>2. 进入一定要比离开慢</h2>
      <p>进入 480ms，离开 220ms。人对出现的东西更有耐心，对消失的东西则希望立刻消失。</p>
      <pre class="code-block" data-lang="css"><code><span class="tok-key">.panel</span> {
  <span class="tok-val">transition</span>: opacity .22s var(--ease-out), transform .22s var(--ease-out);
}
<span class="tok-key">.panel.is-open</span> {
  <span class="tok-val">transition-duration</span>: .48s;
}</code></pre>

      <h2>3. 位移不要超过元素自身高度</h2>
      <p>26px 的上移已经足够让人感觉「它从下面来了」。位移过大会让人误以为发生了页面跳转，滚动位置也会显得被欺骗。</p>

      <h2>4. 给错开的节奏，不给随机的节奏</h2>
      <p>列表项依次出现时使用固定步长（50–70ms），并且只在前 6 个元素加延迟。第七个之后统一同时出现——否则长列表会变成排队等电梯。</p>

      <h2>5. 尊重系统的减动效设置</h2>
      <p>这是硬性要求，不是加分项。除非用户主动在设置里选择「完整」，否则 <code>prefers-reduced-motion</code> 生效时应该直接关掉位移动画与 canvas 背景。</p>

      <h2>6. 一屏之内只留一个焦点</h2>
      <p>如果首屏同时有 canvas 背景、跑马灯、光标跟随、入场动画在跑，读者的眼睛会没有落点。首屏只保留「大标题入场 + 一个持续的氛围层」，其余延后到滚动之后。</p>

      <h2>7. 让滚动本身成为进度指示</h2>
      <p>顶部的进度条、右侧的目录高亮、右下角的环形进度——三者说的是同一件事，却分布在视线自然经过的位置。它们让长文变得可以预期。</p>

      <blockquote>
        <p>好的动效在事后无法被回忆起来，只留下「这个站很好读」的印象。</p>
      </blockquote>

      <h2>性能上的三个底线</h2>
      <ul>
        <li>只动 <code>transform</code> 与 <code>opacity</code>，不动 <code>width</code>、<code>top</code>、<code>box-shadow</code>。</li>
        <li>滚动相关的读写分离：统一在 <code>requestAnimationFrame</code> 里写样式。</li>
        <li>标签页隐藏时停掉所有循环动画。</li>
      </ul>
      <p>本站所有动画都遵守这三条，因此在中端手机上依然是 60fps 的观感。</p>
    `
  },
  {
    slug: 'oklch-practice',
    title: '在浏览器里调和一整套配色：HSL 够用吗',
    kicker: '色彩',
    date: '2026-01-27',
    minutes: 8,
    tags: ['色彩', '前端'],
    excerpt: 'HSL 的亮度不等于感知亮度，蓝色和黄色会骗你。本文给出一个不引入任何依赖的调和流程：HSL 生成、感知校正、再输出成可用的 CSS 变量。',
    featured: 3,
    cover: ['#14f1c8', '#ffc857', '#4f8cff'],
    body: `
      <p>HSL 用起来很舒服：同色相下调整亮度就能得到一串「看起来是一家人」的颜色。但只要换成不同色相，问题就出现了——<code>hsl(240 100% 50%)</code>（纯蓝）比 <code>hsl(60 100% 50%)</code>（纯黄）暗得多，尽管它们的 L 值相同。</p>

      <h2>问题出在亮度不是感知量</h2>
      <p>正确的做法是把亮度换成感知亮度（OKLab / OKLCH），或者在 HSL 的基础上做一次补偿。补偿可以很简单：按色相给亮度加一个与人类视觉灵敏度相关的偏移量。</p>

      <pre class="code-block" data-lang="js"><code><span class="tok-com">// 按色相补偿亮度：黄绿最亮，蓝紫最暗</span>
<span class="tok-key">function</span> perceptualLightness(h, l) {
  <span class="tok-key">const</span> rad = (h * Math.PI) / 180;
  <span class="tok-key">const</span> bias = 0.18 * Math.cos(rad - 1.05); <span class="tok-com">// 峰值在 ~60°</span>
  <span class="tok-key">return</span> Math.min(0.98, Math.max(0.06, l + bias * (1 - l) * 0.9));
}</code></pre>

      <h2>生成一条完整的色阶</h2>
      <p>有了感知补偿，就可以沿着同一条曲线生成 11 级色阶，用来做悬停态、边框、禁用态。关键点是<strong>色相也随亮度轻微漂移</strong>：暗端往冷色偏，亮端往暖色偏。这条规则来自真实颜料混合的直觉，比机械地固定色相好看得多。</p>

      <pre class="code-block" data-lang="css"><code><span class="tok-key">:root</span> {
  --c1-50:  hsl(84 100% 92%);
  --c1-200: hsl(82 100% 76%);
  --c1-500: hsl(78  96% 58%);
  --c1-700: hsl(74  92% 42%);
  --c1-900: hsl(70  88% 26%);
}</code></pre>

      <h2>落地成设计变量</h2>
      <p>真正铺到界面上时，色阶不必全部暴露。一套配色只需要 8 个变量就够：地色、地色第二层、表面、线、正文、次级正文、主色、刺激色。色阶只服务于「状态」——悬停、按下、禁用、选中。</p>

      <h2>在实验室里试</h2>
      <ul>
        <li>拖动色相滑杆，观察同样的明度下颜色「变亮变暗」的错觉；</li>
        <li>用明度条挑一个中间值，再点一下色格复制十六进制值；</li>
        <li>点击调和色，得到互补、分裂互补、三角与四方四组关系，直接当刺激色用。</li>
      </ul>
      <p>实验室是完全离线的：所有颜色都靠 <code>hsl()</code> 与一个 20 行的转换函数算出来，没有任何第三方库。</p>
    `
  },
  {
    slug: 'type-scale-three',
    title: '排版三级秤：字阶、行高与留白怎么互相让步',
    kicker: '排版',
    date: '2026-01-19',
    minutes: 10,
    tags: ['排版', '方法论'],
    excerpt: '字阶不是一堆数字，而是一把秤。字越大行高越紧、字越小行高越松，留白则由字阶的倍率反推出来。',
    featured: 0,
    cover: ['#ff4b1f', '#1b3bd8', '#ffb703'],
    body: `
      <p>排版里最容易出错的地方是「每一项单独看都没问题」。字号选得合理、行高也合理，但排在一起显得松垮——因为它们是各自独立决定的。</p>

      <h2>三级秤：显示、标题、正文</h2>
      <p>一套能长期使用的字阶只需要三级：</p>
      <ul>
        <li><strong>显示级</strong>（clamp 到 3.2–7.6rem）：行高压到 0.92，字距收紧到 -0.03em。它承担视觉冲击，不承担阅读。</li>
        <li><strong>标题级</strong>（1.8–3.6rem）：行高 1.06，字距 -0.02em。</li>
        <li><strong>正文级</strong>（0.95–1.85rem）：行高 1.7–1.85，字距保持在 0 附近。</li>
      </ul>
      <p>中间层不是不能有，而是不要为每个组件单独发明字号。需要更小的文字时，用正文级缩小并配合字距放宽（<code>0.18em</code> 的等宽小标签），而不是再切一刀。</p>

      <h2>让留白从字阶里长出来</h2>
      <p>如果字阶用了比值（本站相邻级约 1.25），留白也应该用同一套比值，只是基数取正文行高。这样标题上方的空隙与它自身的体量天然成比例，滚动时不会出现「突然很空」的一段。</p>

      <pre class="code-block" data-lang="css"><code><span class="tok-key">.prose h2</span> {
  <span class="tok-val">margin-top</span>: var(--space-xl);   <span class="tok-com">/* 3.5rem ≈ 2 倍行高 */</span>
  <span class="tok-val">scroll-margin-top</span>: calc(var(--header-h) + 1.5rem);
}
<span class="tok-key">.prose h2 + p</span> { <span class="tok-val">margin-top</span>: var(--space-2xs); }</code></pre>

      <h2>中文排版的两个补充</h2>
      <ol>
        <li>中文不建议整体字距收紧，改用 <code>letter-spacing: 0.008em</code> 这种极小值，避免字与字粘连。</li>
        <li>中西混排时给拉丁字母单独设置字体，并把行高略微放大；否则数字会显得比汉字矮一截。</li>
      </ol>

      <blockquote>
        <p>字阶是秤，不是梯子。你要的是能称重，不是能爬高。</p>
      </blockquote>

      <p>字号一键切换在设置面板里：小、标准、大、特大。所有尺寸都是相对 <code>--font-scale</code> 计算的，切换时不会破坏版式比例。</p>
    `
  },
  {
    slug: 'noise-and-grain',
    title: '噪点与颗粒：给纯色加一点呼吸',
    kicker: '质感',
    date: '2026-01-08',
    minutes: 6,
    tags: ['质感', '色彩'],
    excerpt: '大面积的纯色在屏幕上会显得死板甚至刺眼，解决办法不是加渐变，而是加一层振幅极小的噪点——用 SVG 滤镜生成，零字节图片。',
    featured: 0,
    cover: ['#ff6a13', '#ffe14d', '#ff2e63'],
    body: `
      <p>屏幕上的纯色是数学意义上的均匀：每一个像素的颜色完全相同。真实世界里几乎不存在这种均匀，所以人眼会本能地觉得它「假」，尤其是大面积高饱和色块。</p>

      <h2>用 SVG 滤镜生成噪点</h2>
      <p>一行 data URI 就够了，不需要任何图片文件：</p>
      <pre class="code-block" data-lang="css"><code><span class="tok-key">.grain</span> {
  <span class="tok-val">position</span>: fixed;
  <span class="tok-val">inset</span>: -50%;
  <span class="tok-val">pointer-events</span>: none;
  <span class="tok-val">mix-blend-mode</span>: soft-light;
  <span class="tok-val">background-image</span>: url("data:image/svg+xml,…feTurbulence…");
  <span class="tok-val">animation</span>: grain-drift 8s steps(6) infinite;
}</code></pre>
      <p>关键是三个参数：<code>baseFrequency≈0.85</code> 控制颗粒粗细，<code>opacity≈0.4</code> 控制强度，<code>steps(6)</code> 让噪点以跳帧的方式移动，像老电影的胶片抖动，而不是平滑漂移。</p>

      <h2>强度取多少</h2>
      <p>把颗粒调到「你能看见，但截图上几乎看不出来」的程度，大约是 4%–8% 的不透明度。再高就变成材质，会抢走文字的注意力。</p>

      <h2>和氛围光配合</h2>
      <p>我另外铺了三团巨大的模糊色块（<code>filter: blur(90px)</code>）在背景，它们负责色彩流动，噪点负责打破均匀，canvas 负责跟随指针的即时反馈。三者叠在一起，颜色就有了空气感。</p>
      <p>这三层都可以在设置面板单独关闭——如果你更偏好绝对干净的纯色，把它们全部关掉即可。</p>
    `
  },
  {
    slug: 'interactive-static',
    title: '静态站点也能全互动：零依赖交互清单',
    kicker: '前端',
    date: '2025-12-21',
    minutes: 13,
    tags: ['前端', '动效'],
    excerpt: '没有框架、没有构建、没有后端，一样可以做到命令面板、路由过渡、滚动追踪、本地收藏与实时配色。这是本站完整的交互清单与实现方式。',
    featured: 0,
    cover: ['#4a3aff', '#ff7a9c', '#12b981'],
    body: `
      <p>「静态」说的是部署方式，不是能力上限。只要不碰服务端，浏览器给你的东西其实相当多。</p>

      <h2>清单：本站实际用到的能力</h2>
      <ul>
        <li><strong>Hash 路由</strong>：<code>#/archive</code>、<code>#/post/slug</code>，刷新与分享都能直达。</li>
        <li><strong>命令面板</strong>：<code>dialog</code> + 键盘上下键 + 简易模糊匹配。</li>
        <li><strong>滚动揭示</strong>：<code>IntersectionObserver</code> 一次性初始化，进入后退场观察。</li>
        <li><strong>阅读进度与目录高亮</strong>：滚动位置映射到标题，右侧目录实时激活。</li>
        <li><strong>本地收藏与点赞</strong>：<code>localStorage</code>，无账号也能记住你读到哪里。</li>
        <li><strong>色彩实验室</strong>：HSL 滑杆、色阶生成、调和色计算，全部实时渲染。</li>
        <li><strong>canvas 氛围与彩纸</strong>：两个 canvas 层，指针驱动与一次性粒子。</li>
      </ul>

      <h2>路由与服务端没关系</h2>
      <pre class="code-block" data-lang="js"><code><span class="tok-key">window</span>.addEventListener(<span class="tok-val">'hashchange'</span>, render);
<span class="tok-key">function</span> parse(hash) {
  <span class="tok-key">const</span> [path, query] = hash.replace(/^#\\/?/, <span class="tok-val">''</span>).split(<span class="tok-val">'?'</span>);
  <span class="tok-key">const</span> [head, tail] = path.split(<span class="tok-val">'/'</span>);
  <span class="tok-key">return</span> { name: head || <span class="tok-val">'home'</span>, param: tail, query: <span class="tok-key">new</span> URLSearchParams(query || <span class="tok-val">''</span>) };
}</code></pre>
      <p>解析出来的是 <code>{ name, param, query }</code>，用它去 <code>AB.views</code> 里取渲染函数即可。整站只有这一处判断路径。</p>

      <h2>过渡动画不需要 View Transitions API</h2>
      <p>三色遮罩（<code>.veil</code>）向下盖住 120ms，换内容，再向上揭开 420ms。视觉上像一次翻页，兼容性比新 API 好得多，代价是 20 行 CSS 与两个类名。</p>

      <h2>把数据写在 JS 里就够了</h2>
      <p>文章内联在 <code>assets/js/data.js</code>：加一篇文章 = 追加一个对象。不需要 JSON 请求（也就没有 <code>file://</code> 下的跨域问题），不需要构建，改完刷新即生效。</p>
      <blockquote>
        <p>能被静态托管的交互，就不要引入运行时。少一层依赖，多一年可维护性。</p>
      </blockquote>
      <p>仓库里没有 <code>node_modules</code>，十几个纯文本文件，克隆下来直接双击 <code>index.html</code> 就能用。</p>
    `
  },
  {
    slug: 'palette-cookbook',
    title: '配色食谱：八套可以直接抄走的色彩系统',
    kicker: '色彩',
    date: '2025-12-05',
    minutes: 7,
    tags: ['色彩', '质感'],
    excerpt: '八套配色，每组三个色相、一个地色，附带使用场景建议。它们已经内置在站点设置里，点一下就能整站替换。',
    featured: 0,
    cover: ['#0f9d63', '#ff6b5e', '#1a5cff'],
    body: `
      <p>下面八套配色都是「三色 + 一地色」结构，覆盖深色与浅色两种取向。切换它们时，本站的版式、动效、对比关系都不会变——只有颜色换人。</p>

      <h2>深色四套</h2>
      <ul>
        <li><strong>Void 深空酸柠</strong>：墨黑 + 酸柠绿 + 电紫。适合工具类、产品落地页，冷峻但有攻击性。</li>
        <li><strong>Bloom 霓虹绽放</strong>：深紫底 + 品红 + 青。适合活动页、音乐与潮流内容。</li>
        <li><strong>Ember 余烬</strong>：近黑棕 + 橙 + 酸黄。适合食品、影像、手作等温暖题材。</li>
        <li><strong>Abyss 深海</strong>：藏青 + 青绿 + 金。适合数据、金融、技术长文。</li>
      </ul>

      <h2>浅色四套</h2>
      <ul>
        <li><strong>Solar 正午烈阳</strong>：米白 + 朱红 + 钴蓝。适合杂志感排版。</li>
        <li><strong>Riso 丝网印</strong>：纸白 + 丝印粉 + 电蓝。适合插画与独立出版。</li>
        <li><strong>Porcelain 瓷白</strong>：瓷白 + 靛蓝 + 玫瑰。适合 SaaS 与文档。</li>
        <li><strong>Mint 薄荷</strong>：浅薄荷 + 森林绿 + 珊瑚。适合健康、教育与生活类。</li>
      </ul>

      <h2>三色怎么分工</h2>
      <ol>
        <li>主色用在需要「点」的地方：链接下划线、进度条、激活态。</li>
        <li>副色承担大面积渐变与氛围光，负责气氛而不抢焦点。</li>
        <li>刺激色只给状态与提示：点赞、错误、彩纸。</li>
      </ol>
      <blockquote>
        <p>配色不是选三个好看的颜色，是选三个各司其职的角色。</p>
      </blockquote>
      <p>在色彩实验室里可以先生成一组随机配色，再点「应用到全站」试一试。每次切换都会写入本地偏好，下次打开仍是你选的那一套。</p>
    `
  }
];

/* 工具：按日期倒序排列、打分搜索 ---------------------------------------- */
AB.sortedPosts = AB.POSTS.slice().sort(function (a, b) {
  return a.date < b.date ? 1 : -1;
});

AB.tagList = (function () {
  var map = {};
  AB.POSTS.forEach(function (post) {
    post.tags.forEach(function (tag) { map[tag] = (map[tag] || 0) + 1; });
  });
  return Object.keys(map).sort().map(function (tag) { return { tag: tag, count: map[tag] }; });
})();

AB.findPost = function (slug) {
  for (var i = 0; i < AB.POSTS.length; i++) {
    if (AB.POSTS[i].slug === slug) return AB.POSTS[i];
  }
  return null;
};

AB.findPalette = function (id) {
  for (var i = 0; i < AB.PALETTES.length; i++) {
    if (AB.PALETTES[i].id === id) return AB.PALETTES[i];
  }
  return null;
};

AB.postIndexOf = function (slug) {
  for (var i = 0; i < AB.sortedPosts.length; i++) {
    if (AB.sortedPosts[i].slug === slug) return i;
  }
  return -1;
};
