/* ==========================================================================
   fx.js — 交互与动效引擎（全部原生 API，零依赖）
   canvas 氛围层 / 自定义光标 / 滚动揭示 / 3D 倾斜 / 彩纸 / 目录追踪 / 复制
   ========================================================================== */
(function () {
  var fx = {};
  AB.fx = fx;

  var globalCleanups = [];
  var viewCleanups = [];

  var motion = function () {
    return document.documentElement.getAttribute('data-motion') || 'full';
  };
  var animated = function () {
    return motion() === 'full';
  };
  var reduced = function () {
    return motion() !== 'full';
  };

  fx.onGlobal = function (target, type, fn, opts) {
    target.addEventListener(type, fn, opts);
    globalCleanups.push(function () { target.removeEventListener(type, fn, opts); });
  };
  fx.on = function (target, type, fn, opts) {
    target.addEventListener(type, fn, opts);
    viewCleanups.push(function () { target.removeEventListener(type, fn, opts); });
  };
  fx.pending = function (fn) {
    viewCleanups.push(fn);
  };
  fx.clearScope = function () {
    viewCleanups.forEach(function (fn) {
      try { fn(); } catch (err) { /* 忽略清理异常 */ }
    });
    viewCleanups.length = 0;
  };

  /* ---------------------------------------------------------------- 工具 */
  fx.qsa = function (sel, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(sel));
  };
  fx.qs = function (sel, root) {
    return (root || document).querySelector(sel);
  };

  var colorProbe = null;
  fx.toRgb = function (value, alpha) {
    if (!value) return 'rgba(255,255,255,' + (alpha === undefined ? 1 : alpha) + ')';
    var str = String(value).trim();
    if (str.charAt(0) === '#') {
      var hex = str.slice(1);
      if (hex.length === 3) hex = hex.charAt(0) + hex.charAt(0) + hex.charAt(1) + hex.charAt(1) + hex.charAt(2) + hex.charAt(2);
      var num = parseInt(hex, 16);
      var r = (num >> 16) & 255;
      var g = (num >> 8) & 255;
      var b = num & 255;
      return 'rgba(' + r + ',' + g + ',' + b + ',' + (alpha === undefined ? 1 : alpha) + ')';
    }
    if (!colorProbe) {
      colorProbe = document.createElement('canvas').getContext('2d');
    }
    colorProbe.fillStyle = '#000';
    colorProbe.fillStyle = str;
    var resolved = colorProbe.fillStyle;
    if (resolved.charAt(0) === '#') return fx.toRgb(resolved, alpha);
    if (alpha === undefined || alpha === 1) return resolved;
    return resolved.replace(/rgba?\(([^)]+)\)/, function (m, inner) {
      var parts = inner.split(',').map(function (s) { return parseFloat(s); });
      return 'rgba(' + parts[0] + ',' + parts[1] + ',' + parts[2] + ',' + alpha + ')';
    });
  };

  fx.paletteColors = function () {
    var cs = getComputedStyle(document.documentElement);
    var pick = function (name, fallback) {
      var v = cs.getPropertyValue(name);
      return v && v.trim() ? v.trim() : fallback;
    };
    return {
      bg: pick('--bg', '#07070a'),
      text: pick('--text', '#f5f5f2'),
      c1: pick('--c1', '#c8ff2f'),
      c2: pick('--c2', '#6b5cff'),
      c3: pick('--c3', '#ff4d6d'),
      light: (document.documentElement.getAttribute('data-palette') || '') === 'custom'
        ? getComputedStyle(document.body).backgroundColor
        : ''
    };
  };

  fx.isLightPalette = function () {
    var p = AB.findPalette(AB.store.get('palette'));
    if (p) return p.scheme === 'light';
    var vars = AB.store.prefs.customVars;
    if (vars && vars['--bg']) {
      var rgb = fx.toRgb(vars['--bg'], 1).match(/[\d.]+/g);
      if (rgb) {
        var lum = (0.2126 * +rgb[0] + 0.7152 * +rgb[1] + 0.0722 * +rgb[2]) / 255;
        return lum > 0.5;
      }
    }
    return false;
  };

  /* 轻量提示 ------------------------------------------------------------- */
  fx.toast = function (message, iconColor) {
    var host = document.getElementById('toasts');
    if (!host) return;
    var el = document.createElement('div');
    el.className = 'toast';
    el.innerHTML = '<i></i><span></span>';
    if (iconColor) el.querySelector('i').style.background = iconColor;
    el.querySelector('span').textContent = message;
    host.appendChild(el);
    var life = window.setTimeout(function () {
      el.classList.add('is-out');
      window.setTimeout(function () { el.remove(); }, 300);
    }, 2600);
    viewCleanups.push(function () { window.clearTimeout(life); });
    return el;
  };

  /* ------------------------------------------------- 背景 canvas 氛围层 */
  fx.canvas = function () {
    var canvas = document.getElementById('bgCanvas');
    if (!canvas) return { refresh: function () {} };
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var w = 0, h = 0;
    var pointer = { x: 0, y: 0, tx: 0, ty: 0, active: false };
    var trail = [];
    var frame = 0;
    var running = false;
    var colors = {};

    var blobs = [
      { hx: 0.22, hy: 0.28, r: 0.55, sp: 0.00013, ph: 0, col: 'c1', a: 0.30, x: 0, y: 0 },
      { hx: 0.78, hy: 0.24, r: 0.5, sp: 0.00017, ph: 2.1, col: 'c2', a: 0.28, x: 0, y: 0 },
      { hx: 0.6, hy: 0.82, r: 0.6, sp: 0.00011, ph: 4.2, col: 'c3', a: 0.24, x: 0, y: 0 }
    ];

    function refreshColors() {
      var p = fx.paletteColors();
      colors = {
        c1: fx.toRgb(p.c1, 1),
        c2: fx.toRgb(p.c2, 1),
        c3: fx.toRgb(p.c3, 1)
      };
      blobs[0].base = fx.toRgb(p.c1, 1);
      blobs[1].base = fx.toRgb(p.c2, 1);
      blobs[2].base = fx.toRgb(p.c3, 1);
    }

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function mix(hex, alpha) {
      return fx.toRgb(hex, alpha);
    }

    function draw(time) {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';

      pointer.x += (pointer.tx - pointer.x) * 0.06;
      pointer.y += (pointer.ty - pointer.y) * 0.06;

      for (var i = 0; i < blobs.length; i++) {
        var b = blobs[i];
        var t = time * b.sp + b.ph;
        var bx = (b.hx + Math.sin(t) * 0.14 + Math.cos(t * 0.7) * 0.06) * w;
        var by = (b.hy + Math.cos(t * 1.1) * 0.12 + Math.sin(t * 0.6) * 0.05) * h;
        if (pointer.active) {
          bx += (pointer.x - bx) * (0.12 - i * 0.02);
          by += (pointer.y - by) * (0.12 - i * 0.02);
        }
        if (b.x === 0 && b.y === 0) { b.x = bx; b.y = by; }
        b.x += (bx - b.x) * 0.08;
        b.y += (by - b.y) * 0.08;

        var radius = b.r * Math.min(w, h) * (0.85 + Math.sin(t * 1.6) * 0.12);
        var grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, radius);
        grad.addColorStop(0, mix(b.base, b.a));
        grad.addColorStop(0.45, mix(b.base, b.a * 0.35));
        grad.addColorStop(1, mix(b.base, 0));
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(b.x, b.y, radius, 0, Math.PI * 2);
        ctx.fill();
      }

      if (trail.length > 2) {
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineWidth = 2;
        for (var j = 1; j < trail.length; j++) {
          var p0 = trail[j - 1];
          var p1 = trail[j];
          var alpha = (j / trail.length) * 0.32;
          ctx.strokeStyle = mix(colors.c1, alpha);
          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p1.x, p1.y);
          ctx.stroke();
        }
      }

      frame = window.requestAnimationFrame(draw);
    }

    function start() {
      if (running || !animated()) return;
      running = true;
      frame = window.requestAnimationFrame(draw);
    }
    function stop() {
      running = false;
      window.cancelAnimationFrame(frame);
      ctx.clearRect(0, 0, w, h);
      trail.length = 0;
    }

    resize();
    refreshColors();
    start();

    fx.onGlobal(window, 'resize', resize);
    fx.onGlobal(window, 'pointermove', function (e) {
      pointer.tx = e.clientX;
      pointer.ty = e.clientY;
      pointer.active = true;
      if (!animated()) return;
      trail.push({ x: e.clientX, y: e.clientY });
      if (trail.length > 16) trail.shift();
    }, { passive: true });
    fx.onGlobal(window, 'pointerdown', function (e) {
      pointer.tx = e.clientX;
      pointer.ty = e.clientY;
    });
    fx.onGlobal(document, 'visibilitychange', function () {
      if (document.hidden) stop();
      else start();
    });
    fx.onGlobal(window, 'ab:prefs', function () {
      refreshColors();
      if (animated()) start();
      else stop();
    });
    fx.onGlobal(window, 'resize', function () {
      if (animated()) start();
      else stop();
    });

    fx.cleanupCanvas = stop;
    return { refresh: refreshColors, stop: stop, start: start };
  };

  /* ---------------------------------------------------- 自定义光标 */
  fx.cursor = function () {
    var wrap = document.getElementById('cursor');
    if (!wrap) return;
    var dot = fx.qs('.cursor-dot', wrap);
    var ring = fx.qs('.cursor-ring', wrap);
    var x = window.innerWidth / 2, y = window.innerHeight / 2;
    var rx = x, ry = y;
    var raf = 0;
    var active = false;

    function loop() {
      rx += (x - rx) * 0.16;
      ry += (y - ry) * 0.16;
      dot.style.transform = 'translate(' + x + 'px,' + y + 'px) translate(-50%,-50%)';
      ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)';
      raf = window.requestAnimationFrame(loop);
    }

    var hoverables = 'a, button, input, dialog, [data-cursor-hover], [data-tilt], summary';

    fx.onGlobal(window, 'pointermove', function (e) {
      x = e.clientX;
      y = e.clientY;
      if (!active) {
        active = true;
        wrap.classList.remove('is-hidden');
        if (animated()) loop();
      }
      var target = e.target;
      var isHover = target && target.closest ? !!target.closest(hoverables) : false;
      wrap.classList.toggle('is-hover', isHover);
    }, { passive: true });

    fx.onGlobal(window, 'pointerdown', function () { wrap.classList.add('is-down'); });
    fx.onGlobal(window, 'pointerup', function () { wrap.classList.remove('is-down'); });
    fx.onGlobal(document, 'mouseleave', function () { wrap.classList.add('is-hidden'); });
    fx.onGlobal(document, 'mouseenter', function () { wrap.classList.remove('is-hidden'); });
    fx.onGlobal(window, 'pointerdown', function (e) {
      if (e.pointerType !== 'mouse') wrap.classList.add('is-hidden');
    });

    globalCleanups.push(function () {
      window.cancelAnimationFrame(raf);
    });
  };

  /* ---------------------------------------------------- 滚动揭示 */
  fx.reveal = function (root) {
    var nodes = fx.qsa('[data-reveal], .line-mask, .meter', root);
    if (!nodes.length) return;

    if (reduced()) {
      nodes.forEach(function (el) { el.classList.add('is-in'); });
      fx.qsa('.meter-fill', root).forEach(function (fill) {
        fill.style.width = (fill.getAttribute('data-value') || '0') + '%';
      });
      return;
    }

    if (!('IntersectionObserver' in window)) {
      nodes.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var group = el.closest('[data-stagger]');
        var delay = 0;
        if (group && !el.hasAttribute('data-reveal-delay')) {
          var items = fx.qsa('[data-reveal]', group);
          var index = items.indexOf(el);
          delay = Math.min(index, 7) * 0.062;
        }
        if (el.hasAttribute('data-reveal-delay')) {
          delay = parseFloat(el.getAttribute('data-reveal-delay'));
        }
        el.style.setProperty('--reveal-delay', delay.toFixed(3) + 's');
        el.classList.add('is-in');

        fx.qsa('.meter-fill, [data-bar]', el).forEach(function (fill) {
          var value = fill.getAttribute('data-value') || '0';
          fill.style.width = value + '%';
        });
        observer.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });

    nodes.forEach(function (el) { observer.observe(el); });
    fx.pending(function () { observer.disconnect(); });
  };

  /* ---------------------------------------------------- 3D 倾斜 + 光斑 */
  fx.tilt = function (root) {
    if (reduced()) return;
    var cards = fx.qsa('[data-tilt]', root);
    cards.forEach(function (card) {
      var rect = null;
      var raf = 0;
      var state = { px: 0, py: 0 };

      function apply() {
        raf = 0;
        var depth = parseFloat(card.getAttribute('data-tilt-depth') || '6');
        card.style.transform = 'perspective(1000px) rotateX(' + (-state.py * depth) + 'deg) rotateY(' + (state.px * depth) + 'deg) translateY(-4px)';
        card.style.setProperty('--mx', (50 + state.px * 50) + '%');
        card.style.setProperty('--my', (50 + state.py * 50) + '%');
      }

      function move(e) {
        if (card.hasAttribute('data-reveal') && !card.classList.contains('is-in')) return;
        if (!rect) rect = card.getBoundingClientRect();
        var nx = (e.clientX - rect.left) / rect.width - 0.5;
        var ny = (e.clientY - rect.top) / rect.height - 0.5;
        state.px = Math.max(-0.5, Math.min(0.5, nx));
        state.py = Math.max(-0.5, Math.min(0.5, ny));
        if (!raf) raf = window.requestAnimationFrame(apply);
      }

      function reset() {
        rect = null;
        card.style.transform = 'none';
        card.style.setProperty('--mx', '50%');
        card.style.setProperty('--my', '50%');
        window.cancelAnimationFrame(raf);
        raf = 0;
      }

      fx.on(card, 'pointerenter', function () { rect = card.getBoundingClientRect(); card.classList.add('is-tilt'); });
      fx.on(card, 'pointermove', move);
      fx.on(card, 'pointerleave', function () { reset(); });
      fx.pending(reset);
    });
  };

  /* ---------------------------------------------------- 磁吸按钮 */
  fx.magnetic = function (root) {
    if (reduced()) return;
    fx.qsa('[data-magnetic]', root).forEach(function (el) {
      var rect = null;
      fx.on(el, 'pointerenter', function () { rect = el.getBoundingClientRect(); });
      fx.on(el, 'pointermove', function (e) {
        if (!rect) rect = el.getBoundingClientRect();
        var mx = (e.clientX - rect.left - rect.width / 2) / rect.width;
        var my = (e.clientY - rect.top - rect.height / 2) / rect.height;
        el.style.transform = 'translate(' + (mx * 12).toFixed(2) + 'px,' + (my * 10).toFixed(2) + 'px)';
      });
      fx.on(el, 'pointerleave', function () {
        rect = null;
        el.style.transform = '';
      });
      fx.pending(function () { el.style.transform = ''; });
    });
  };

  /* ---------------------------------------------------- 水波纹 */
  fx.ripple = function (root) {
    fx.qsa('.btn, .icon-btn, .chip, .cmd-item, .mobile-palette', root).forEach(function (el) {
      fx.on(el, 'pointerdown', function (e) {
        if (reduced()) return;
        var rect = el.getBoundingClientRect();
        var size = Math.max(rect.width, rect.height) * 2.2;
        var span = document.createElement('span');
        span.className = 'ripple';
        span.style.width = size + 'px';
        span.style.height = size + 'px';
        span.style.left = (e.clientX - rect.left) + 'px';
        span.style.top = (e.clientY - rect.top) + 'px';
        if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
        el.appendChild(span);
        window.setTimeout(function () { span.remove(); }, 700);
      });
    });
  };

  /* ---------------------------------------------------- 跑马灯 */
  fx.marquees = function (root) {
    fx.qsa('[data-marquee]', root).forEach(function (marquee) {
      var track = fx.qs('.marquee-track', marquee);
      if (!track) return;
      track.querySelectorAll('[data-clone]').forEach(function (n) { n.remove(); });
      var clone = track.cloneNode(true);
      clone.setAttribute('data-clone', 'true');
      clone.setAttribute('aria-hidden', 'true');
      Array.prototype.forEach.call(clone.children, function (child) {
        child.setAttribute('aria-hidden', 'true');
      });
      track.parentNode.appendChild(clone);

      var speed = parseFloat(marquee.getAttribute('data-speed') || '0.6');
      function size() {
        var width = track.scrollWidth || 1;
        var duration = Math.max(8, width / (60 * speed));
        marquee.style.setProperty('--marquee-dur', duration.toFixed(1) + 's');
        clone.style.animationDuration = duration.toFixed(1) + 's';
      }
      size();
      if ('ResizeObserver' in window) {
        var ro = new ResizeObserver(size);
        ro.observe(track);
        fx.pending(function () { ro.disconnect(); });
      } else {
        fx.on(window, 'resize', size);
      }
    });
  };

  /* ---------------------------------------------------- 数字滚动 */
  fx.counters = function (root) {
    var nodes = fx.qsa('[data-count]', root);
    if (!nodes.length) return;
    if (reduced() || !('IntersectionObserver' in window)) {
      nodes.forEach(function (el) { el.textContent = el.getAttribute('data-count'); });
      return;
    }
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        var target = parseFloat(el.getAttribute('data-count'));
        var suffix = el.getAttribute('data-suffix') || '';
        var decimals = (el.getAttribute('data-decimals') | 0);
        var start = window.performance.now();
        var dur = 1200;
        function step(now) {
          var p = Math.min(1, (now - start) / dur);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = (target * eased).toFixed(decimals) + suffix;
          if (p < 1) window.requestAnimationFrame(step);
        }
        window.requestAnimationFrame(step);
        observer.unobserve(el);
      });
    }, { threshold: 0.4 });
    nodes.forEach(function (el) { observer.observe(el); });
    fx.pending(function () { observer.disconnect(); });
  };

  /* ---------------------------------------------------- 打字机 */
  fx.typewriter = function (root) {
    fx.qsa('[data-type]', root).forEach(function (el) {
      var words = (el.getAttribute('data-type') || '').split('|').filter(Boolean);
      if (!words.length) return;
      if (reduced()) { el.textContent = words[0]; return; }
      var index = 0, char = 0, deleting = false;
      var timer = 0;
      function tick() {
        var word = words[index];
        char += deleting ? -1 : 1;
        el.textContent = word.slice(0, char);
        var delay = deleting ? 42 : 88;
        if (!deleting && char === word.length) {
          deleting = true;
          delay = 1500;
        } else if (deleting && char === 0) {
          deleting = false;
          index = (index + 1) % words.length;
          delay = 260;
        }
        timer = window.setTimeout(tick, delay);
      }
      tick();
      fx.pending(function () { window.clearTimeout(timer); });
    });
  };

  /* ---------------------------------------------------- 语法着色 */
  var HL_KEYWORDS = {
    js: 'var let const function return if else for while do new delete typeof instanceof in of class extends this null undefined true false break continue try catch finally throw switch case default async await yield import export from as window document Math JSON navigator localStorage performance requestAnimationFrame setTimeout setInterval clearInterval addEventListener',
    css: 'important media supports keyframes from to root and not screen print hover focus active',
    json: 'true false null',
    sh: 'git npm cd python3 mkdir rm ls echo export curl'
  };

  function hlEscape(text) {
    return text.replace(/[&<>]/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c];
    });
  }

  function hlTokens(text, lang) {
    var keywords = (HL_KEYWORDS[lang] || '').split(' ');
    var pattern = /(\/\*[\s\S]*?\*\/|\/\/[^\n]*)|('(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"|`(?:\\.|[^`\\])*`)|(\b\d+(?:\.\d+)?\b)|([A-Za-z_$@-][\w$-]*)/g;
    var out = '';
    var last = 0;
    var m;
    while ((m = pattern.exec(text)) !== null) {
      out += hlEscape(text.slice(last, m.index));
      last = pattern.lastIndex;
      var next = text.charAt(last);
      if (m[1]) out += '<span class="tok-com">' + hlEscape(m[1]) + '</span>';
      else if (m[2]) out += '<span class="tok-str">' + hlEscape(m[2]) + '</span>';
      else if (m[3]) out += '<span class="tok-num">' + m[3] + '</span>';
      else if (keywords.indexOf(m[4]) > -1) out += '<span class="tok-key">' + hlEscape(m[4]) + '</span>';
      else if (lang === 'css' && next === ':') out += '<span class="tok-val">' + hlEscape(m[4]) + '</span>';
      else if (next === '(') out += '<span class="tok-fn">' + hlEscape(m[4]) + '</span>';
      else out += hlEscape(m[4]);
    }
    out += hlEscape(text.slice(last));
    return out;
  }

  /* 按 data-lang 给代码块上色。data.js 里手写的 tok-* 片段保留原样，
     它们是「关掉 JS」时仍然有色的那版；这里只是让所有块的表现一致。
     从 textContent 重新着色，因此重复调用是幂等的。 */
  fx.highlight = function (root) {
    fx.qsa('pre.code-block, .code-block pre', root).forEach(function (pre) {
      var code = pre.querySelector('code') || pre;
      var lang = (pre.getAttribute('data-lang') || code.getAttribute('data-lang') || '').toLowerCase();
      var source = code.textContent;
      if (!source || source.length > 6000) return;
      var html = hlTokens(source, lang);
      if (html !== code.innerHTML) code.innerHTML = html;
    });
  };

  /* ---------------------------------------------------- 代码复制 */
  fx.codeBlocks = function (root) {
    fx.qsa('pre.code-block, .code-block pre', root).forEach(function (pre) {
      var block = pre.classList.contains('code-block') ? pre : pre.parentNode;
      if (block.querySelector('.code-copy')) return;
      var lang = pre.getAttribute('data-lang') || block.getAttribute('data-lang') || (pre.querySelector('code') ? pre.querySelector('code').getAttribute('data-lang') : '') || '';
      if (lang) {
        var label = document.createElement('span');
        label.className = 'code-lang';
        label.textContent = lang;
        block.appendChild(label);
      }
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'code-copy';
      btn.textContent = '复制';
      btn.setAttribute('aria-label', '复制代码');
      btn.addEventListener('click', function () {
        /* 复制 <code> 的文本：语言标签与复制按钮本身都挂在 pre 上，
           直接读 pre.innerText 会把它们一起复制进去 */
        var source = pre.querySelector('code') || pre;
        var text = source.textContent.replace(/^\s*\n/, '').replace(/\s+$/, '');
        var done = function () {
          btn.textContent = '已复制';
          btn.classList.add('is-done');
          fx.toast('代码已复制');
          window.setTimeout(function () {
            btn.textContent = '复制';
            btn.classList.remove('is-done');
          }, 1600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, function () { fallbackCopy(text, done); });
        } else {
          fallbackCopy(text, done);
        }
      });
      block.appendChild(btn);
    });
  };

  function fallbackCopy(text, done) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', 'readonly');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    try { document.execCommand('copy'); done(); } catch (err) { fx.toast('复制失败，请手动选择'); }
    area.remove();
  }

  fx.copy = function (text, done) {
    var after = done || function () {};
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(after, function () { fallbackCopy(text, after); });
    } else {
      fallbackCopy(text, after);
    }
  };

  /* ---------------------------------------------------- 目录追踪 */
  fx.toc = function (root) {
    var toc = fx.qs('[data-toc]', root);
    if (!toc) return;
    var links = fx.qsa('a[href^="#"]', toc);
    var headings = links.map(function (link) {
      var id = link.getAttribute('href').slice(1);
      var el = document.getElementById(id);
      return el ? { el: el, link: link } : null;
    }).filter(Boolean);
    if (!headings.length) return;

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        ticking = false;
        var offset = window.scrollY + (window.innerHeight * 0.28);
        var current = headings[0];
        for (var i = 0; i < headings.length; i++) {
          if (headings[i].el.offsetTop <= offset) current = headings[i];
        }
        headings.forEach(function (item) {
          item.link.classList.toggle('is-active', item === current);
        });
        var wrap = toc.querySelector('ol');
        if (wrap && current && animated()) {
          var linkRect = current.link.getBoundingClientRect();
          var navRect = wrap.getBoundingClientRect();
          if (linkRect.top < navRect.top || linkRect.bottom > navRect.bottom) {
            current.link.scrollIntoView({ block: 'nearest' });
          }
        }
      });
    }
    fx.on(window, 'scroll', onScroll, { passive: true });
    onScroll();
  };

  /* ---------------------------------------------------- 阅读进度 */
  fx.readingProgress = function (root, slug) {
    var article = fx.qs('[data-article]', root);
    if (!article) return;
    var bar = document.getElementById('scrollProgress');
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        ticking = false;
        var rect = article.getBoundingClientRect();
        var total = rect.height - window.innerHeight + 240;
        var passed = -rect.top + 240;
        var ratio = total > 0 ? Math.max(0, Math.min(1, passed / total)) : 0;
        if (bar && slug) bar.style.transform = 'scaleX(' + ratio + ')';
        if (slug && ratio > 0.05 && ratio < 1) AB.store.saveRead(slug, ratio);
      });
    }
    fx.on(window, 'scroll', onScroll, { passive: true });
    onScroll();
  };

  /* ---------------------------------------------------- 全局滚动条 / 回到顶部 */
  fx.scrollUI = function () {
    var header = document.getElementById('siteHeader');
    var bar = document.getElementById('scrollProgress');
    var toTop = document.getElementById('toTop');
    var ring = document.getElementById('toTopBar');
    var inPost = false;
    var lastY = window.scrollY;
    var ticking = false;

    fx.onGlobal(window, 'ab:prefs', function () { /* 预留：配色变化时可重绘装饰 */ });

    function update() {
      ticking = false;
      var y = window.scrollY;
      var max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      var ratio = Math.max(0, Math.min(1, y / max));

      if (!inPost && bar) bar.style.transform = 'scaleX(' + ratio + ')';
      if (ring) {
        var len = 2 * Math.PI * 19;
        ring.style.strokeDasharray = len.toFixed(2);
        ring.style.strokeDashoffset = (len * (1 - ratio)).toFixed(2);
      }
      if (toTop) toTop.classList.toggle('is-visible', y > 420);
      if (header) {
        header.classList.toggle('is-stuck', y > 20);
        var goingDown = y > lastY + 6;
        var goingUp = y < lastY - 6;
        if (y > 460 && goingDown) header.classList.add('is-hidden');
        if (goingUp || y < 460) header.classList.remove('is-hidden');
      }
      lastY = y;
    }

    fx.onGlobal(window, 'scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }, { passive: true });
    update();

    fx.setPostMode = function (flag) { inPost = !!flag; };
  };

  /* ---------------------------------------------------- 彩纸 */
  fx.confetti = function (options) {
    var canvas = document.getElementById('confetti');
    if (!canvas) return;
    if (reduced()) return;
    var opts = options || {};
    var ctx = canvas.getContext('2d');
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = window.innerWidth;
    var h = window.innerHeight;
    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var palette = fx.paletteColors();
    var colors = [palette.c1, palette.c2, palette.c3, palette.text].map(function (c) { return fx.toRgb(c, 1); });
    var count = opts.count || 90;
    var originX = opts.x === undefined ? w / 2 : opts.x;
    var originY = opts.y === undefined ? h * 0.34 : opts.y;
    var particles = [];

    for (var i = 0; i < count; i++) {
      var angle = Math.random() * Math.PI * 2;
      var speed = 4 + Math.random() * 11;
      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed * (0.6 + Math.random()),
        vy: Math.sin(angle) * speed - 4 - Math.random() * 4,
        size: 5 + Math.random() * 9,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
        life: 1
      });
    }

    var raf = 0;
    var start = window.performance.now();

    function frame(now) {
      var elapsed = now - start;
      ctx.clearRect(0, 0, w, h);
      var alive = 0;
      for (var i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.vy += 0.34;
        p.vx *= 0.995;
        p.vy *= 0.995;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        p.life = Math.max(0, 1 - elapsed / 2600);
        if (p.life <= 0 || p.y > h + 60) continue;
        alive++;
        ctx.save();
        ctx.globalAlpha = Math.min(1, p.life * 1.6);
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      }
      if (alive > 0) raf = window.requestAnimationFrame(frame);
      else ctx.clearRect(0, 0, w, h);
    }
    raf = window.requestAnimationFrame(frame);
    return function cancel() { window.cancelAnimationFrame(raf); ctx.clearRect(0, 0, w, h); };
  };

  /* ---------------------------------------------------- 封面渐变动画 */
  fx.coverShift = function (root) {
    if (reduced()) return;
    fx.qsa('[data-cover-hue]', root).forEach(function (el) {
      fx.on(el, 'pointerenter', function () {
        el.style.filter = 'hue-rotate(28deg) saturate(1.15)';
      });
      fx.on(el, 'pointerleave', function () { el.style.filter = ''; });
    });
  };

  /* ---------------------------------------------------- 分享 / 复制链接 */
  fx.share = function (root) {
    fx.qsa('[data-share]', root).forEach(function (btn) {
      fx.on(btn, 'click', function () {
        var url = window.location.href;
        var title = document.title;
        if (navigator.share && btn.getAttribute('data-share') === 'native') {
          navigator.share({ title: title, url: url }).catch(function () {});
          return;
        }
        var done = function () { fx.toast('链接已复制'); };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(url).then(done, function () { fallbackCopy(url, done); });
        } else {
          fallbackCopy(url, done);
        }
      });
    });
  };

  /* ---------------------------------------------------- 视图初始化总入口 */
  fx.scope = function (root) {
    fx.clearScope();
    fx.reveal(root);
    fx.tilt(root);
    fx.magnetic(root);
    fx.ripple(root);
    fx.marquees(root);
    fx.counters(root);
    fx.typewriter(root);
    fx.highlight(root);
    fx.codeBlocks(root);
    fx.toc(root);
    fx.coverShift(root);
    fx.share(root);
  };
})();
