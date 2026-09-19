/* Static markdown site loader: route by hash -> fetch .md -> render.
   Supports #file and #file:anchor (e.g. #atlas:publications scrolls to section). */
(function(){
  'use strict';
  var DEFAULT = 'home';
  var SECTIONS = { // nav targets: label -> {file, anchor (raw heading text)}
    'Home':           { file:'home', anchor:'top' },
    'Atlas':          { file:'atlas', anchor:'top' },
    'Publications':   { file:'atlas', anchor:'Publications' },
    'Courses':        { file:'atlas', anchor:'Courses' },
    'Notes':          { file:'atlas', anchor:'Notes & Guides' },
    'Slides':         { file:'atlas', anchor:'Slides & Talks' },
    'Projects':       { file:'atlas', anchor:'Projects' },
  };

  function hashParts(){
    var h=(location.hash||'').replace(/^#\/?/,'').replace(/\.md$/,'');
    var parts=h.split(':');
    return {file:parts[0], anchor:parts[1]||null};
  }
  function slug(s){ return (s||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,''); }

  function load(){
    var hp = hashParts();
    var file = hp.file || DEFAULT;
    var anchor = hp.anchor;
    var path;
    if (file==='home' || file==='atlas') path=file+'.md';  // root-level pages
    else if (file.indexOf('/')>=0) path=file+'.md';   // real subpath (e.g. projects/rag/README)
    else path='content/'+file+'.md';                   // content slug
    fetch(path)
      .then(function(r){ if(!r.ok) throw new Error('HTTP '+r.status); return r.text(); })
      .then(function(txt){ renderInto(txt, file, anchor); })
      .catch(function(){
        document.getElementById('content').innerHTML =
          '<p class="err">Page not found. <a id="err-back" href="#atlas">Back to the Atlas.</a></p>';
        document.getElementById('err-back') && document.getElementById('err-back').addEventListener('click',function(e){e.preventDefault();load();});
      });
  }

  function renderInto(txt, file, anchor){
    var c=document.getElementById('content');
    var h1m = txt.match(/^#\s+(.+)$/m);
    document.title = (h1m?h1m[1].trim()+' — ':'')+'Farshid Pirahansiah';
    c.innerHTML = '<article class="article wrap">'+window.renderMarkdown(txt)+'</article>';
    // give headings ids for anchor nav
    c.querySelectorAll('h1,h2,h3').forEach(function(h,i){
      if(!h.id) h.id = slug(h.textContent);
    });
    // highlight active nav
    document.querySelectorAll('.nav a').forEach(function(a){
      a.classList.toggle('active', a.getAttribute('data-key')=== (file+'|'+(anchor||'')));
    });
    // links
    c.querySelectorAll('a[href]').forEach(function(a){
      var href=a.getAttribute('href').replace(/&amp;/g,'&');
      if(/^(#|mailto:)/.test(href)) return;
      if(/^(https?:)?\/\//.test(href)){ a.setAttribute('target','_blank'); return; }
      // internal .md link -> route
      if(/\.md(?:[#:]|$)/.test(href)){
        var m=href.match(/^([^#:#]*\.md)(?:[#:](.+))?$/);
        var targetFile=m[1].replace(/\.md$/,'').replace(/^\/content\//,'').replace(/^\//,'');
        var targetAnchor=m[2]||'';
        var targetKey = targetFile+'|'+(slug(targetAnchor)||'');
        a.addEventListener('click', function(e){ e.preventDefault(); setHash(targetFile+(targetAnchor?':'+slug(targetAnchor):'')); });
      } else {
        a.setAttribute('target','_blank');
      }
    });
    // scroll to anchor if requested
    if(anchor && anchor!=='top'){
      var el=c.querySelector('#'+slug(anchor));
      if(el) setTimeout(function(){ el.scrollIntoView({behavior:'smooth',block:'start'}); },30);
    } else {
      window.scrollTo(0,0);
    }
  }

  function setHash(h){ 
    try{ history.replaceState(null,'','#'+h); }catch(e){}
    // trigger load directly (replaceState fires no hashchange)
    load();
  }

  function buildNav(){
    var nav=document.getElementById('nav'); if(!nav) return;
    var html='';
    Object.keys(SECTIONS).forEach(function(label){
      var s=SECTIONS[label];
      var key=s.file+'|'+(s.anchor&&s.anchor!=='top'?slug(s.anchor):'');
      html += '<a class="nav-item" data-key="'+key+'" href="#'+s.file+(s.anchor&&s.anchor!=='top'?':'+slug(s.anchor):'')+'">'+label+'</a>';
    });
    nav.innerHTML=html;
    nav.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(e){ e.preventDefault(); setHash(a.getAttribute('href').replace(/^#/,'')); });
    });
  }

  window.addEventListener('hashchange', load);

  // mobile nav toggle
  function closeNav(){
    var nav=document.getElementById('nav'), btn=document.getElementById('nav-toggle');
    if(nav) nav.classList.remove('open');
    if(btn) btn.setAttribute('aria-expanded','false');
  }
  function initMobileNav(){
    var nav=document.getElementById('nav'), btn=document.getElementById('nav-toggle');
    if(!nav||!btn||!('click' in btn)) return;
    btn.addEventListener('click', function(e){
      e.stopPropagation();
      var open=nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open?'true':'false');
    });
    nav.addEventListener('click', function(e){ closeNav(); }); // any nav tap closes
    document.addEventListener('click', function(e){ if(!nav.contains(e.target)&&!btn.contains(e.target)) closeNav(); });
  }

  document.addEventListener('DOMContentLoaded', function(){ buildNav(); initMobileNav(); load(); });
  if(document.readyState!=='loading'){ buildNav(); initMobileNav(); load(); }
})();