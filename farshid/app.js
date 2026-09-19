/* Static site loader.
   Home (') / #home) content is baked into index.html (id="baked-home").
   Other routes (e.g. #atlas, #content/slug) are fetched as .md and rendered
   into #content. Supports #file:anchor section scrolling. */
(function(){
  'use strict';
  var DEFAULT = 'home';
  // Drawn 16px icons, 1.5 stroke beside 500-weight text, currentColor so CSS owns
  // their states. (Emoji standing in for an icon set is a tell, not an icon system.)
  var ICONS = {
    home: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2.2 7.1 8 2.4l5.8 4.7V13a1 1 0 0 1-1 1h-3v-3.6H6.2V14h-3a1 1 0 0 1-1-1z"/></svg>',
    atlas: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" aria-hidden="true"><rect x="2.4" y="2.4" width="4.6" height="4.6" rx="1.2"/><rect x="9" y="2.4" width="4.6" height="4.6" rx="1.2"/><rect x="2.4" y="9" width="4.6" height="4.6" rx="1.2"/><rect x="9" y="9" width="4.6" height="4.6" rx="1.2"/></svg>',
    search: '<svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" aria-hidden="true"><circle cx="7.2" cy="7.2" r="4.3"/><path d="m10.5 10.5 3.1 3.1"/></svg>'
  };
  var SECTIONS = [ // nav items: ONLY these three (per user)
    { label:'Home',          icon:'home',   type:'hash', file:'home', anchor:'top' },
    { label:'Atlas',         icon:'atlas',  type:'hash', file:'atlas', anchor:'top' },
    { label:'Search Swarm',  icon:'search', type:'link', href:'/farshid/content/swarm.html' },
  ];

  function $id(i){ return document.getElementById(i); }
  function hashParts(){
    var h=(location.hash||'').replace(/^#\/?/,'').replace(/\.md$/,'');
    var parts=h.split(':');
    return {file:parts[0], anchor:parts[1]||null};
  }
  function slug(s){ return (s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }

  function isHome(){
    var h=(location.hash||'').replace(/^#\/?/,'').replace(/\.md$/,'');
    return (h==='' || h==='home');
  }

  var currentFile='';        // the page being read — used to resolve relative .md links
  function renderMarkdownRoute(file, anchor){
    var path;
    var f = (file||'').replace(/^content\//,'');        // '#content/<page>' is the usual route shape
    if (file.indexOf('.html')>=0)      path='/farshid/'+file;             // an app-shell route
    else if (f.indexOf('/')>=0)        path='/farshid/'+f+'.md';          // projects/<name>/README
    else                               path='/farshid/content/'+f+'.md';  // everything else
    currentFile = f;
    fetch(path)
      .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.text(); })
      .then(function(txt){ renderInto(txt, file, anchor); })
      .catch(function(){ routeMissing(file, anchor); });
  }

  /* A route this site no longer has: an old bookmark, a stale QR code, or — the
     common one — an in-page anchor that got promoted to a whole route
     (…/index.html#talks-presentations-keynotes). Those ids belong to the Atlas,
     so land on the right section instead of dead-ending on "Page not found". */
  var ATLAS_SECTIONS = ['publications','courses','notes-guides','talks-presentations-keynotes','site-pages','projects'];
  var LEGACY_ROUTES = {
    'slides'  : 'atlas:talks-presentations-keynotes',
    'talks'   : 'atlas:talks-presentations-keynotes',
    'presentations': 'atlas:talks-presentations-keynotes',
    'docs'    : 'atlas:notes-guides',
    'notes'   : 'atlas:notes-guides',
    'research': 'atlas:publications',
    'pubs'    : 'atlas:publications'
  };
  function routeMissing(file, anchor){
    var name = (file||'').replace(/^\/+|\/+$/g,'');
    if(LEGACY_ROUTES[name]){ setHash(LEGACY_ROUTES[name]); return; }
    var sec = ATLAS_SECTIONS.indexOf(name)>=0 ? name
            : (ATLAS_SECTIONS.indexOf(anchor||'')>=0 ? anchor : null);
    if(sec && name!=='atlas'){ setHash('atlas:'+sec); return; }
    var c=$id('content');
    if(c) c.innerHTML = '<p class="err">That page is gone. The <a id="err-atlas" href="#atlas">Atlas</a>'+
      ' indexes every publication, note, talk and project on this site.</p>';
    var eb=$id('err-atlas');
    if(eb) eb.addEventListener('click', function(e){ e.preventDefault(); setHash('atlas'); });
    document.title='Not found — Farshid Pirahansiah';
  }

  function renderInto(txt, file, anchor){
    var c=$id('content');
    var h1m = txt.match(/^#\s+(.+)$/m);
    var h1 = h1m ? h1m[1].replace(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}]/gu,'').trim() : '';
    var fm = txt.match(/^---\s*\n([\s\S]*?)\n---/);            // front matter: the page's own title wins
    var ft = fm && fm[1].match(/^title:\s*(.+)$/m);
    if(ft) h1 = ft[1].replace(/^["']|["']$/g,'').trim();
    document.title = (h1?h1+' — ':'')+'Farshid Pirahansiah';
    // Long text fills the display: prose pages split into columns on wide screens.
    // A page that ships its own panels (atlas index, decks, QR grid, games, wiki layout)
    // keeps the single full-width flow — columns inside those would fight their own layout.
    var rbody = window.renderMarkdown(txt);
    var PANEL = /class="[^"]*\b(hero|atlas-list|presentation-panel|wiki-cols|wiki-wrap|qr-grid|sitemap-grid|game-page|sga-wrap|crypto-panel|mm-hero|swarm-studio|send-panel)\b/;
    c.innerHTML = '<article class="article' + (PANEL.test(rbody) ? '' : ' prose-cols') + '">' + rbody + '</article>';
    c.querySelectorAll('h1,h2,h3').forEach(function(h,i){ if(!h.id) h.id = slug(h.textContent); });
    highlightNav(file, anchor||'');
    wireLinks(c);
    wireCopy(c);
    initDeckIfPresent(c);   // reveal.js deck pages render as slide presentations
    if(anchor && anchor!=='top'){
      var el=c.querySelector('#'+slug(anchor));
      if(el) setTimeout(function(){ el.scrollIntoView({behavior:'smooth',block:'start'}); },30);
    } else {
      window.scrollTo(0,0);
    }
  }

  /* ---- reveal.js decks: render a slide presentation from the .md source ---- */
  var __deckPanel=null, __deckReloading=false;
  function deckAssets(){
    if(document.getElementById('reveal-theme')) return;
    var base='https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.6.1/';
    [['reveal-core','reveal.min.css'],['reveal-theme','theme/white.min.css'],['deck-css','/farshid/deck.css']]
      .forEach(function(p){
        var l=document.createElement('link'); l.id=p[0]; l.rel='stylesheet';
        l.href = p[1].charAt(0)==='/' ? p[1] : base+p[1];
        document.head.appendChild(l);
      });
  }
  function initDeckIfPresent(c){
    var panel=c.querySelector('.presentation-panel');
    if(__deckPanel){ __deckPanel.__deck && __deckPanel.__deck.destroy && __deckPanel.__deck.destroy(); __deckPanel.__deck=null; __deckPanel.__taps=false; __deckPanel=null; }
    document.body.classList.remove('deck-mode');
    if(!panel){ __deckReloading=false; return; }
    __deckPanel=panel;
    document.body.classList.add('deck-mode');   // the deck owns the screen: no title, nav or footer above it
    deckAssets();
    if(window.Reveal){ bootDeck(panel); }
    else if(!__deckReloading){
      __deckReloading=true;
      var s=document.createElement('script'); s.src='https://cdnjs.cloudflare.com/ajax/libs/reveal.js/4.6.1/reveal.js';
      s.onload=function(){ __deckReloading=false; bootDeck(panel); };
      s.onerror=function(){ __deckReloading=false; /* CDN blocked: keep stacked slides (already readable) */ };
      document.head.appendChild(s);
    }
  }
  function bootDeck(panel){
    var portrait = window.innerWidth < 760 && window.innerHeight > window.innerWidth;
    panel.__deck = new Reveal(panel, {
      embedded: true, hash: false, center: true, touch: true, keyboard: true,
      controls: true, progress: true, slideNumber: 'c/t',
      width: portrait ? 760 : 1120, height: portrait ? 1080 : 760,
      margin: 0.05, minScale: 0.2, maxScale: 2.0
    });
    panel.__deck.initialize();
    panel.__deck.on('slidechanged', function(){ panel.classList.add('deck-started'); });
    var rb=document.getElementById('restart-btn');
    if(rb) rb.addEventListener('click', function(e){ e.stopPropagation(); panel.__deck.slide(0); });
    wireDeckTaps(panel);
  }
  /* Tap navigation: tap the right side -> next slide, tap the left side -> previous.
     Reveal's own swipe handling stays on, so a drag works too. Taps that land on a link,
     a button or the controls are left alone. */
  function wireDeckTaps(panel){
    if(panel.__taps) return;
    panel.__taps=true;
    var down=null;
    panel.addEventListener('pointerdown', function(e){ down={x:e.clientX,y:e.clientY,t:Date.now()}; }, true);
    panel.addEventListener('pointerup', function(e){
      if(!down||!panel.__deck){ down=null; return; }
      var dx=Math.abs(e.clientX-down.x), dy=Math.abs(e.clientY-down.y);
      var quick=(Date.now()-down.t)<600, still=(dx<12&&dy<12);
      down=null;
      if(!quick||!still) return;
      if(e.target&&e.target.closest&&e.target.closest('a,button,input,select,summary,.controls,.progress,.slide-number')) return;
      var r=panel.getBoundingClientRect();
      if((e.clientX-r.left) < r.width*0.45){ panel.__deck.prev(); } else { panel.__deck.next(); }
    }, true);
  }

  function highlightNav(file, anchor){
    document.querySelectorAll('.nav a').forEach(function(a){
      var k = file+'|'+((anchor&&anchor!=='top')?slug(anchor):'');
      a.classList.toggle('active', a.getAttribute('data-key')===k);
    });
  }

  function wireLinks(c){
    if(!c) return;
    c.querySelectorAll('a[href]').forEach(function(a){
      var href=a.getAttribute('href').replace(/&amp;/g,'&');
      if(/^(mailto:|tel:)/.test(href)) return;
      /* In-page anchor (Atlas jump pills, "back to top"). Following it bare would
         replace the whole route — index.html#talks-presentations-keynotes — and the
         app would then hunt for a page by that name. Scroll instead, and keep the
         URL a valid route so a reload or a shared link still works. */
      if(/^#/.test(href)){
        if(/^#\//.test(href)) return;              // reveal.js controls
        var id=href.slice(1); if(!id) return;
        a.addEventListener('click', function(e){
          var el=document.getElementById(id);
          var route=(currentRoute||'').replace(/^#+/,'').split(':')[0];
          if(el){
            e.preventDefault();
            el.scrollIntoView({behavior:'smooth',block:'start'});
            try{ history.replaceState(null,'','#'+route+':'+slug(id)); }catch(err){}
          } else if(route){
            e.preventDefault(); setHash('atlas:'+slug(id));   // the anchor lives on the Atlas
          }
        });
        return;
      }
      if(/^(https?:)?\/\//.test(href)){ a.setAttribute('target','_blank'); return; }
      // internal .md link -> route (strip permanent /farshid/ prefix, then /content/);
      // a relative link (localAI.md) is resolved against the page you are reading
      if(/\.md(?:[#:]|$)/.test(href)){
        var m=href.match(/^([^#:]+\.md)(?:[#:](.+))?$/);
        var rel=m[1], base=(currentFile||'').indexOf('/')>=0 ? currentFile.replace(/\/[^\/]*$/,'')+'/' : '';
        var mp=rel.replace(/\.[mM][dD]$/,'');
        if(!/^\//.test(rel) && base) mp=base+mp;                     // relative to this page
        mp=mp.replace(/^\/farshid\//,'').replace(/^\/content\//,'').replace(/^\//,'');
        var targetAnchor=m[2]||'';
        a.addEventListener('click', function(e){ e.preventDefault(); setHash(mp+(targetAnchor?':'+slug(targetAnchor):'')); });
      }
      // internal absolute paths (canonical static pages, qr/swarm tools) navigate in the same tab
    });
  }

  /* Copy buttons. A markdown page cannot carry <script> (HTML injected through
     innerHTML never executes), so the engine wires them: any element with a
     data-copy attribute copies its value and flashes the label. Works on the QR
     page (URLs, referral links, wallet addresses) and anywhere else. */
  function copyLegacy(v){
    try{
      var ta=document.createElement('textarea');
      ta.value=v; ta.setAttribute('readonly','');
      ta.style.position='fixed'; ta.style.top='-1000px'; ta.style.opacity='0';
      document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, v.length);
      var ok=document.execCommand('copy');
      document.body.removeChild(ta); return ok;
    }catch(err){ return false; }
  }
  function copyValue(v){
    if(navigator.clipboard && window.isSecureContext){
      return navigator.clipboard.writeText(v).then(function(){ return true; }, function(){ return copyLegacy(v); });
    }
    return Promise.resolve(copyLegacy(v));
  }
  function wireCopy(c){
    if(!c) return;
    c.querySelectorAll('[data-copy]').forEach(function(el){
      if(el.__copyWired) return;
      el.__copyWired=true;
      var label = el.getAttribute('data-label') || el.textContent || 'Copy';
      el.setAttribute('data-label', label);
      el.addEventListener('click', function(e){
        e.preventDefault(); e.stopPropagation();
        copyValue(el.getAttribute('data-copy')).then(function(ok){
          el.classList.add(ok ? 'is-copied' : 'is-copy-failed');
          el.textContent = ok ? 'Copied' : 'Press Ctrl+C';
          setTimeout(function(){
            el.classList.remove('is-copied','is-copy-failed');
            el.textContent = label;
          }, 1600);
        });
      });
    });
  }

  /* The single entry point: decide home (baked) vs fetched markdown. */
  function navigate(h){
    currentRoute = h||'';
    var hp = hashPartsFrom(h||'');
    var file = hp.file || DEFAULT;
    var anchor = hp.anchor;
    if(isHomeHash(file, anchor)){
      showHome();
    } else {
      showMarkdown(file, anchor);
    }
  }

  var currentRoute='';
  function hashPartsFrom(h){
    h=h.replace(/^#\/?/,'').replace(/\.md$/,'');
    var parts=h.split(':');
    return {file:parts[0], anchor:parts[1]||null};
  }
  function isHomeHash(file, anchor){ return (file===''||file==='home'); }

  function showHome(){
    var baked=$id('baked-home'), c=$id('content');
    c.setAttribute('hidden','');          // markdown container hidden — home is baked
    if(baked) baked.removeAttribute('hidden');
    c.innerHTML='';
    document.title='Dr. Farshid Pirahansiah — Computer Vision & Edge AI Engineer';
    highlightNav('home','');
    window.scrollTo(0,0);
  }
  function showMarkdown(file, anchor){
    var baked=$id('baked-home');
    if(baked) baked.setAttribute('hidden','');
    $id('content').removeAttribute('hidden');   // reveal markdown container
    renderMarkdownRoute(file, anchor);
  }

  function buildNav(){
    var nav=$id('nav'); if(!nav) return;
    var html='';
    SECTIONS.forEach(function(s){
      var key;
      if(s.type==='link'){ key=('link:'+s.href); }
      else { key=s.file+'|'+(s.anchor&&s.anchor!=='top'?slug(s.anchor):''); }
      var href = s.type==='link' ? s.href : ('#'+s.file+(s.anchor&&s.anchor!=='top'?':'+slug(s.anchor):''));
      html += '<a class="nav-item" data-key="'+key+'" href="'+href+'"><span class="nav-icon">'+(ICONS[s.icon]||'')+'</span>'+s.label+'</a>';
    });
    nav.innerHTML=html;
    nav.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(e){
        if(a.getAttribute('data-key').indexOf('link:')===0) return; // let it navigate normally
        e.preventDefault(); setHash(a.getAttribute('href').replace(/^#/,''));
      });
    });
  }

  // ---- routing by hash ----
  function setHash(h){
    try{ history.replaceState(null,'','#'+h); }catch(e){}
    navigate(h);
  }
  function onHashChange(){
    navigate(location.hash||'');
  }

  function init(){
    buildNav();
    wireLinks($id('baked-home'));   // baked home links: keep in-page anchors from hijacking the route
    // mobile nav toggle already handled below via initMobileNav
    navigate(location.hash||'');
  }

  // mobile nav toggle
  function closeNav(){
    var nav=$id('nav'), btn=$id('nav-toggle');
    if(nav) nav.classList.remove('open');
    if(btn) btn.setAttribute('aria-expanded','false');
  }
  function initMobileNav(){
    var nav=$id('nav'), btn=$id('nav-toggle');
    if(!nav||!btn||!('click' in btn)) return;
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      var open=nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open?'true':'false');
    });
    nav.addEventListener('click', function(){ closeNav(); });
    document.addEventListener('click', function(e){ if(!nav.contains(e.target)&&!btn.contains(e.target)) closeNav(); });
  }

  window.addEventListener('hashchange', onHashChange);
  document.addEventListener('DOMContentLoaded', function(){ initMobileNav(); init(); });
  if(document.readyState!=='loading'){ initMobileNav(); init(); }
})();