/* ==========================================================================
   router.js — Hash 路由 + 三色遮罩过渡
   #/               首页
   #/archive        归档（支持 ?tag=色彩）
   #/post/<slug>    文章
   #/lab            色彩实验室
   #/about          关于
   其他             404
   ========================================================================== */
(function () {
  var viewEl = document.getElementById('view');
  var veil = document.getElementById('veil');
  var busy = false;
  var first = true;
  var current = null;

  function parse(hash) {
    var raw = String(hash || '').replace(/^#/, '');
    if (!raw || raw === '/' || raw === '') return { name: 'home', param: '', query: new URLSearchParams('') };
    if (raw.charAt(0) !== '/') return null; /* 页内锚点（如 #sec-2）交给浏览器处理 */
    raw = raw.slice(1);
    var qIndex = raw.indexOf('?');
    var query = new URLSearchParams(qIndex > -1 ? raw.slice(qIndex + 1) : '');
    var path = qIndex > -1 ? raw.slice(0, qIndex) : raw;
    var parts = path.split('/').filter(Boolean);
    return {
      name: parts[0] || 'home',
      param: parts[1] || '',
      query: query
    };
  }

  function resolve(route) {
    switch (route.name) {
      case 'home': return AB.views.home();
      case 'archive': return AB.views.archive(route.query);
      case 'post': return AB.views.post(decodeURIComponent(route.param || ''), route.query);
      case 'lab': return AB.views.lab();
      case 'about': return AB.views.about();
      case 'saved': return AB.views.saved();
      case 'privacy': return AB.views.privacy();
      default: return AB.views.notfound();
    }
  }

  function setNav(route) {
    var active = route.name === 'post' ? 'archive' : route.name;
    AB.fx.qsa('[data-nav]').forEach(function (link) {
      link.classList.toggle('is-active', link.getAttribute('data-nav') === active);
    });
    AB.fx.qsa('[data-nav-mobile]').forEach(function (link) {
      link.classList.toggle('is-active', link.getAttribute('data-nav-mobile') === active);
    });
  }

  function paint(route, view) {
    viewEl.innerHTML = view.html;
    /* 旧视图的监听在这里、恰好在新视图 mount 之前清掉：
       顺序反过来会把 mount() 里刚注册的监听一起移除。 */
    AB.fx.clearScope();
    if (typeof view.mount === 'function') view.mount(viewEl);
    AB.fx.scope(viewEl);
    document.title = view.title || AB.SITE.name;
    setNav(route);
    var meta = document.querySelector('meta[name="description"]');
    if (meta && view.description) meta.setAttribute('content', view.description);
  }

  function scrollTop(route) {
    if (route.name === 'post') return;
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  function render(route, options) {
    var opts = options || {};
    var view = resolve(route);

    var commit = function () {
      paint(route, view);
      viewEl.classList.remove('view-leave');
      viewEl.classList.add('view-enter');
      window.setTimeout(function () { viewEl.classList.remove('view-enter'); }, 700);
      if (!opts.keepScroll) scrollTop(route);
      if (!first) {
        try { viewEl.focus({ preventScroll: true }); } catch (err) { /* 老浏览器忽略 */ }
      }
      window.dispatchEvent(new CustomEvent('ab:route', { detail: { route: route, view: view, first: first } }));
      current = route;
      first = false;
    };

    var motionOff = AB.store.get('motion') === 'off';
    if (first || motionOff || !veil) {
      commit();
      return;
    }

    if (busy) {
      commit();
      return;
    }

    busy = true;
    veil.classList.remove('is-out');
    veil.classList.add('is-in');
    window.setTimeout(function () {
      commit();
      veil.classList.remove('is-in');
      veil.classList.add('is-out');
      window.setTimeout(function () {
        veil.classList.remove('is-out');
        busy = false;
      }, 520);
    }, 150);
  }

  function handleHash(options) {
    var route = parse(window.location.hash);
    if (!route) {
      /* 页内锚点（#sec-2）：已经渲染过就交给浏览器滚动，不要重新渲染，
         否则点击文章目录会把页面切走；首次打开（直接访问 #sec-2 这类地址）
         才退回首页，避免用户看到一个空白页。 */
      if (!first) return;
      route = { name: 'home', param: '', query: new URLSearchParams('') };
    }
    render(route, options);
  }

  AB.router = {
    start: function () {
      handleHash({ keepScroll: false });
      window.addEventListener('hashchange', function () {
        handleHash({ keepScroll: false });
      });
    },
    go: function (hash) {
      if (window.location.hash === hash) {
        handleHash({ keepScroll: false });
        return;
      }
      window.location.hash = hash;
    },
    current: function () { return current; },
    parse: parse
  };
})();
