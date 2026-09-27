/* ==========================================================================
   app.js — 应用引导层
   加载动画 / 配色面板 / 设置面板 / 命令面板 / 快捷键 / 移动菜单 / 彩蛋
   依赖：data.js → store.js → fx.js → views.js → router.js
   ========================================================================== */
(function () {
  var root = document.documentElement;
  var doc = document;
  var fx = AB.fx;
  var store = AB.store;

  function byId(id) { return doc.getElementById(id); }

  function escapeHtml(str) {
    return String(str).replace(/[&<>"]/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c];
    });
  }

  function isTyping(el) {
    if (!el || !el.tagName) return false;
    var tag = el.tagName.toLowerCase();
    return tag === 'input' || tag === 'textarea' || tag === 'select' || el.isContentEditable === true;
  }

  /* ======================================================================
     加载动画
     ====================================================================== */
  var loader = byId('loader');
  var loaderPct = byId('loaderPct');
  var loaderTimer = 0;
  var loaderFinished = false;

  function startLoader() {
    if (loader) doc.body.classList.add('is-locked');
    var progress = 6;
    loaderTimer = window.setInterval(function () {
      /* 越接近 94% 越慢，避免「假装加载完了」的观感 */
      progress = Math.min(94, progress + Math.max(1.5, (94 - progress) * 0.16));
      if (loaderPct) loaderPct.textContent = String(Math.round(progress));
    }, 90);
  }

  function finishLoader() {
    if (loaderFinished) return;
    loaderFinished = true;
    window.clearInterval(loaderTimer);
    if (loaderPct) loaderPct.textContent = '100';
    doc.body.classList.remove('is-locked');
    if (loader) {
      loader.classList.add('is-done');
      window.setTimeout(function () {
        if (loader.parentNode) loader.parentNode.removeChild(loader);
      }, 1200);
    }
    try {
      AB.router.start();
    } catch (err) {
      /* 路由启动失败也不能把首屏锁在加载层下面 */
    }
  }

  /* 页面本身没有图片，唯一的远程资源是外链字体——被墙或很慢时不该拖住首屏。
     因此：load 事件与 1.4s 硬上限，谁先到用谁，最短展示 0.7s。 */
  function scheduleLoaderEnd() {
    var started = window.performance && window.performance.now ? window.performance.now() : Date.now();
    var now = function () {
      return window.performance && window.performance.now ? window.performance.now() : Date.now();
    };
    function release() {
      var wait = Math.max(0, 700 - (now() - started));
      window.setTimeout(finishLoader, wait);
    }
    if (doc.readyState === 'complete') release();
    else window.addEventListener('load', release, { once: true });
    window.setTimeout(finishLoader, 1400);
  }

  /* ======================================================================
     对话框通用
     ====================================================================== */
  function openDialog(dialog) {
    if (!dialog || dialog.open) return;
    if (typeof dialog.showModal === 'function') {
      dialog.showModal();
    } else {
      dialog.setAttribute('open', '');
    }
  }

  function closeDialog(dialog) {
    if (!dialog) return;
    if (dialog.open && typeof dialog.close === 'function') dialog.close();
    else dialog.removeAttribute('open');
  }

  function bindDialogShell(dialog) {
    if (!dialog) return;
    /* 点击遮罩（dialog 自身）关闭 */
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) closeDialog(dialog);
    });
  }

  /* ======================================================================
     配色面板（设置面板 + 移动菜单）
     ====================================================================== */
  function bindPaletteButtons(scope) {
    fx.qsa('[data-palette-apply]', scope).forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-palette-apply');
        store.setPalette(id);
        var p = AB.findPalette(id);
        fx.toast('已切换到 ' + (p ? p.name + ' · ' + p.mood : id), p ? p.swatches[0] : null);
      });
    });
  }

  function buildPaletteUIs() {
    var grid = byId('paletteGrid');
    if (grid) {
      grid.innerHTML = AB.PALETTES.map(function (p) {
        return '<button class="palette-card" type="button" data-palette-apply="' + p.id + '" data-palette-id="' + p.id + '" aria-label="使用配色 ' + escapeHtml(p.name) + '">' +
          '<span class="palette-swatches">' + p.swatches.map(function (c) {
            return '<i style="background:' + c + '"></i>';
          }).join('') + '</span>' +
          '<span class="palette-name">' + escapeHtml(p.name) + '</span>' +
          '<span class="palette-mood">' + escapeHtml(p.mood) + ' · ' + (p.scheme === 'light' ? '浅色' : '深色') + '</span>' +
        '</button>';
      }).join('');
      bindPaletteButtons(grid);
    }

    var mobile = byId('mobilePalettes');
    if (mobile) {
      mobile.innerHTML = AB.PALETTES.map(function (p) {
        return '<button class="mobile-palette" type="button" data-palette-apply="' + p.id + '" data-palette-id="' + p.id + '" aria-label="使用配色 ' + escapeHtml(p.name) + '">' +
          '<i style="background:' + p.swatches[0] + '"></i>' + escapeHtml(p.name) + '</button>';
      }).join('');
      bindPaletteButtons(mobile);
    }
  }

  /* ======================================================================
     设置面板
     ====================================================================== */
  function bindSettings() {
    var dialog = byId('setDialog');
    bindDialogShell(dialog);

    fx.qsa('#motionSeg button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        store.set('motion', btn.getAttribute('data-motion'));
        fx.toast('动效强度：' + btn.textContent.trim());
      });
    });

    fx.qsa('#fontSeg button').forEach(function (btn) {
      btn.addEventListener('click', function () {
        store.set('fontScale', parseFloat(btn.getAttribute('data-font')));
        fx.toast('正文字号：' + btn.textContent.trim());
      });
    });

    fx.qsa('[data-toggle]').forEach(function (input) {
      input.addEventListener('change', function () {
        var name = input.getAttribute('data-toggle');
        store.set(name, input.checked ? 'on' : 'off');
        var labels = { cursor: '自定义光标', grain: '颗粒质感', aurora: '色彩氛围光', marquee: '跑马灯' };
        fx.toast((labels[name] || name) + '：' + (input.checked ? '开' : '关'));
      });
    });
  }

  /* ======================================================================
     命令面板
     ====================================================================== */
  var cmd = null;

  function buildCommandItems() {
    var items = [];

    AB.COMMANDS.forEach(function (c) {
      items.push({
        group: '命令',
        title: c.title,
        sub: c.sub,
        color: c.icon,
        run: function () {
          if (c.run) AB.router.go(c.run);
          else if (c.action) runAction(c.action, null);
        }
      });
    });

    AB.sortedPosts.forEach(function (p) {
      items.push({
        group: '文章',
        title: p.title,
        sub: p.kicker + ' · ' + p.date + ' · ' + p.minutes + ' 分钟',
        keywords: p.tags.join(' '),
        color: p.cover[0],
        run: function () { AB.router.go('#/post/' + p.slug); }
      });
    });

    AB.tagList.forEach(function (t) {
      items.push({
        group: '标签',
        title: '#' + t.tag,
        sub: t.count + ' 篇文章',
        color: 'var(--c2)',
        run: function () { AB.router.go('#/archive?tag=' + encodeURIComponent(t.tag)); }
      });
    });

    AB.PALETTES.forEach(function (p) {
      items.push({
        group: '配色',
        title: p.name,
        sub: p.mood + ' · ' + (p.scheme === 'light' ? '浅色' : '深色'),
        color: p.swatches[0],
        run: function () {
          store.setPalette(p.id);
          fx.toast('已切换到 ' + p.name + ' · ' + p.mood, p.swatches[0]);
        }
      });
    });

    return items;
  }

  function fuzzyMatch(haystack, query) {
    if (!query) return true;
    if (haystack.indexOf(query) > -1) return true;
    /* 退化匹配：按顺序出现的字符也算命中，方便手机上少打字 */
    var at = 0;
    for (var i = 0; i < query.length; i++) {
      var found = haystack.indexOf(query.charAt(i), at);
      if (found === -1) return false;
      at = found + 1;
    }
    return true;
  }

  function bindCommandPalette() {
    var dialog = byId('cmdDialog');
    var input = byId('cmdInput');
    var list = byId('cmdList');
    var count = byId('cmdCount');
    if (!dialog || !input || !list) return;

    var items = buildCommandItems();
    var results = [];
    var active = 0;

    function render() {
      var query = (input.value || '').trim().toLowerCase();
      results = items.filter(function (item) {
        return fuzzyMatch((item.title + ' ' + item.sub + ' ' + (item.keywords || '')).toLowerCase(), query);
      });

      if (!results.length) {
        list.innerHTML = '<li class="cmd-empty">没有匹配项。试试「配色」「动效」或者文章标题里的词。</li>';
        if (count) count.textContent = '0 项';
        return;
      }

      var html = '';
      var lastGroup = '';
      results.forEach(function (item, i) {
        if (item.group !== lastGroup) {
          html += '<li class="cmd-group" aria-hidden="true">' + escapeHtml(item.group) + '</li>';
          lastGroup = item.group;
        }
        html += '<li class="cmd-item' + (i === active ? ' is-active' : '') + '" role="option" id="cmd-opt-' + i + '" data-index="' + i + '" aria-selected="' + (i === active ? 'true' : 'false') + '">' +
          '<span class="cmd-item-swatch" style="background:' + item.color + '"></span>' +
          '<span class="cmd-item-main">' +
            '<span class="cmd-item-title">' + escapeHtml(item.title) + '</span>' +
            '<span class="cmd-item-sub">' + escapeHtml(item.sub) + '</span>' +
          '</span>' +
        '</li>';
      });
      list.innerHTML = html;
      if (count) count.textContent = results.length + ' 项';

      var activeEl = list.querySelector('.cmd-item.is-active');
      if (activeEl) {
        input.setAttribute('aria-activedescendant', activeEl.id);
        if (activeEl.scrollIntoView) activeEl.scrollIntoView({ block: 'nearest' });
      }
    }

    function move(step) {
      if (!results.length) return;
      active = (active + step + results.length) % results.length;
      render();
    }

    function runIndex(i) {
      var item = results[i];
      if (!item) return;
      closeDialog(dialog);
      item.run();
    }

    function open() {
      if (!dialog.open) openDialog(dialog);
      input.value = '';
      active = 0;
      render();
      window.setTimeout(function () { input.focus(); }, 30);
    }

    cmd = { open: open, dialog: dialog };

    input.addEventListener('input', function () { active = 0; render(); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Enter') { e.preventDefault(); runIndex(active); }
      else if (e.key === 'Home') { active = 0; render(); }
      else if (e.key === 'End') { active = results.length - 1; render(); }
    });

    list.addEventListener('click', function (e) {
      var li = e.target.closest ? e.target.closest('.cmd-item') : null;
      if (!li) return;
      runIndex(parseInt(li.getAttribute('data-index'), 10) || 0);
    });

    list.addEventListener('pointermove', function (e) {
      var li = e.target.closest ? e.target.closest('.cmd-item') : null;
      if (!li) return;
      var index = parseInt(li.getAttribute('data-index'), 10) || 0;
      if (index === active) return;
      active = index;
      fx.qsa('.cmd-item', list).forEach(function (el) {
        var isActive = el === li;
        el.classList.toggle('is-active', isActive);
        el.setAttribute('aria-selected', isActive ? 'true' : 'false');
      });
    });

    dialog.addEventListener('close', function () {
      input.setAttribute('aria-activedescendant', '');
    });
  }

  function openSearch() {
    if (cmd) cmd.open();
  }

  /* ======================================================================
     动作分发（data-action / 命令面板共用）
     ====================================================================== */
  function scrollTop() {
    var smooth = store.get('motion') !== 'off';
    window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
  }

  function nextPalette() {
    var id = store.cyclePalette(1);
    var p = AB.findPalette(id);
    fx.toast('配色：' + (p ? p.name + ' · ' + p.mood : '自定义'), p ? p.swatches[0] : null);
  }

  function randomPalette() {
    var p = store.randomPalette();
    fx.toast('随机配色 · H' + p.hue + ' · ' + (p.scheme === 'light' ? '浅色底' : '深色底'), p.swatches[0]);
  }

  function fireConfetti(el) {
    if (!el) {
      fx.confetti({});
      return;
    }
    var rect = el.getBoundingClientRect();
    fx.confetti({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, count: 70 });
  }

  function resetPrefs() {
    store.reset();
    fx.toast('已恢复默认设置');
  }

  function runAction(name, sourceEl) {
    switch (name) {
      case 'search': openSearch(); break;
      case 'palette': nextPalette(); break;
      case 'random-palette': randomPalette(); break;
      case 'confetti': fireConfetti(sourceEl); break;
      case 'settings': openDialog(byId('setDialog')); break;
      case 'reset-prefs': resetPrefs(); break;
      case 'top': scrollTop(); break;
      case 'menu': toggleMenu(); break;
      default: break;
    }
  }

  function bindActions() {
    doc.addEventListener('click', function (e) {
      var el = e.target.closest ? e.target.closest('[data-action]') : null;
      if (!el) return;
      var name = el.getAttribute('data-action');

      if (name === 'close-dialog') {
        e.preventDefault();
        closeDialog(el.closest('dialog'));
        return;
      }
      e.preventDefault();
      runAction(name, el);
    });

    var toTop = byId('toTop');
    if (toTop) toTop.addEventListener('click', scrollTop);

    var year = byId('year');
    if (year) year.textContent = String(new Date().getFullYear());
  }

  /* ======================================================================
     移动菜单
     ====================================================================== */
  var menuEls = null;

  function setMenu(open) {
    if (!menuEls) return;
    menuEls.menu.hidden = !open;
    menuEls.burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuEls.burger.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
    doc.body.classList.toggle('is-locked', open);
    if (open) {
      var firstLink = fx.qs('a[data-nav-mobile]', menuEls.menu);
      if (firstLink) firstLink.focus();
    }
  }

  function toggleMenu() {
    if (!menuEls) return;
    setMenu(menuEls.menu.hidden);
  }

  function closeMenu() {
    if (!menuEls || menuEls.menu.hidden) return;
    setMenu(false);
  }

  function bindMobileMenu() {
    var burger = byId('burger');
    var menu = byId('mobileMenu');
    if (!burger || !menu) return;
    menuEls = { burger: burger, menu: menu };
    menu.hidden = true;

    burger.addEventListener('click', toggleMenu);
    fx.qsa('a[data-nav-mobile]', menu).forEach(function (link) {
      link.addEventListener('click', function () { setMenu(false); });
    });
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 992) closeMenu();
    });
  }

  /* ======================================================================
     快捷键
     ====================================================================== */
  function bindShortcuts() {
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        closeMenu();
        return;
      }

      var meta = e.metaKey || e.ctrlKey;
      if (meta) {
        if (e.key === 'k' || e.key === 'K') { e.preventDefault(); openSearch(); }
        else if (e.key === ',') { e.preventDefault(); openDialog(byId('setDialog')); }
        return;
      }

      if (isTyping(e.target) || e.altKey) return;

      switch (e.key) {
        case 'k': case 'K': e.preventDefault(); openSearch(); break;
        case 'p': case 'P': nextPalette(); break;
        case 'l': case 'L': randomPalette(); break;
        case 'c': case 'C': fireConfetti(null); break;
        case 'g': case 'G': scrollTop(); break;
        case '?': e.preventDefault(); openDialog(byId('setDialog')); break;
        default: break;
      }
    });
  }

  /* ======================================================================
     彩蛋：↑↑↓↓←→←→ B A
     ====================================================================== */
  var KONAMI = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'];
  var konamiAt = 0;

  function party() {
    var on = !root.classList.contains('rainbow-mode');
    root.classList.toggle('rainbow-mode', on);
    store.set('party', on);
    fx.toast(on ? '彩蛋解锁：全站色相开始循环' : '彩蛋已收起');
    if (on) {
      for (var i = 0; i < 3; i++) {
        window.setTimeout(function () { fx.confetti({ count: 110 }); }, i * 220);
      }
    }
  }

  function bindKonami() {
    doc.addEventListener('keydown', function (e) {
      if (isTyping(e.target) || e.metaKey || e.ctrlKey) return;
      var key = e.key;
      var expect = KONAMI[konamiAt];
      if (key && key.length === 1) key = key.toLowerCase();
      if (key === expect) {
        konamiAt++;
        if (konamiAt === KONAMI.length) {
          konamiAt = 0;
          party();
        }
      } else {
        konamiAt = key === KONAMI[0] ? 1 : 0;
      }
    });
  }

  /* ======================================================================
     全局状态同步
     ====================================================================== */
  function syncPaletteLabels() {
    var name = store.current().name;
    fx.qsa('[data-current-palette-name]').forEach(function (el) {
      el.textContent = name;
    });
  }

  function bindGlobalEvents() {
    window.addEventListener('ab:route', function () {
      closeMenu();
      syncPaletteLabels();
      if (cmd && cmd.dialog && cmd.dialog.open) closeDialog(cmd.dialog);
    });
    window.addEventListener('ab:prefs', syncPaletteLabels);
  }

  /* ======================================================================
     启动
     ====================================================================== */
  function boot() {
    store.init();
    buildPaletteUIs();
    bindSettings();
    bindCommandPalette();
    bindMobileMenu();
    bindActions();
    bindShortcuts();
    bindKonami();
    bindGlobalEvents();

    /* 常驻交互层：背景 canvas、自定义光标、滚动 UI、页脚跑马灯 */
    fx.canvas();
    fx.cursor();
    fx.scrollUI();
    fx.marquees(doc.body);

    /* 首屏先把偏好同步一次（视图内的标签由 ab:route 更新） */
    syncPaletteLabels();

    if (store.get('party')) root.classList.add('rainbow-mode');
  }

  startLoader();
  try {
    boot();
  } catch (err) {
    /* 引导异常时仍然放行页面，避免卡在加载层 */
  }
  scheduleLoaderEnd();
})();
