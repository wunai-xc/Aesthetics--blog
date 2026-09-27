/* ==========================================================================
   views.js — 六个视图：首页 / 归档 / 文章 / 色彩实验室 / 关于 / 404
   每个视图返回 { title, html, mount(root) }
   ========================================================================== */
(function () {
  var views = {};
  AB.views = views;

  /* ---------------------------------------------------------------- 工具 */
  function esc(str) {
    return String(str).replace(/[&<>"]/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
    });
  }

  function dateLabel(date) {
    return String(date).replace(/-/g, ' · ');
  }

  function chars(text) {
    return text.split('').map(function (ch) {
      return ch === ' ' ? ' ' : '<span class="word">' + esc(ch) + '</span>';
    }).join('');
  }

  function coverMarkup(post, index) {
    var c = post.cover || ['#c8ff2f', '#6b5cff', '#ff4d6d'];
    var gradient = 'linear-gradient(' + (105 + (index || 0) * 14) + 'deg,' + c[0] + ' 0%,' + c[1] + ' 54%,' + c[2] + ' 100%)';
    return '<span class="cover-art" data-cover-hue style="--cover:' + gradient + '"></span>' +
           '<span class="cover-grid"></span><span class="cover-stripes"></span>';
  }

  function tagsMarkup(post, variant) {
    return post.tags.map(function (tag, i) {
      var cls = 'tag-pill' + (variant === 'flat' ? '' : (i === 0 ? ' t1' : (i === 1 ? '' : ' t3')));
      return '<span class="' + cls + '">' + esc(tag) + '</span>';
    }).join('');
  }

  function postCard(post, opts) {
    var o = opts || {};
    var index = o.index || 0;
    var cls = 'card';
    if (o.feature) cls += ' card-feature span-2';
    if (o.wide) cls += ' card-wide';
    var num = ('0' + (index + 1)).slice(-2);
    /* 阅读进度只记在本地；低于 5% 不显示，免得刚点开就出现「已读」 */
    var ratio = o.read ? AB.store.readRatio(post.slug) : 0;
    var pct = Math.round(ratio * 100);
    var readMark = ratio >= 0.05
      ? '<span class="read-track" aria-hidden="true"><span style="width:' + pct + '%"></span></span>'
      : '';
    var readFlag = ratio >= 0.05
      ? '<span class="read-flag"><i aria-hidden="true"></i>' + (pct >= 97 ? '已读完' : '已读 ' + pct + '%') + '</span>'
      : '';
    return '' +
      '<article class="' + cls + '" data-tilt data-tilt-depth="' + (o.feature ? 3 : 5) + '" data-reveal="up" data-reveal-delay="' + (o.delay || 0) + '">' +
        '<a class="card-link" href="#/post/' + post.slug + '" aria-label="阅读：' + esc(post.title) + '"></a>' +
        readMark +
        '<div class="card-media">' + coverMarkup(post, index) + '<span class="card-media-num">' + num + '</span></div>' +
        '<div class="card-body">' +
          '<div class="card-meta">' + tagsMarkup(post, 'flat') + '</div>' +
          '<h3 class="card-title">' + esc(post.title) + '</h3>' +
          '<p class="card-excerpt">' + esc(post.excerpt) + '</p>' +
          '<div class="card-meta"><span>' + dateLabel(post.date) + '</span><span class="dot">/</span><span>' + post.minutes + ' 分钟</span>' + readFlag + '</div>' +
        '</div>' +
      '</article>';
  }

  function paletteCard(palette) {
    return '' +
      '<button class="palette-card" type="button" data-palette-apply="' + palette.id + '" data-palette-id="' + palette.id + '" aria-label="使用配色 ' + esc(palette.name) + '">' +
        '<span class="palette-swatches"><i style="background:' + palette.swatches[0] + '"></i><i style="background:' + palette.swatches[1] + '"></i><i style="background:' + palette.swatches[2] + '"></i></span>' +
        '<span class="palette-name">' + esc(palette.name) + '</span>' +
        '<span class="palette-mood">' + esc(palette.mood) + ' · ' + (palette.scheme === 'light' ? '浅色' : '深色') + '</span>' +
      '</button>';
  }

  function marqueeTrack(items) {
    return items.map(function (item, i) {
      return (i % 2 === 1) ? '<span aria-hidden="true">' + item + '</span>' : '<span>' + esc(item) + '</span>';
    }).join('');
  }

  function bindPalettes(root) {
    AB.fx.qsa('[data-palette-apply]', root).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-palette-apply');
        AB.store.setPalette(id);
        var p = AB.findPalette(id);
        AB.fx.toast('已切换到 ' + (p ? p.name + ' · ' + p.mood : id), p ? p.swatches[0] : null);
      });
    });
  }

  /* ================================================================ 首页 */
  views.home = function () {
    var featured = AB.sortedPosts.filter(function (p) { return p.featured > 0; });
    var rest = AB.sortedPosts.filter(function (p) { return !(p.featured > 0); }).slice(0, 6);

    var lines = AB.HERO.lines.map(function (line, i) {
      var content = i === 1 ? '<em>' + chars(line) + '</em>' : chars(line);
      return '<span class="line-mask" data-reveal="fade" data-reveal-delay="' + (0.08 * i).toFixed(2) + '"><span>' + content + '</span></span>';
    }).join('');

    var figures = [
      { label: 'C1', color: 'var(--c1)' },
      { label: 'C2', color: 'var(--c2)' },
      { label: 'C3', color: 'var(--c3)' }
    ].map(function (f) {
      return '<div class="hero-figure" title="色彩角色"><span style="--fc:' + f.color + '">' + f.label + '</span></div>';
    }).join('');

    var html = '' +
      '<section class="hero">' +
        '<div class="container hero-inner">' +
          '<p class="hero-kicker" data-reveal="fade">' +
            '<span class="badge-live"><i aria-hidden="true"></i>已上线</span>' +
            '<span>' + esc(AB.HERO.kicker[0]) + '</span>' +
            '<span aria-hidden="true">✳</span>' +
            '<span>' + esc(AB.HERO.kicker[1]) + '</span>' +
          '</p>' +
          '<h1 class="hero-title">' + lines + '</h1>' +
          '<p class="hero-sub" data-reveal="up" data-reveal-delay="0.3">' + esc(AB.HERO.sub) + '</p>' +
          '<div class="hero-actions" data-reveal="up" data-reveal-delay="0.4">' +
            '<a class="btn btn-primary" href="#/archive" data-magnetic>开始阅读<span class="btn-arrow">→</span></a>' +
            '<a class="btn btn-outline" href="#/lab" data-magnetic>打开色彩实验室</a>' +
            '<span class="scroll-cue"><span class="cue-line" aria-hidden="true"></span>向下滚动</span>' +
          '</div>' +
          '<div class="hero-figures" data-reveal="up" data-reveal-delay="0.5">' + figures + '</div>' +
        '</div>' +
        '<div class="container">' +
          '<div class="hero-marquee">' +
            '<div class="marquee marquee-xl" data-marquee data-speed="1.2">' +
              '<div class="marquee-track">' + marqueeTrack(['色彩即结构', '✳', '排版三级秤', '✳', '零依赖交互', '✳', '滚动即叙事', '✳']) + '</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</section>' +

      '<section class="section container">' +
        '<div class="section-head" data-reveal="up">' +
          '<div class="spread">' +
            '<div>' +
              '<p class="eyebrow">精选</p>' +
              '<h2>先读这三篇<span class="thin">，它们决定了整站的颜色逻辑</span></h2>' +
            '</div>' +
            '<a class="btn btn-ghost" href="#/archive">全部文章<span class="btn-arrow">→</span></a>' +
          '</div>' +
        '</div>' +
        '<div class="post-grid" data-stagger>' +
          featured.map(function (post, i) {
            return postCard(post, { feature: i === 0, index: i, delay: (i * 0.07).toFixed(2) });
          }).join('') +
        '</div>' +
      '</section>' +

      '<section class="section container">' +
        '<div class="rail">' +
          '<div class="quote-flat" data-reveal="up">' +
            '<p>颜色不是装饰，它是页面的骨架。先把色块铺满网格，文字才知道自己该站在哪里。</p>' +
            '<cite>— ' + esc(AB.SITE.name) + ' 设计笔记</cite>' +
          '</div>' +
          '<div class="stack" data-reveal="up" data-reveal-delay="0.1">' +
            '<div class="cluster" style="gap:var(--space-l)">' +
              '<div class="stat"><span class="stat-value" data-count="' + AB.POSTS.length + '">0</span><span class="stat-label">篇文章</span></div>' +
              '<div class="stat"><span class="stat-value" data-count="' + AB.PALETTES.length + '">0</span><span class="stat-label">套配色</span></div>' +
              '<div class="stat"><span class="stat-value" data-count="' + AB.tagList.length + '">0</span><span class="stat-label">个标签</span></div>' +
              '<div class="stat"><span class="stat-value">0</span><span class="stat-label">个运行时依赖</span></div>' +
            '</div>' +
            '<div class="divider" aria-hidden="true"></div>' +
            '<p class="mono-label">结构约定</p>' +
            '<ul class="text-dim">' +
              '<li>1 个 HTML 文件，6 层 CSS：变量 → 基础 → 骨架 → 组件 → 视图 → 动效</li>' +
              '<li>6 个 JS 模块：数据 / 状态 / 动效引擎 / 视图 / 路由 / 引导</li>' +
              '<li>一套配色 = 19 个 CSS 变量，换色时版式与明度对比关系不变</li>' +
              '<li>正文内联在 data.js：加一篇 = 追加一个对象，刷新即生效</li>' +
            '</ul>' +
            '<p class="text-dim" data-reveal="up">没有框架、没有构建步骤、没有一张位图。所有封面与氛围光都是 CSS 渐变与 canvas 实时算出来的。</p>' +
          '</div>' +
        '</div>' +
      '</section>' +

      '<section class="section container">' +
        '<div class="section-head" data-reveal="up">' +
          '<div class="spread">' +
            '<div>' +
              '<p class="eyebrow">色彩系统</p>' +
              '<h2>八套配色<span class="thin">，点一下整站换血</span></h2>' +
            '</div>' +
            '<a class="btn btn-outline" href="#/lab" data-magnetic>进入实验室<span class="btn-arrow">→</span></a>' +
          '</div>' +
        '</div>' +
        '<div class="palette-grid" data-stagger data-reveal="up">' + AB.PALETTES.map(paletteCard).join('') + '</div>' +
        '<p class="form-note" style="margin-top:var(--space-s)">当前配色：<span data-current-palette-name>' + esc(AB.store.current().name) + '</span>　·　偏好会保存在本地</p>' +
      '</section>' +

      '<section class="section container">' +
        '<div class="section-head" data-reveal="up">' +
          '<p class="eyebrow">长期笔记</p>' +
          '<h2>更多文章<span class="thin">，关于动效、排版与前端实现</span></h2>' +
        '</div>' +
        '<div class="post-grid" data-stagger>' + rest.map(function (post, i) {
          return postCard(post, { index: i + 3, delay: (i * 0.06).toFixed(2) });
        }).join('') + '</div>' +
      '</section>' +

      '<section class="section container">' +
        '<div class="rail">' +
          '<div class="stack" data-reveal="up">' +
            '<p class="eyebrow">更新</p>' +
            '<h2>没有邮件列表<br>只有一条 RSS</h2>' +
            '<p class="lede">纯静态站点没有后端，订阅框填了也发不出去，所以这里不放表单。想第一时间看到新文章就订阅 RSS；不想订阅，收藏这个页面也一样。</p>' +
            '<div class="cluster">' +
              '<a class="btn btn-outline" href="feed.xml">订阅 RSS<span class="btn-arrow">→</span></a>' +
              '<a class="btn btn-ghost" href="#/archive">浏览全部文章</a>' +
            '</div>' +
          '</div>' +
          '<div class="stack" data-reveal="up" data-reveal-delay="0.1">' +
            '<p class="mono-label">正在写</p>' +
            '<p class="lede"><span class="accent-1" data-type="' + esc(AB.SITE.now) + '|把动效做成语法而不是装饰|色块面积与字阶的换算表">' + '</span><span class="accent-1" aria-hidden="true">▌</span></p>' +
            '<p class="form-note">平均每月一到两篇。写完会出现在 <a href="#/archive">文章列表</a> 里，也会进 <code>feed.xml</code>。</p>' +
          '</div>' +
        '</div>' +
      '</section>';

    return {
      title: AB.SITE.name + ' — ' + AB.SITE.tagline,
      html: html,
      mount: function (root) {
        bindPalettes(root);
      }
    };
  };

  /* ================================================================ 归档 */
  views.archive = function (query) {
    var activeTag = query && query.get('tag') ? query.get('tag') : '';

    var html = '' +
      '<section class="archive-head container">' +
        '<p class="eyebrow" data-reveal="fade">Index</p>' +
        '<h1 class="archive-title" data-reveal="up">全部文章 <span class="thin text-dim">' + AB.POSTS.length + ' 篇</span></h1>' +
        '<p class="lede" data-reveal="up" data-reveal-delay="0.08">按时间倒序。可以按标签过滤、用关键词搜索，或切换成紧凑列表视图；搜索与过滤都在浏览器里完成，读过的文章会带上本地阅读进度。</p>' +
      '</section>' +

      '<section class="container">' +
        '<div class="archive-tools" data-reveal="up">' +
          '<div class="field archive-search">' +
            '<label class="visually-hidden" for="archiveSearch">搜索文章</label>' +
            '<input class="input" id="archiveSearch" type="search" placeholder="搜索标题、摘要或标签…" autocomplete="off">' +
          '</div>' +
          '<div class="view-toggle" role="group" aria-label="列表密度">' +
            '<button type="button" class="is-active" data-view="grid">卡片</button>' +
            '<button type="button" data-view="compact">紧凑</button>' +
          '</div>' +
          '<div class="view-toggle" role="group" aria-label="排序">' +
            '<button type="button" class="is-active" data-sort="desc">最新优先</button>' +
            '<button type="button" data-sort="asc">最早优先</button>' +
          '</div>' +
          '<p class="archive-count" data-count-label></p>' +
        '</div>' +
        '<div class="filter-row" data-reveal="up" data-reveal-delay="0.06">' +
          '<button type="button" class="chip" data-tag="">全部<span class="chip-num">' + AB.POSTS.length + '</span></button>' +
          AB.tagList.map(function (item) {
            return '<button type="button" class="chip" data-tag="' + esc(item.tag) + '">' + esc(item.tag) + '<span class="chip-num">' + item.count + '</span></button>';
          }).join('') +
        '</div>' +
        '<div class="archive-list" data-archive-list></div>' +
      '</section>';

    return {
      title: '全部文章 — ' + AB.SITE.name,
      html: html,
      mount: function (root) {
        var list = AB.fx.qs('[data-archive-list]', root);
        var search = AB.fx.qs('#archiveSearch', root);
        var countLabel = AB.fx.qs('[data-count-label]', root);
        var chips = AB.fx.qsa('[data-tag]', root);
        var viewBtns = AB.fx.qsa('[data-view]', root);
        var sortBtns = AB.fx.qsa('[data-sort]', root);
        var state = {
          tag: activeTag,
          text: '',
          view: 'grid',
          sort: 'desc'
        };

        function matches(post) {
          if (state.tag && post.tags.indexOf(state.tag) === -1) return false;
          if (!state.text) return true;
          var hay = (post.title + ' ' + post.excerpt + ' ' + post.tags.join(' ') + ' ' + post.kicker).toLowerCase();
          return hay.indexOf(state.text) > -1;
        }

        function sortPosts(posts) {
          return posts.slice().sort(function (a, b) {
            return state.sort === 'desc' ? (a.date < b.date ? 1 : -1) : (a.date < b.date ? -1 : 1);
          });
        }

        function render(animateFlip) {
          var before = {};
          if (animateFlip) {
            AB.fx.qsa('[data-slug]', list).forEach(function (el) {
              before[el.getAttribute('data-slug')] = el.getBoundingClientRect();
            });
          }

          var posts = sortPosts(AB.POSTS.filter(matches));
          list.classList.toggle('is-compact', state.view === 'compact');
          if (!posts.length) {
            list.innerHTML = '<div class="archive-empty"><p>没有匹配的文章。</p><p class="form-note">试试清空搜索，或选择「全部」标签。</p></div>';
            if (countLabel) countLabel.textContent = '0 篇';
            return;
          }
          list.innerHTML = posts.map(function (post, i) {
            return '<div data-slug="' + post.slug + '">' + postCard(post, { wide: true, index: i, read: true, delay: (Math.min(i, 5) * 0.05).toFixed(2) }) + '</div>';
          }).join('');

          if (countLabel) {
            var readCount = posts.filter(function (p) { return AB.store.readRatio(p.slug) >= 0.95; }).length;
            countLabel.textContent = posts.length + ' 篇' + (state.tag ? ' · ' + state.tag : '') + (state.text ? ' · “' + state.text + '”' : '') + (readCount ? ' · 已读完 ' + readCount : '');
          }

          if (animateFlip && !(AB.store.get('motion') === 'off')) {
            AB.fx.qsa('[data-slug]', list).forEach(function (el) {
              var prev = before[el.getAttribute('data-slug')];
              var now = el.getBoundingClientRect();
              if (!prev) {
                el.style.animation = 'rise-in .5s var(--ease-out) both';
                return;
              }
              var dx = prev.left - now.left;
              var dy = prev.top - now.top;
              if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return;
              el.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
              el.style.transition = 'none';
              window.requestAnimationFrame(function () {
                el.style.transition = 'transform .5s var(--ease-out)';
                el.style.transform = '';
              });
            });
          }

          AB.fx.reveal(list);
          AB.fx.tilt(list);
        }

        chips.forEach(function (chip) {
          if (chip.getAttribute('data-tag') === state.tag) chip.classList.add('is-active');
          chip.addEventListener('click', function () {
            state.tag = chip.getAttribute('data-tag') || '';
            chips.forEach(function (c) { c.classList.toggle('is-active', c === chip); });
            if (window.history && window.history.replaceState) {
              var hash = '#/archive' + (state.tag ? '?tag=' + encodeURIComponent(state.tag) : '');
              /* file:// 或隐私模式下 replaceState 可能抛错，过滤本身不依赖它 */
              try { window.history.replaceState(null, '', hash); } catch (err) { /* 忽略 */ }
            }
            render(true);
          });
        });

        if (search) {
          var timer = 0;
          search.addEventListener('input', function () {
            window.clearTimeout(timer);
            timer = window.setTimeout(function () {
              state.text = (search.value || '').trim().toLowerCase();
              render(true);
            }, 130);
          });
          AB.fx.pending(function () { window.clearTimeout(timer); });
        }

        viewBtns.forEach(function (btn) {
          btn.addEventListener('click', function () {
            state.view = btn.getAttribute('data-view');
            viewBtns.forEach(function (b) { b.classList.toggle('is-active', b === btn); });
            render(false);
          });
        });

        sortBtns.forEach(function (btn) {
          btn.addEventListener('click', function () {
            state.sort = btn.getAttribute('data-sort');
            sortBtns.forEach(function (b) { b.classList.toggle('is-active', b === btn); });
            render(true);
          });
        });

        render(false);
      }
    };
  };

  /* ================================================================ 文章 */
  views.post = function (slug) {
    var post = AB.findPost(slug);
    if (!post) return views.notfound();

    var index = AB.postIndexOf(slug);
    var prev = AB.sortedPosts[index + 1];
    var next = AB.sortedPosts[index - 1];
    var liked = AB.store.has('likes', slug);
    var saved = AB.store.has('saved', slug);
    var related = AB.sortedPosts.filter(function (p) {
      return p.slug !== slug && p.tags.some(function (t) { return post.tags.indexOf(t) > -1; });
    }).slice(0, 3);

    var html = '' +
      '<article data-article>' +
        '<header class="post-head container">' +
          '<p class="post-breadcrumb"><a href="#/">首页</a><span aria-hidden="true">/</span><a href="#/archive">文章</a><span aria-hidden="true">/</span><span>' + esc(post.kicker) + '</span></p>' +
          '<div class="cluster" data-reveal="fade">' + tagsMarkup(post, 'flat') + '</div>' +
          '<h1 class="post-title" data-reveal="up">' + esc(post.title) + '</h1>' +
          '<div class="post-meta" data-reveal="up" data-reveal-delay="0.08">' +
            '<span>' + dateLabel(post.date) + '</span><span aria-hidden="true">·</span>' +
            '<span>' + post.minutes + ' 分钟阅读</span><span aria-hidden="true">·</span>' +
            '<span>' + esc(AB.SITE.author) + '</span>' +
          '</div>' +
          '<div class="post-hero" data-reveal="up" data-reveal-delay="0.14">' + coverMarkup(post, index) + '</div>' +
          '<div class="post-actions" data-reveal="fade">' +
            '<button class="btn btn-sm like-btn' + (liked ? ' is-liked' : '') + '" type="button" data-like aria-pressed="' + (liked ? 'true' : 'false') + '">' +
              '<svg class="heart" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20s-7-4.6-7-9.5A4.2 4.2 0 0 1 12 7a4.2 4.2 0 0 1 7 3.5C19 15.4 12 20 12 20z"/></svg>' +
              '<span data-like-label>' + (liked ? '已点赞' : '点赞') + '</span>' +
            '</button>' +
            '<button class="btn btn-sm' + (saved ? ' btn-primary' : ' btn-outline') + '" type="button" data-save>' + (saved ? '已收藏' : '收藏') + '</button>' +
            '<button class="btn btn-sm btn-outline" type="button" data-share>复制链接</button>' +
            '<span class="text-dim" style="font-size:var(--step--2)">阅读进度会保存在本地</span>' +
          '</div>' +
        '</header>' +

        '<div class="post-layout container">' +
          '<div class="prose" data-prose>' + post.body + '</div>' +
          '<aside class="post-aside">' +
            '<nav class="post-toc" data-toc aria-label="文章目录">' +
              '<h2>目录</h2>' +
              '<ol data-toc-list></ol>' +
            '</nav>' +
          '</aside>' +
        '</div>' +

        '<footer class="post-foot container">' +
          '<h2 class="mono-label">相关阅读</h2>' +
          '<div class="related-grid" data-stagger>' +
            (related.length ? related.map(function (p, i) {
              return postCard(p, { index: i, delay: (i * 0.06).toFixed(2) });
            }).join('') : '<p class="text-dim">这是这个标签下的唯一一篇。</p>') +
          '</div>' +
          '<div class="post-nav">' +
            (prev ? '<a class="post-nav-card" href="#/post/' + prev.slug + '" style="--cover:linear-gradient(100deg,' + prev.cover[0] + ',' + prev.cover[1] + ',' + prev.cover[2] + ')"><span>← 上一篇</span><b>' + esc(prev.title) + '</b></a>' : '') +
            (next ? '<a class="post-nav-card" href="#/post/' + next.slug + '" style="--cover:linear-gradient(100deg,' + next.cover[0] + ',' + next.cover[1] + ',' + next.cover[2] + ')"><span>下一篇 →</span><b>' + esc(next.title) + '</b></a>' : '') +
          '</div>' +
          '<div class="divider" aria-hidden="true"></div>' +
          '<div class="spread">' +
            '<div>这篇看完了。列表里还有 ' + (AB.POSTS.length - 1) + ' 篇关于色彩、动效与排版的笔记。</div>' +
            '<a class="btn btn-outline" href="#/archive" data-magnetic>回到文章列表</a>' +
          '</div>' +
        '</footer>' +
      '</article>';

    return {
      title: post.title + ' — ' + AB.SITE.name,
      html: html,
      mount: function (root) {
        /* 给标题加锚点并生成目录 */
        var prose = AB.fx.qs('[data-prose]', root);
        var tocList = AB.fx.qs('[data-toc-list]', root);
        if (prose && tocList) {
          var headings = AB.fx.qsa('h2, h3', prose);
          headings.forEach(function (heading, i) {
            heading.id = 'sec-' + (i + 1);
          });
          tocList.innerHTML = headings.map(function (heading, i) {
            var level = heading.tagName.toLowerCase();
            return '<li class="lvl-' + level + '"><a href="#sec-' + (i + 1) + '">' + esc(heading.textContent) + '</a></li>';
          }).join('');
          if (!headings.length) {
            var aside = AB.fx.qs('.post-aside', root);
            if (aside) aside.style.display = 'none';
          }
        }

        /* 点赞 / 收藏 / 分享 */
        var likeBtn = AB.fx.qs('[data-like]', root);
        if (likeBtn) {
          likeBtn.addEventListener('click', function () {
            var nowLiked = AB.store.toggleList('likes', post.slug);
            likeBtn.classList.toggle('is-liked', nowLiked);
            likeBtn.setAttribute('aria-pressed', nowLiked ? 'true' : 'false');
            var label = likeBtn.querySelector('[data-like-label]');
            if (label) label.textContent = nowLiked ? '已点赞' : '点赞';
            if (nowLiked) {
              var rect = likeBtn.getBoundingClientRect();
              AB.fx.confetti({ x: rect.left + rect.width / 2, y: rect.top, count: 60 });
              AB.fx.toast('谢谢，已记在本地');
            }
          });
        }

        var saveBtn = AB.fx.qs('[data-save]', root);
        if (saveBtn) {
          saveBtn.addEventListener('click', function () {
            var nowSaved = AB.store.toggleList('saved', post.slug);
            saveBtn.textContent = nowSaved ? '已收藏' : '收藏';
            saveBtn.classList.toggle('btn-primary', nowSaved);
            saveBtn.classList.toggle('btn-outline', !nowSaved);
            AB.fx.toast(nowSaved ? '已加入本地收藏' : '已从收藏移除');
          });
        }

        AB.fx.readingProgress(root, post.slug);
        AB.fx.toc(root);
        if (AB.fx.setPostMode) AB.fx.setPostMode(true);
        AB.fx.pending(function () {
          if (AB.fx.setPostMode) AB.fx.setPostMode(false);
        });
      }
    };
  };

  /* ============================================================ 色彩实验室 */
  views.lab = function () {
    var lab = { h: 268, s: 82, l: 58, scheme: 'dark' };
    AB.views.labState = lab;

    var html = '' +
      '<section class="lab-head container">' +
        '<p class="eyebrow" data-reveal="fade">Color Lab</p>' +
        '<h1 class="lab-hero-title" data-reveal="up">色彩实验室<span class="thin text-dim"> · 全部在浏览器里算出来</span></h1>' +
        '<p class="lede" data-reveal="up" data-reveal-delay="0.08">拖动滑杆调和一种颜色，看它展开成完整的明度阶；点任意色格复制十六进制值；满意了就把它应用成整站主色。</p>' +
      '</section>' +

      '<section class="section-tight container">' +
        '<div class="lab-grid">' +

          '<div class="lab-panel" data-reveal="up">' +
            '<h2>调和一种颜色</h2>' +
            '<p>HSL 三轴：色相决定性格，饱和决定强度，明度决定它在页面里的层级。</p>' +
            '<div class="lab-live" data-lab-live>' +
              '<span class="lab-live-label">实时色块 · 拖动滑杆</span>' +
            '</div>' +
            '<div class="stack" style="margin-top:var(--space-s)">' +
              '<div class="slider slider-hue">' +
                '<div class="slider-top"><span>色相 H</span><span data-lab-h-val>268°</span></div>' +
                '<input type="range" min="0" max="360" value="268" data-lab="h" aria-label="色相">' +
              '</div>' +
              '<div class="slider slider-sat">' +
                '<div class="slider-top"><span>饱和 S</span><span data-lab-s-val>82%</span></div>' +
                '<input type="range" min="0" max="100" value="82" data-lab="s" aria-label="饱和度">' +
              '</div>' +
              '<div class="slider slider-lit">' +
                '<div class="slider-top"><span>明度 L</span><span data-lab-l-val>58%</span></div>' +
                '<input type="range" min="4" max="96" value="58" data-lab="l" aria-label="明度">' +
              '</div>' +
            '</div>' +
            '<div class="lab-readout" style="margin-top:var(--space-s)">' +
              '<span class="lab-hex" data-lab-hex>#6b5cff</span>' +
              '<button class="btn btn-sm btn-outline" type="button" data-lab-copy>复制 HEX</button>' +
              '<button class="btn btn-sm btn-outline" type="button" data-lab-copy-hsl>复制 HSL</button>' +
            '</div>' +
            '<div class="seg" style="margin-top:var(--space-s)" role="group" data-lab-scheme>' +
              '<button type="button" class="is-active" data-scheme="dark">深色底</button>' +
              '<button type="button" data-scheme="light">浅色底</button>' +
            '</div>' +
            '<div class="cluster" style="margin-top:var(--space-s)">' +
              '<button class="btn btn-primary btn-sm" type="button" data-lab-apply>以此色为主色应用全站</button>' +
              '<button class="btn btn-sm btn-outline" type="button" data-lab-random>随机主色</button>' +
            '</div>' +
          '</div>' +

          '<div class="lab-panel" data-reveal="up" data-reveal-delay="0.08">' +
            '<h2>明度阶</h2>' +
            '<p>感知亮度并不等于 HSL 的 L。<span class="accent-1">点一下色格复制它的值</span>——同一条色相下，这些值是悬停、边框、禁用态的基础。</p>' +
            '<div class="lab-scale" data-lab-scale></div>' +
            '<h2 style="margin-top:var(--space-m)">调和色</h2>' +
            '<p>互补、分裂互补、三角与四方。挑一个当刺激色，页面立刻有了对立面。</p>' +
            '<div class="harmony-row" data-lab-harmony></div>' +
            '<h2 style="margin-top:var(--space-m)">当前配色变量</h2>' +
            '<div class="swatch-strip" data-lab-vars></div>' +
            '<div class="cluster" style="margin-top:var(--space-s)">' +
              '<button class="btn btn-sm btn-outline" type="button" data-lab-copy-vars>复制 CSS 变量</button>' +
            '</div>' +
          '</div>' +

        '</div>' +
      '</section>' +

      '<section class="section container">' +
        '<div class="section-head" data-reveal="up">' +
          '<div class="spread">' +
            '<div>' +
              '<p class="eyebrow">预设</p>' +
              '<h2>八套现成配色<span class="thin">，点一下整站换血</span></h2>' +
            '</div>' +
            '<button class="btn btn-outline" type="button" data-action="random-palette">随机整套配色</button>' +
          '</div>' +
        '</div>' +
        '<div class="palette-grid lab-palettes" data-stagger data-reveal="up">' + AB.PALETTES.map(paletteCard).join('') + '</div>' +
      '</section>' +

      '<section class="section container">' +
        '<div class="rail">' +
          '<div class="quote-flat" data-reveal="up">' +
            '<p>先定面积，再定色相；先定明度阶，再给颜色起名字。</p>' +
            '<cite>— 实验室手册 · 第一条</cite>' +
          '</div>' +
          '<div class="stack" data-reveal="up" data-reveal-delay="0.08">' +
            '<h2>这些颜色从哪来</h2>' +
            '<p class="text-dim">每一套配色都是「一地色 + 三色相」结构：主色负责指示、副色负责氛围、刺激色负责状态。切换它们时版式与对比关系保持不变，所以整站结构不会走形。</p>' +
            '<p class="text-dim">实验室里生成的颜色会写入 19 个 CSS 变量并保存在本地。刷新页面后依然是你选的那一套。</p>' +
            '<a class="btn btn-ghost" href="#/archive">去看配色方法论<span class="btn-arrow">→</span></a>' +
          '</div>' +
        '</div>' +
      '</section>';

    return {
      title: '色彩实验室 — ' + AB.SITE.name,
      html: html,
      mount: function (root) {
        var live = AB.fx.qs('[data-lab-live]', root);
        var hexOut = AB.fx.qs('[data-lab-hex]', root);
        var hVal = AB.fx.qs('[data-lab-h-val]', root);
        var sVal = AB.fx.qs('[data-lab-s-val]', root);
        var lVal = AB.fx.qs('[data-lab-l-val]', root);
        var scaleHost = AB.fx.qs('[data-lab-scale]', root);
        var harmonyHost = AB.fx.qs('[data-lab-harmony]', root);
        var varsHost = AB.fx.qs('[data-lab-vars]', root);
        var sliders = {
          h: AB.fx.qs('[data-lab="h"]', root),
          s: AB.fx.qs('[data-lab="s"]', root),
          l: AB.fx.qs('[data-lab="l"]', root)
        };

        function hsl(h, s, l) {
          return 'hsl(' + Math.round(h) + ' ' + Math.round(s) + '% ' + Math.round(l) + '%)';
        }
        function hex(h, s, l) {
          return AB.store.hslToHex(h, s, l);
        }
        function textColor(h, s, l) {
          return l > 62 ? 'rgba(0,0,0,.62)' : 'rgba(255,255,255,.86)';
        }

        function current() {
          return {
            h: parseFloat(sliders.h.value),
            s: parseFloat(sliders.s.value),
            l: parseFloat(sliders.l.value)
          };
        }

        function renderScale() {
          var c = current();
          var out = '';
          for (var i = 0; i < 11; i++) {
            var l = 96 - i * 9;
            out += '<button type="button" data-hex="' + hex(c.h, c.s, l) + '" style="background:' + hsl(c.h, c.s, l) + ';color:' + textColor(c.h, c.s, l) + '" title="复制 ' + hex(c.h, c.s, l) + '">' + Math.round(l) + '</button>';
          }
          scaleHost.innerHTML = out;
        }

        function renderHarmony() {
          var c = current();
          var rows = [
            { label: '互补', h: c.h + 180 },
            { label: '分裂 A', h: c.h + 150 },
            { label: '分裂 B', h: c.h + 210 },
            { label: '三角', h: c.h + 120 },
            { label: '四方', h: c.h + 90 }
          ];
          harmonyHost.innerHTML = rows.map(function (row) {
            var value = hex(row.h, c.s, c.l);
            return '<button type="button" data-harmony="' + row.h + '" data-hex="' + value + '" style="background:' + hsl(row.h, c.s, c.l) + ';color:' + textColor(row.h, c.s, c.l) + '" title="点击设为刺激色">' + row.label + '<br>' + value + '</button>';
          }).join('');
        }

        function renderVars() {
          var cs = getComputedStyle(document.documentElement);
          var names = ['--bg', '--bg-2', '--surface', '--surface-2', '--line', '--text', '--text-dim', '--c1', '--c2', '--c3', '--glow-1', '--glow-2', '--glow-3'];
          varsHost.innerHTML = names.map(function (name) {
            var value = (cs.getPropertyValue(name) || '').trim() || '#000';
            return '<button type="button" data-var-name="' + name + '" data-var-value="' + value + '" style="background:' + value + '" title="' + name + ' · ' + value + '"></button>';
          }).join('');
        }

        function render() {
          var c = current();
          lab.h = c.h; lab.s = c.s; lab.l = c.l;
          live.style.setProperty('--demo-h', c.h);
          live.style.setProperty('--demo-s', c.s);
          live.style.setProperty('--demo-l', c.l);
          if (hexOut) hexOut.textContent = hex(c.h, c.s, c.l);
          if (hVal) hVal.textContent = Math.round(c.h) + '°';
          if (sVal) sVal.textContent = Math.round(c.s) + '%';
          if (lVal) lVal.textContent = Math.round(c.l) + '%';
          renderScale();
          renderHarmony();
          renderVars();
        }

        Object.keys(sliders).forEach(function (key) {
          if (!sliders[key]) return;
          sliders[key].addEventListener('input', render);
        });

        root.addEventListener('click', function (e) {
          var target = e.target;
          if (!target || !target.closest) return;

          var hexBtn = target.closest('[data-hex]');
          if (hexBtn) {
            var value = hexBtn.getAttribute('data-hex');
            AB.fx.copy(value, function () { AB.fx.toast('已复制 ' + value, value); });
            var harmony = hexBtn.getAttribute('data-harmony');
            if (harmony) {
              var c = current();
              var h = parseFloat(harmony);
              var vars = AB.store.customVarsFor(h, lab.scheme === 'light' ? 'light' : 'dark', 168, 312);
              vars['--c3'] = AB.store.hslToHex(h, c.s, c.l);
              AB.store.setPalette('custom', vars);
              AB.fx.toast('已把该调和色设为刺激色');
            }
            return;
          }

          var varBtn = target.closest('[data-var-name]');
          if (varBtn) {
            var text = varBtn.getAttribute('data-var-name') + ': ' + varBtn.getAttribute('data-var-value') + ';';
            AB.fx.copy(text, function () { AB.fx.toast('已复制变量'); });
            return;
          }

          if (target.closest('[data-lab-copy]')) {
            var c2 = current();
            AB.fx.copy(hex(c2.h, c2.s, c2.l), function () { AB.fx.toast('已复制 HEX'); });
          }

          if (target.closest('[data-lab-copy-hsl]')) {
            var c3 = current();
            AB.fx.copy(hsl(c3.h, c3.s, c3.l).replace(/hsl\(/, 'hsl(').replace(/\s/g, ' '), function () { AB.fx.toast('已复制 HSL'); });
          }

          if (target.closest('[data-lab-copy-vars]')) {
            var cs = getComputedStyle(document.documentElement);
            var names = ['--bg', '--bg-2', '--surface', '--surface-2', '--line', '--text', '--text-dim', '--c1', '--c2', '--c3', '--glow-1', '--glow-2', '--glow-3'];
            var block = ':root {\n' + names.map(function (name) {
              return '  ' + name + ': ' + (cs.getPropertyValue(name) || '').trim() + ';';
            }).join('\n') + '\n}';
            AB.fx.copy(block, function () { AB.fx.toast('已复制 13 个 CSS 变量'); });
          }

          if (target.closest('[data-lab-apply]')) {
            var c4 = current();
            var vars2 = AB.store.customVarsFor(c4.h, lab.scheme === 'light' ? 'light' : 'dark', 168, 312);
            AB.store.setPalette('custom', vars2);
            AB.fx.toast('已应用为新配色：H' + Math.round(c4.h) + ' · ' + (lab.scheme === 'light' ? '浅色底' : '深色底'));
          }

          if (target.closest('[data-lab-random]')) {
            var hue = Math.round(Math.random() * 360);
            sliders.h.value = hue;
            sliders.s.value = 60 + Math.round(Math.random() * 38);
            sliders.l.value = 46 + Math.round(Math.random() * 26);
            render();
          }
        });

        AB.fx.qsa('[data-lab-scheme] button', root).forEach(function (btn) {
          btn.addEventListener('click', function () {
            lab.scheme = btn.getAttribute('data-scheme');
            AB.fx.qsa('[data-lab-scheme] button', root).forEach(function (b) {
              b.classList.toggle('is-active', b === btn);
            });
          });
        });

        bindPalettes(root);
        render();
      }
    };
  };

  /* ================================================================ 关于 */
  views.about = function () {
    var html = '' +
      '<section class="about-head container">' +
        '<p class="eyebrow" data-reveal="fade">About</p>' +
        '<h1 class="about-title" data-reveal="up">一个把颜色当结构来用的博客</h1>' +
        '<p class="lede" data-reveal="up" data-reveal-delay="0.08">这里记录三件事：颜色如何组织信息、动效如何服务阅读、排版如何在中文语境里站稳。全部内容都是静态文件，没有后端，没有追踪。</p>' +
      '</section>' +

      '<section class="container about-grid">' +
        '<div class="about-portrait" data-reveal="scale">' +
          '<span class="cover-art"></span><span class="cover-grid"></span><span class="cover-stripes"></span>' +
          '<span class="about-portrait-label">' + esc(AB.SITE.name) + ' · ' + new Date().getFullYear() + '</span>' +
        '</div>' +
        '<div class="stack" data-reveal="up">' +
          '<h2>为什么做这个站</h2>' +
          '<p class="text-dim">我见过太多「技术没问题但不好看」的页面，也见过太多「好看但不好用」的页面。区别往往不在组件库，而在有没有把颜色当成结构来对待。</p>' +
          '<p class="text-dim">所以我把整站做成一个可切换的实验场：八套配色、三档动效强度（完整 / 轻量 / 关闭）、可调的颗粒与氛围光。同一个版式在不同配色下的表现，是这里最想讨论的问题。</p>' +
          '<p class="text-dim">这个站本身也是样本：文章、配色、命令全部内联在 <code>assets/js/data.js</code>，没有一行数据来自后端；偏好只写 localStorage，页面上没有任何埋点或统计脚本。</p>' +
          '<div class="contact-row">' +
            '<a class="btn btn-primary" href="mailto:' + esc(AB.SITE.email) + '" data-magnetic>写信给我<span class="btn-arrow">→</span></a>' +
            '<a class="btn btn-outline" href="' + esc(AB.SITE.repo) + '" target="_blank" rel="noopener">仓库源码</a>' +
            '<button class="btn btn-outline" type="button" data-action="confetti">撒一把彩纸</button>' +
          '</div>' +
        '</div>' +
      '</section>' +

      '<section class="section container">' +
        '<div class="section-head" data-reveal="up">' +
          '<p class="eyebrow">工作方式</p>' +
          '<h2>四条自我约束</h2>' +
        '</div>' +
        '<div class="values-grid" data-stagger>' +
          '<div class="value-card" data-reveal="up"><p class="value-num">01</p><h3>先铺色块</h3><p>任何页面先决定三块颜色占多大面积，再决定字放在哪里。</p></div>' +
          '<div class="value-card" data-reveal="up"><p class="value-num">02</p><h3>动效只讲一件事</h3><p>一次过渡只改变一种颜色关系：亮度、色相或饱和，不叠加。</p></div>' +
          '<div class="value-card" data-reveal="up"><p class="value-num">03</p><h3>能用原生就不引依赖</h3><p>没有框架、没有构建。整个仓库是纯文本，克隆即可运行。</p></div>' +
          '<div class="value-card" data-reveal="up"><p class="value-num">04</p><h3>尊重读者的选择</h3><p>动效强度、字号、光标、颗粒都能关掉，偏好只存在本地。</p></div>' +
        '</div>' +
      '</section>' +

      '<section class="section container">' +
        '<div class="rail">' +
          '<div data-reveal="up">' +
            '<p class="eyebrow">运行轨迹</p>' +
            '<ul class="timeline">' +
              '<li><p class="timeline-year">01</p><p><code>index.html</code> 解析，行内脚本把 <code>no-js</code> 换成 <code>js</code>。</p></li>' +
              '<li><p class="timeline-year">02</p><p><code>store.js</code> 从 localStorage 恢复偏好，写到 <code>data-palette</code> 等属性上。</p></li>' +
              '<li><p class="timeline-year">03</p><p><code>app.js</code> 引导：加载层、配色面板、命令面板、快捷键、常驻动效层。</p></li>' +
              '<li><p class="timeline-year">04</p><p><code>router.js</code> 读 hash → 从 <code>AB.views</code> 取视图 → 渲染进 <code>#view</code>。</p></li>' +
              '<li><p class="timeline-year">05</p><p><code>fx.scope()</code> 给新视图挂上揭示、倾斜、目录追踪与代码着色。</p></li>' +
            '</ul>' +
          '</div>' +
          '<div class="stack" data-reveal="up" data-reveal-delay="0.08">' +
            '<h2>这个站的技术清单</h2>' +
            '<p class="text-dim">HTML 结构 + CSS 变量系统 + 原生 ES5 级 JavaScript。没有 <code>node_modules</code>，没有打包器，克隆下来双击 <code>index.html</code> 就能用。</p>' +
            '<ul class="text-dim">' +
              '<li>Hash 路由与三色遮罩过渡</li>' +
              '<li>IntersectionObserver 滚动揭示</li>' +
              '<li>canvas 氛围层与彩纸粒子</li>' +
              '<li>命令面板（K）与一整套快捷键</li>' +
              '<li>localStorage 偏好、点赞与收藏</li>' +
            '</ul>' +
            '<div class="divider" aria-hidden="true"></div>' +
            '<p class="eyebrow">统计</p>' +
            '<div class="cluster" style="gap:var(--space-l)">' +
              '<div class="stat"><span class="stat-value" data-count="' + AB.POSTS.length + '">0</span><span class="stat-label">篇文章</span></div>' +
              '<div class="stat"><span class="stat-value" data-count="' + AB.PALETTES.length + '">0</span><span class="stat-label">套配色</span></div>' +
              '<div class="stat"><span class="stat-value" data-count="6">0</span><span class="stat-label">个视图</span></div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</section>' +

      '<section class="section container">' +
        '<div class="rail">' +
          '<div class="stack" data-reveal="up">' +
            '<p class="eyebrow">更新订阅</p>' +
            '<h2>没有邮件列表<br>只有一条 RSS</h2>' +
            '<p class="text-dim">纯静态站点没有后端，表单填了也发不出去。新文章会写进 <code>feed.xml</code>，用任意阅读器订阅即可；也可以只把本站加入书签。</p>' +
          '</div>' +
          '<div class="cluster" data-reveal="up" data-reveal-delay="0.08">' +
            '<a class="btn btn-primary" href="feed.xml">订阅 RSS<span class="btn-arrow">→</span></a>' +
            '<a class="btn btn-outline" href="' + esc(AB.SITE.repo) + '" target="_blank" rel="noopener">仓库源码</a>' +
          '</div>' +
        '</div>' +
      '</section>';

    return {
      title: '关于 — ' + AB.SITE.name,
      html: html,
      mount: function () {}
    };
  };

  /* ================================================================= 404 */
  views.notfound = function () {
    var html = '' +
      '<section class="container notfound">' +
        '<p class="eyebrow" data-reveal="fade">Error</p>' +
        '<p class="notfound-code" data-reveal="up">404</p>' +
        '<h1 data-reveal="up" data-reveal-delay="0.06">这个颜色不在调色板里</h1>' +
        '<p class="lede" data-reveal="up" data-reveal-delay="0.12">你要找的页面可能被重命名、合并，或者从来没有存在过。</p>' +
        '<div class="cluster" data-reveal="up" data-reveal-delay="0.18">' +
          '<a class="btn btn-primary" href="#/" data-magnetic>回到首页<span class="btn-arrow">→</span></a>' +
          '<a class="btn btn-outline" href="#/archive">看看全部文章</a>' +
        '</div>' +
      '</section>';

    return {
      title: '404 — ' + AB.SITE.name,
      html: html,
      mount: function () {}
    };
  };
})();
