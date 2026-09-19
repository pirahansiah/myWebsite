/* Minimal, dependency-free markdown renderer for the static site.
   Renders headings, bold, italic, code, links, images, lists, blockquote,
   tables, hr, inline html passthrough (raw), and auto-wraps paragraphs. */
(function (global) {
  'use strict';
  function esc(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
  function inline(s){
    // escape html except when inside a code span
    s = s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    // code
    s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
    // images before links
    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g, '<img src="$2" alt="$1" loading="lazy">');
    // links [text](url) — tolerate a stray trailing space before the `)`
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)(\s*)\)/g, '<a href="$2">$1</a>');
    // bold
    s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/__([^_]+)__/g, '<strong>$1</strong>');
    // italic
    s = s.replace(/\*([^*]+)\*/g, '<em>$1</em>');
    return s;
  }
  function renderMarkdown(src){
    src = src.replace(/\r\n?/g,'\n');
    // strip a leading YAML front matter block (leftover from Jekyll / Google Sites
    // exports). This site has no build step, so it would otherwise show up as
    // visible "layout:/title:" text at the top of the rendered page.
    src = src.replace(/^\s*---[ \t]*\n([\s\S]*?)\n---[ \t]*(?:\n|$)/, function(m, body){
      return /^[A-Za-z0-9_.-]+[ \t]*:/m.test(body) ? '' : m;
    });
    var lines = src.split('\n');
    var html = '', i = 0, listStack = [];
    function inList(){return listStack.length>0;}
    while (i < lines.length){
      var line = lines[i];
      var guardStrip=true;
      // fenced code
      var fm = line.match(/^```(\S*)/);
      if (fm){
        var lang = fm[1], code=[];
        i++;
        while (i<lines.length && !/^```\s*$/.test(lines[i])){ code.push(lines[i]); i++; }
        i++;
        html += '<pre><code'+(lang?' class="lang-'+lang+'"':'')+'>'+esc(code.join('\n'))+'</code></pre>\n';
        continue;
      }
      // headings
      var hm = line.match(/^(#{1,6})\s+(.*)$/);
      if (hm){
        while (inList()){ html += '</'+listStack.pop()+'>\n'; }
        var lvl = hm[1].length, txt = hm[2].replace(/^#+\s*$/,'');
        html += '<h'+lvl+'>'+inline(txt)+'</h'+lvl+'>\n';
        i++; continue;
      }
      // hr
      if (/^\s*([-*_])\s*(?:\1\s*){2,}$/.test(line) || /^\s*(---)\s*$/.test(line)){
        while (inList()){ html += '</'+listStack.pop()+'>\n'; }
        html += '<hr>\n'; i++; continue;
      }
      // blockquote
      var bqm = line.match(/^\s*>\s?(.*)$/);
      if (bqm && !inList()){
        while (inList()){ html += '</'+listStack.pop()+'>\n'; }
        html += '<blockquote>\n';
        while (i<lines.length && /^\s*>/.test(lines[i])){ html += '<p>'+inline(lines[i].replace(/^\s*>\s?/,''))+'</p>\n'; i++; }
        html += '</blockquote>\n';
        continue;
      }
      // unordered list
      var uls = line.match(/^\s*[-*+]\s+(.*)$/);
      // ordered list
      var ols = line.match(/^\s*\d+[.)]\s+(.*)$/);
      if (uls && !inList()){
        listStack.push('ul'); html += '<ul>\n<li>'+inline(uls[1])+'</li>\n';
        i++;
        while (i<lines.length){
          var l2 = lines[i].match(/^\s*[-*+]\s+(.*)$/);
          if (!l2 && /^\s*$/.test(lines[i]) && /^\s*[-*+]\s+/.test(lines[i+1]||'')){ i++; l2 = lines[i].match(/^\s*[-*+]\s+(.*)$/); }
          if (l2){ html += '<li>'+inline(l2[1])+'</li>\n'; i++; }
          else break;
        }
        html += '</ul>\n'; listStack.pop(); continue;
      }
      if (ols && !inList()){
        listStack.push('ol'); html += '<ol>\n<li>'+inline(ols[1])+'</li>\n';
        i++;
        while (i<lines.length){
          var o2 = lines[i].match(/^\s*\d+[.)]\s+(.*)$/);
          // a blank line between two items is a "loose list", not the end of the list:
          // without this every item becomes its own list and restarts at 1.
          if (!o2 && /^\s*$/.test(lines[i]) && /^\s*\d+[.)]\s+/.test(lines[i+1]||'')){ i++; o2 = lines[i].match(/^\s*\d+[.)]\s+(.*)$/); }
          if (o2){ html += '<li>'+inline(o2[1])+'</li>\n'; i++; }
          else break;
        }
        html += '</ol>\n'; listStack.pop(); continue;
      }
      // table (pipe row + separator row)
      if (/^\s*\|.*\|\s*$/.test(line) && i+1<lines.length && /^\s*\|?[\s:|-]+\|?[\s:|-]*\|?\s*$/.test(lines[i+1]) && lines[i+1].includes('-')){
        while (inList()){ html += '</'+listStack.pop()+'>\n'; }
        var header = line.replace(/^\s*\|/,'').replace(/\|\s*$/,'').split('|').map(function(c){return c.trim();});
        i += 2;
        var rows=[];
        while (i<lines.length && /^\s*\|.*\|\s*$/.test(lines[i]) && !/^\s*\|?[\s:|-]+\s*$/.test(lines[i])){
          rows.push(lines[i].replace(/^\s*\|/,'').replace(/\|\s*$/,'').split('|').map(function(c){return c.trim();}));
          i++;
        }
        html += '<table><thead><tr>'+header.map(function(h){return '<th>'+inline(h)+'</th>';}).join('')+'</tr></thead><tbody>';
        for (var r=0;r<rows.length;r++){ html += '<tr>'+rows[r].map(function(c){return '<td>'+inline(c)+'</td>';}).join('')+'</tr>'; }
        html += '</tbody></table>\n'; continue;
      }
      // html comment: a note to the author, not page text. The inline escaper would
      // otherwise print the comment marker on the page, so consume the whole block.
      if (/^\s*<!--/.test(line)){
        while (i < lines.length && !/-->\s*$/.test(lines[i])) i++;
        i++; continue;
      }
      // html passthrough block (raw)
      if (/^\s*<\/?[a-zA-Z][^>]*>/.test(line)){
        while (inList()){ html += '</'+listStack.pop()+'>\n'; }
        html += line.trim() + '\n'; i++; continue;
      }
      // blank -> paragraph break
      if (/^\s*$/.test(line)){ html += '\n'; i++; continue; }
      // paragraph: gather until blank / block start
      var para=[];
      while (i<lines.length){
        var pl=lines[i];
        if (/^\s*$/.test(pl) || /^(#{1,6}\s|```|>|[-*+]\s|\d+[.)]\s|\s*\|.*\|\s*$)/.test(pl) || /^\s*<\/?[a-zA-Z][^>]*>/.test(pl)) break;
        para.push(pl); i++;
      }
      if (para.length){ html += '<p>'+para.map(function(p){return inline(p);}).join(' ')+'</p>\n'; }
    }
    while (inList()){ html += '</'+listStack.pop()+'>\n'; }
    return html;
  }
  global.renderMarkdown = renderMarkdown;
  global.mdEscape = esc;
})(typeof window!=='undefined'?window:this);