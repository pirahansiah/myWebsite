/* Static site loader.
   Home (') / #home) content is baked into index.html (id="baked-home").
   Other routes (e.g. #atlas, #content/slug) are fetched as .md and rendered
   into #content. Supports #file:anchor section scrolling. */
(function(){
  'use strict';
  var DEFAULT = 'home';
  var SECTIONS = [ // nav items: ONLY these three (per user)
    { label:'Home',          icon:'🏠', type:'hash', file:'home', anchor:'top' },
    { label:'Atlas',         icon:'🗂️', type:'hash', file:'atlas', anchor:'top' },
    { label:'Search Swarm',  icon:'🕸️', type:'link', href:'/farshid/swarm/' },
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

  function renderMarkdownRoute(file, anchor){
    var path;
    if (file==='home' || file==='atlas') path=file+'.md';
    else if (file.indexOf('/')>=0) path=file+'.md';
    else path='content/'+file+'.md';
    fetch(path)
      .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.text(); })
      .then(function(txt){ renderInto(txt, file, anchor); })
      .catch(function(){
        $id('content').innerHTML =
          '<p class="err">Page not found. <a id="err-back" href="#atlas">Back to the Atlas.</a></p>';
        var eb=$id('err-back');
        if(eb) eb.addEventListener('click', function(e){ e.preventDefault(); navigate('atlas'); });
      });
  }

  function renderInto(txt, file, anchor){
    var c=$id('content');
    var h1m = txt.match(/^#\s+(.+)$/m);
    document.title = (h1m?h1m[1].trim()+' — ':'')+'Farshid Pirahansiah';
    c.innerHTML = '<article class="article">'+window.renderMarkdown(txt)+'</article>';
    c.querySelectorAll('h1,h2,h3').forEach(function(h,i){ if(!h.id) h.id = slug(h.textContent); });
    highlightNav(file, anchor||'');
    wireLinks(c);
    if(anchor && anchor!=='top'){
      var el=c.querySelector('#'+slug(anchor));
      if(el) setTimeout(function(){ el.scrollIntoView({behavior:'smooth',block:'start'}); },30);
    } else {
      window.scrollTo(0,0);
    }
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
      if(/^(#|mailto:)/.test(href)) return;
      if(/^(https?:)?\/\//.test(href)){ a.setAttribute('target','_blank'); return; }
      // internal .md link -> route
      if(/\.md(?:[#:]|$)/.test(href)){
        var m=href.match(/^([^#:]+\.md)(?:[#:](.+))?$/);
        var targetFile=m[1].replace(/\.md$/,'').replace(/^\/content\//,'').replace(/^\//,'');
        var targetAnchor=m[2]||'';
        a.addEventListener('click', function(e){ e.preventDefault(); navigate(targetFile+(targetAnchor?':'+slug(targetAnchor):'')); });
      } else {
        a.setAttribute('target','_blank');
      }
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
    if(baked) baked.removeAttribute('hidden');
    c.innerHTML='';
    document.title='Dr. Farshid Pirahansiah — Computer Vision & Edge AI Engineer';
    highlightNav('home','');
    window.scrollTo(0,0);
  }
  function showMarkdown(file, anchor){
    var baked=$id('baked-home');
    if(baked) baked.setAttribute('hidden','');
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
      html += '<a class="nav-item" data-key="'+key+'" href="'+href+'"><span class="nav-icon">'+(s.icon||'')+'</span>'+(s.icon?' ': '')+s.label+'</a>';
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