/* ==========================================================================
   store.js — 本地偏好、配色切换、收藏与点赞
   一切状态都保存在 localStorage，不做任何网络请求。
   ========================================================================== */
(function () {
  var KEY = 'aesthetics:prefs:v1';
  var root = document.documentElement;

  var CUSTOM_VARS = [
    '--bg', '--bg-2', '--surface', '--surface-2', '--line', '--text', '--text-dim',
    '--c1', '--c2', '--c3', '--on-c1', '--on-c2', '--on-c3',
    '--glow-1', '--glow-2', '--glow-3', '--shadow', '--scrim', '--grid-line'
  ];

  function prefersReduced() {
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function hasFinePointer() {
    return window.matchMedia && window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  }

  function defaults() {
    return {
      palette: 'void',
      customVars: null,
      motion: prefersReduced() ? 'subtle' : 'full',
      cursor: hasFinePointer() ? 'on' : 'off',
      grain: 'on',
      aurora: 'on',
      marquee: 'on',
      fontScale: 1,
      likes: [],
      saved: [],
      reads: {},
      visits: 0
    };
  }

  var prefs = defaults();

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return;
      var parsed = JSON.parse(raw);
      Object.keys(parsed).forEach(function (k) {
        if (parsed[k] !== undefined && parsed[k] !== null) prefs[k] = parsed[k];
      });
      prefs.likes = Array.isArray(prefs.likes) ? prefs.likes : [];
      prefs.saved = Array.isArray(prefs.saved) ? prefs.saved : [];
      prefs.reads = prefs.reads && typeof prefs.reads === 'object' ? prefs.reads : {};
    } catch (err) {
      /* 存储不可用时静默降级为内存状态 */
    }
  }

  function write() {
    try {
      localStorage.setItem(KEY, JSON.stringify(prefs));
    } catch (err) { /* 隐私模式或配额不足：忽略 */ }
  }

  function emit(key) {
    window.dispatchEvent(new CustomEvent('ab:prefs', { detail: { key: key, prefs: prefs } }));
  }

  /* 色相 → 十六进制 ----------------------------------------------------- */
  function hslToHex(h, s, l) {
    h = ((h % 360) + 360) % 360;
    s = Math.max(0, Math.min(100, s)) / 100;
    l = Math.max(0, Math.min(100, l)) / 100;
    var c = (1 - Math.abs(2 * l - 1)) * s;
    var x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    var m = l - c / 2;
    var rgb = [0, 0, 0];
    if (h < 60) rgb = [c, x, 0];
    else if (h < 120) rgb = [x, c, 0];
    else if (h < 180) rgb = [0, c, x];
    else if (h < 240) rgb = [0, x, c];
    else if (h < 300) rgb = [x, 0, c];
    else rgb = [c, 0, x];
    return '#' + rgb.map(function (v) {
      var n = Math.round((v + m) * 255).toString(16);
      return n.length === 1 ? '0' + n : n;
    }).join('');
  }

  function rgba(h, s, l, a) {
    return 'hsla(' + Math.round(h) + ' ' + Math.round(s) + '% ' + Math.round(l) + '% / ' + a + ')';
  }

  /* 用一条色相生成完整的自定义配色变量 -------------------------------- */
  function customVarsFor(hue, scheme, secondaryShift, tertiaryShift) {
    var dark = scheme !== 'light';
    var h2 = ((hue + (secondaryShift || 168)) % 360 + 360) % 360;
    var h3 = ((hue + (tertiaryShift || 312)) % 360 + 360) % 360;
    var vars = {};

    if (dark) {
      vars['--bg'] = hslToHex(hue, 22, 4);
      vars['--bg-2'] = hslToHex(hue, 24, 7);
      vars['--surface'] = hslToHex(hue, 20, 10);
      vars['--surface-2'] = hslToHex(hue, 20, 14);
      vars['--line'] = hslToHex(hue, 18, 20);
      vars['--text'] = hslToHex(hue, 24, 97);
      vars['--text-dim'] = hslToHex(hue, 16, 64);
      vars['--c1'] = hslToHex(hue, 92, 62);
      vars['--c2'] = hslToHex(h2, 88, 66);
      vars['--c3'] = hslToHex(h3, 86, 64);
      vars['--on-c1'] = hslToHex(hue, 30, 8);
      vars['--on-c2'] = hslToHex(h2, 30, 8);
      vars['--on-c3'] = hslToHex(h3, 30, 8);
      vars['--shadow'] = '0 30px 70px -30px hsla(' + hue + ' 60% 2% / 0.92)';
      vars['--scrim'] = rgba(hue, 24, 4, 0.74);
      vars['--grid-line'] = 'hsla(' + hue + ' 60% 92% / 0.05)';
    } else {
      vars['--bg'] = hslToHex(hue, 34, 95);
      vars['--bg-2'] = hslToHex(hue, 40, 98);
      vars['--surface'] = hslToHex(hue, 30, 100);
      vars['--surface-2'] = hslToHex(hue, 36, 96);
      vars['--line'] = hslToHex(hue, 26, 87);
      vars['--text'] = hslToHex(hue, 28, 10);
      vars['--text-dim'] = hslToHex(hue, 14, 42);
      vars['--c1'] = hslToHex(hue, 84, 46);
      vars['--c2'] = hslToHex(h2, 74, 48);
      vars['--c3'] = hslToHex(h3, 78, 50);
      vars['--on-c1'] = hslToHex(hue, 40, 98);
      vars['--on-c2'] = hslToHex(h2, 40, 98);
      vars['--on-c3'] = hslToHex(h3, 40, 98);
      vars['--shadow'] = '0 26px 60px -32px hsla(' + hue + ' 40% 24% / 0.28)';
      vars['--scrim'] = rgba(hue, 34, 96, 0.8);
      vars['--grid-line'] = 'hsla(' + hue + ' 40% 12% / 0.06)';
    }

    vars['--glow-1'] = rgba(hue, 90, 58, 0.32);
    vars['--glow-2'] = rgba(h2, 88, 60, 0.28);
    vars['--glow-3'] = rgba(h3, 86, 58, 0.28);
    return vars;
  }

  function applyCustomVars(vars) {
    if (!vars) {
      CUSTOM_VARS.forEach(function (name) { root.style.removeProperty(name); });
      return;
    }
    CUSTOM_VARS.forEach(function (name) {
      if (vars[name]) root.style.setProperty(name, vars[name]);
    });
  }

  function metaTheme(color) {
    var meta = document.getElementById('themeColor');
    if (meta && color) meta.setAttribute('content', color);
  }

  var store = {
    prefs: prefs,

    init: function () {
      read();
      if (prefs.customVars) applyCustomVars(prefs.customVars);
      prefs.visits = (prefs.visits || 0) + 1;
      write();
      this.apply('init');
      return prefs;
    },

    /* 应用所有偏好到 DOM ------------------------------------------------- */
    apply: function (key) {
      root.setAttribute('data-palette', prefs.palette);
      root.setAttribute('data-motion', prefs.motion);
      root.setAttribute('data-cursor', prefs.cursor);
      root.setAttribute('data-grain', prefs.grain);
      root.setAttribute('data-aurora', prefs.aurora);
      root.setAttribute('data-marquee', prefs.marquee);
      root.style.setProperty('--font-scale', String(prefs.fontScale));

      var palette = AB.findPalette(prefs.palette);
      metaTheme(palette ? palette.bg : '#07070a');

      var label = document.getElementById('footerPalette');
      if (label) label.textContent = palette ? palette.name : 'Custom';

      var current = document.querySelectorAll('[data-palette-id]');
      Array.prototype.forEach.call(current, function (el) {
        el.classList.toggle('is-current', el.getAttribute('data-palette-id') === prefs.palette);
      });

      var motionSeg = document.querySelectorAll('#motionSeg button');
      Array.prototype.forEach.call(motionSeg, function (btn) {
        btn.classList.toggle('is-active', btn.getAttribute('data-motion') === prefs.motion);
      });
      var fontSeg = document.querySelectorAll('#fontSeg button');
      Array.prototype.forEach.call(fontSeg, function (btn) {
        btn.classList.toggle('is-active', parseFloat(btn.getAttribute('data-font')) === prefs.fontScale);
      });
      var toggles = document.querySelectorAll('[data-toggle]');
      Array.prototype.forEach.call(toggles, function (input) {
        var name = input.getAttribute('data-toggle');
        if (name === 'cursor') input.checked = prefs.cursor === 'on';
        if (name === 'grain') input.checked = prefs.grain === 'on';
        if (name === 'aurora') input.checked = prefs.aurora === 'on';
        if (name === 'marquee') input.checked = prefs.marquee === 'on';
      });

      write();
      emit(key || 'apply');
    },

    set: function (key, value) {
      prefs[key] = value;
      this.apply(key);
      return value;
    },

    get: function (key) {
      return prefs[key];
    },

    /* 配色 --------------------------------------------------------------- */
    setPalette: function (id, customVars) {
      if (customVars) {
        prefs.customVars = customVars;
        applyCustomVars(customVars);
      } else {
        if (prefs.customVars) {
          CUSTOM_VARS.forEach(function (name) { root.style.removeProperty(name); });
          prefs.customVars = null;
        }
      }
      prefs.palette = id;
      this.apply('palette');
      return id;
    },

    cyclePalette: function (step) {
      var list = AB.PALETTES;
      var idx = 0;
      for (var i = 0; i < list.length; i++) {
        if (list[i].id === prefs.palette) idx = i;
      }
      idx = (idx + (step || 1) + list.length) % list.length;
      return this.setPalette(list[idx].id);
    },

    /* 随机生成一套配色：随机色相 + 随机明暗 + 固定调和关系 */
    randomPalette: function () {
      var hue = Math.round(Math.random() * 360);
      var scheme = Math.random() > 0.55 ? 'dark' : 'light';
      var harmony = [150, 168, 180, 200, 210, 120, 90][Math.floor(Math.random() * 7)];
      var tertiary = [-140, -120, -96, 96, 120, 140][Math.floor(Math.random() * 6)];
      var vars = customVarsFor(hue, scheme, harmony, tertiary);
      this.setPalette('custom', vars);
      return {
        id: 'custom',
        name: 'Custom',
        mood: '随机 · H' + hue,
        scheme: scheme,
        swatches: [vars['--c1'], vars['--c2'], vars['--c3']],
        hue: hue
      };
    },

    /* 当前配色（内置或自定义） ------------------------------------------- */
    current: function () {
      return AB.findPalette(prefs.palette) || {
        id: 'custom',
        name: 'Custom',
        mood: '随机',
        swatches: prefs.customVars
          ? [prefs.customVars['--c1'], prefs.customVars['--c2'], prefs.customVars['--c3']]
          : ['#c8ff2f', '#6b5cff', '#ff4d6d']
      };
    },

    /* 收藏与点赞 --------------------------------------------------------- */
    toggleList: function (key, slug) {
      var list = prefs[key] || [];
      var i = list.indexOf(slug);
      if (i > -1) list.splice(i, 1);
      else list.push(slug);
      prefs[key] = list;
      write();
      emit(key);
      return i === -1;
    },
    has: function (key, slug) {
      return (prefs[key] || []).indexOf(slug) > -1;
    },
    saveRead: function (slug, ratio) {
      prefs.reads[slug] = Math.round(Math.max(0, Math.min(1, ratio)) * 100) / 100;
      write();
    },
    readRatio: function (slug) {
      return prefs.reads[slug] || 0;
    },

    reset: function () {
      var keepVisits = prefs.visits;
      CUSTOM_VARS.forEach(function (name) { root.style.removeProperty(name); });
      prefs = defaults();
      prefs.visits = keepVisits || 0;
      this.prefs = prefs;
      this.apply('reset');
    },

    /* 外部工具 */
    hslToHex: hslToHex,
    rgba: rgba,
    customVarsFor: customVarsFor
  };

  AB.store = store;
})();
