/* ==========================================================================
   router.js — 路径路由（History API）+ 三色遮罩过渡
   /                首页
   /archive         归档（支持 /archive?tag=色彩）
   /post/<slug>     文章（/post/<slug>?s=sec-2 定位到第 2 个小节）
   /lab             色彩实验室
   /about           关于
   /saved           本地书架
   /privacy         隐私与数据
   其他路径         404 视图

   服务器侧只需要把上面这些路径回写到 index.html（见 _redirects）；
   未知路径故意不回退，交给 Cloudflare Pages 用它自己的 404.html 响应，
   这样真正的坏地址会返回 404 状态码，而不是伪装成 200 的软 404。
   ========================================================================== */
(function () {
  var viewEl = document.getElementById('view');
  var veil = document.getElementById('veil');
  var busy = false;
  var first = true;
  var current = null;

  /* 站内已知路由。只有它们会被接管点击，此外的路径（/feed.xml、将来的资源文件）
     一律留给浏览器自己处理。 */
  var ROUTES = { home: 1, archive: 1, post: 1, lab: 1, about: 1, saved: 1, privacy: 1 };

  /* file:// 下 origin 是 "null"，pushState 也不可用。路径路由本来就需要一个
     会做回退的服务器，所以这里不做半成品兼容，只把原因讲清楚。 */
  var fileMode = window.location.protocol === 'file:';
  var canPush = !!(window.history && window.history.pushState);

  function normalize(path) {
    var p = String(path == null ? '/' : path);
    if (p.charAt(0) !== '/') p = '/' + p;
    /* /archive/ 与 /archive 视为同一页；根路径永远是 '/' */
    if (p.length > 1) p = p.replace(/\/+$/, '');
    return p || '/';
  }

  function safeDecode(str) {
    try { return decodeURIComponent(str); } catch (err) { return str; }
  }

  /* 把路径（或整条 href）解析成 { name, param, query, path }。
     片段（#sec-2 这类页内锚点）不参与路由，由浏览器自己处理。 */
  function parse(url) {
    var raw = String(url == null ? window.location.pathname + window.location.search : url);
    var hashAt = raw.indexOf('#');
    if (hashAt > -1) raw = raw.slice(0, hashAt);
    var qAt = raw.indexOf('?');
    var query = new URLSearchParams(qAt > -1 ? raw.slice(qAt + 1) : '');
    var path = normalize(qAt > -1 ? raw.slice(0, qAt) : raw);
    var parts = path.split('/').filter(Boolean);
    /* /post/a/b 这种多出一段的地址不是有效路由 */
    if (parts.length > 2) return { name: 'notfound', param: '', query: query, path: path };
    var name = parts[0] || 'home';
    return {
      name: ROUTES[name] ? name : 'notfound',
      param: parts[1] ? safeDecode(parts[1]) : '',
      query: query,
      path: path
    };
  }

  /* 路由的唯一比对键：用于判断「这次点击是不是同一个地址」 */
  function key(route) {
    var q = String(route.query || '');
    return route.path + (q ? '?' + q : '');
  }

  /* 绝对地址。规范链接与 og:url 都走这里，站点域名只有一个来源：AB.SITE.origin */
  function url(path) {
    var site = AB.SITE || {};
    var origin = site.origin ? String(site.origin) : '';
    if (!origin && window.location.origin && window.location.origin !== 'null') origin = window.location.origin;
    origin = origin.replace(/\/+$/, '');
    var p = String(path == null ? '/' : path);
    return origin + (p.charAt(0) === '/' ? p : '/' + p);
  }

  function resolve(route) {
    switch (route.name) {
      case 'home': return AB.views.home();
      case 'archive': return AB.views.archive(route.query);
      case 'post': return AB.views.post(route.param, route.query);
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

  /* 每个视图都有自己的地址，标题与规范链接要跟着换 */
  function setHead(route, view) {
    document.title = view.title || AB.SITE.name;
    var canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute('href', url(route.path));
    var ogUrl = document.querySelector('meta[property="og:url"]');
    if (ogUrl) ogUrl.setAttribute('content', url(route.path));
    var meta = document.querySelector('meta[name="description"]');
    if (meta && view.description) meta.setAttribute('content', view.description);
  }

  function paint(route, view) {
    viewEl.innerHTML = view.html;
    /* 旧视图的监听在这里、恰好在新视图 mount 之前清掉：
       顺序反过来会把 mount() 里刚注册的监听一起移除。 */
    AB.fx.clearScope();
    if (typeof view.mount === 'function') view.mount(viewEl);
    AB.fx.scope(viewEl);
    setHead(route, view);
    setNav(route);
  }

  /* 带 ?s= 的文章地址要在挂载后定位到小节，这里让开，免得和它抢滚动 */
  function scrollTop(route) {
    if (route.name === 'post' && route.query && route.query.get('s')) return;
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

  /* ------------------------------------------------------------------ 导航 */
  function fileHint() {
    if (AB.fx && AB.fx.toast) {
      AB.fx.toast('file:// 下路径路由不可用：请用 python3 -m http.server 8080 打开');
    }
  }

  function writeHistory(target, replace) {
    if (!canPush) return false;
    try {
      window.history[replace ? 'replaceState' : 'pushState'](null, '', target);
      return true;
    } catch (err) {
      /* 隐私模式或异常状态下 pushState 可能抛错：退回整页跳转 */
      return false;
    }
  }

  function navigate(target, options) {
    var path = String(target || '/');
    if (fileMode) { fileHint(); return; }

    var route = parse(path);
    var same = current !== null && key(route) === key(current);
    if (!writeHistory(path, same)) {
      window.location.assign(path);
      return;
    }
    render(route, options);
  }

  /* 只有站内已知路由的点击才被接管；片段链接、外链、/feed.xml 都留给浏览器 */
  function internalRoute(href) {
    if (!href || href.charAt(0) !== '/') return null;
    var route = parse(href);
    return ROUTES[route.name] ? route : null;
  }

  function onClick(e) {
    if (e.defaultPrevented || e.button !== 0) return;
    /* 新标签页 / 新窗口的意图不要拦 */
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var link = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!link) return;
    if (link.target && link.target !== '_self') return;
    if (link.hasAttribute('download')) return;
    if ((link.getAttribute('rel') || '').indexOf('external') > -1) return;
    if (link.hasAttribute('data-prevent-route')) return;

    var route = internalRoute(link.getAttribute('href'));
    if (!route) return;
    e.preventDefault();

    if (fileMode) { fileHint(); return; }
    var same = current !== null && key(route) === key(current);
    if (same) { scrollTop(route); return; }
    navigate(link.getAttribute('href'));
  }

  function onPop() {
    /* 后退 / 前进：滚动位置交给浏览器恢复，本节不做干预 */
    render(parse(), { keepScroll: true });
  }

  /* 旧地址（/#/post/slug）换到新地址（/post/slug），老收藏与老分享链接照常打开 */
  function upgradeLegacyHash() {
    var hash = window.location.hash;
    if (hash.length > 1 && hash.charAt(1) === '/') {
      writeHistory(hash.slice(1), true);
    }
  }

  AB.router = {
    start: function () {
      upgradeLegacyHash();
      /* file:// 下没有可解析的站内路径，直接渲染首页并给出说明 */
      render(fileMode ? parse('/') : parse(), { keepScroll: true });
      if (fileMode) {
        var hint = document.createElement('section');
        hint.className = 'container section';
        hint.innerHTML = '<p class="form-note">这个站点用的是路径路由（<code>/post/&lt;slug&gt;</code> 这类地址），' +
          '需要服务器把路径回写到 <code>index.html</code> 才能用：请在仓库根目录运行 ' +
          '<code>python3 -m http.server 8080</code>，再打开 <code>http://localhost:8080</code>。' +
          '（<code>file://</code> 下只能看到这一页，站内链接不可用。）</p>';
        viewEl.insertBefore(hint, viewEl.firstChild);
      }
      window.addEventListener('popstate', onPop);
      document.addEventListener('click', onClick);
    },
    go: navigate,
    url: url,
    current: function () { return current; },
    parse: parse
  };
})();
