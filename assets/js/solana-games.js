/* =========================================================================
   Solana Arcade — Snake & Tetris + Phantom wallet integration
   pirahansiah.com/solana-games/
   Vanilla JS, no dependencies. Runs 100% in the browser.
   Wallet: connect = no transaction. "Sign score" = signMessage only
   (never sends SOL). High scores stored locally in localStorage.
   ========================================================================= */
(function () {
  'use strict';

  /* ---------- constants ---------- */
  var B58 = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  var SOL_RPC = 'https://api.mainnet-beta.solana.com';
  var SCORES_KEY = 'solana-arcade-scores-v1';
  var TIP_ADDR = 'DPfX2mNvCqQuosQLe4nDBQRf8ZdNfS5LA4tvSsGPyCH4';

  /* ---------- base58 (BigInt) ---------- */
  function toBase58(bytes) {
    if (!bytes || !bytes.length) return '';
    var zeros = 0;
    while (zeros < bytes.length && bytes[zeros] === 0) zeros++;
    var num = 0n;
    for (var i = 0; i < bytes.length; i++) num = (num << 8n) | BigInt(bytes[i]);
    var out = '';
    while (num > 0n) { out = B58[Number(num % 58n)] + out; num = num / 58n; }
    var prefix = '';
    for (var z = 0; z < zeros; z++) prefix += '1';
    return prefix + out;
  }

  /* ---------- tiny helpers ---------- */
  function $(id) { return document.getElementById(id); }
  function fmtAddress(a) {
    if (!a) return '';
    return a.slice(0, 4) + '\u2026' + a.slice(-4);
  }
  function lamportsToSol(lamportsStr) {
    try {
      var lp = BigInt(lamportsStr);
      var whole = lp / 1000000000n;
      var frac = (lp % 1000000000n).toString().padStart(9, '0').replace(/0+$/, '');
      return whole.toString() + (frac ? '.' + frac : '');
    } catch (e) { return '\u2014'; }
  }

  /* ---------- high scores (localStorage) ---------- */
  function loadScores() {
    try {
      var raw = localStorage.getItem(SCORES_KEY);
      if (!raw) return { snake: [], tetris: [] };
      var d = JSON.parse(raw);
      return { snake: d.snake || [], tetris: d.tetris || [] };
    } catch (e) { return { snake: [], tetris: [] }; }
  }
  function storeScores(s) {
    try { localStorage.setItem(SCORES_KEY, JSON.stringify(s)); } catch (e) {}
  }
  function recordScore(game, score, addr) {
    var s = loadScores();
    var list = s[game];
    list.push({ score: score, addr: addr || 'local', ts: Date.now() });
    list.sort(function (a, b) { return b.score - a.score; });
    s[game] = list.slice(0, 5);
    storeScores(s);
    renderScores();
  }
  function bestScore(game) {
    var s = loadScores();
    var list = s[game];
    return list.length ? list[0].score : 0;
  }

  function renderScores() {
    var s = loadScores();
    function rows(game, label) {
      var list = s[game];
      if (!list.length) return '<li class="sga-empty">No ' + label + ' scores yet.</li>';
      return list.map(function (e, i) {
        var who = e.addr && e.addr !== 'local' ? fmtAddress(e.addr) : 'local';
        var dt = new Date(e.ts);
        var d = (dt.getMonth() + 1) + '/' + dt.getDate();
        return '<li><span class="sga-rank">' + (i + 1) + '</span>' +
          '<span class="sga-score">' + e.score + '</span>' +
          '<span class="sga-who">' + who + '</span>' +
          '<span class="sga-date">' + d + '</span></li>';
      }).join('');
    }
    var el = $('sga-scores');
    if (!el) return;
    el.innerHTML =
      '<div class="sga-score-col"><h4>Snake</h4><ol>' + rows('snake', 'Snake') + '</ol></div>' +
      '<div class="sga-score-col"><h4>Tetris</h4><ol>' + rows('tetris', 'Tetris') + '</ol></div>';
  }

  /* ---------- wallet ---------- */
  var wallet = null; // { provider, address }

  function getProvider() {
    var candidates = [
      (window.phantom && window.phantom.solana),
      window.backpack,
      (window.solflare && window.solflare.solana),
      window.solana
    ];
    for (var i = 0; i < candidates.length; i++) {
      var p = candidates[i];
      if (p && typeof p.connect === 'function') return p;
    }
    return null;
  }

  function walletErr(msg) {
    var el = $('wallet-err');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
  }
  function walletErrClear() {
    var el = $('wallet-err');
    if (el) { el.style.display = 'none'; el.textContent = ''; }
  }

  function renderWallet() {
    var connBtn = $('wallet-connect-btn');
    var bar = $('wallet-bar');
    if (!connBtn || !bar) return;
    var addrEl = $('wallet-address');
    var balEl = $('wallet-balance');
    if (wallet && wallet.address) {
      connBtn.style.display = 'none';
      bar.classList.add('sga-connected');
      if (addrEl) addrEl.textContent = fmtAddress(wallet.address);
      refreshBalance();
    } else {
      connBtn.style.display = '';
      bar.classList.remove('sga-connected');
      if (addrEl) addrEl.textContent = '';
      if (balEl) balEl.textContent = '';
    }
  }

  async function refreshBalance() {
    var balEl = $('wallet-balance');
    if (!wallet || !wallet.address) { if (balEl) balEl.textContent = ''; return; }
    if (balEl) balEl.textContent = '\u2026 SOL';
    try {
      var res = await fetch(SOL_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getBalance', params: [wallet.address] })
      });
      var data = await res.json();
      if (data && data.result && typeof data.result.value !== 'undefined') {
        if (balEl) balEl.textContent = lamportsToSol(String(data.result.value)) + ' SOL';
      } else {
        if (balEl) balEl.textContent = '\u2014 SOL';
      }
    } catch (e) {
      if (balEl) balEl.textContent = '\u2014 SOL';
    }
  }

  async function connectWallet() {
    walletErrClear();
    var p = getProvider();
    if (!p) {
      walletErr('No Solana wallet found. Install Phantom (phantom.app) or Backpack, then reload.');
      return;
    }
    try {
      await p.connect();
    } catch (e) {
      if (e && (e.code === 4001 || /reject|denied|cancel/i.test(String(e.message || e)))) {
        walletErr('Connection request was rejected.');
      } else {
        walletErr('Could not connect: ' + (e && e.message ? e.message : e));
      }
      return;
    }
    var pk = p.publicKey;
    if (!pk) { walletErr('No account selected in the wallet.'); return; }
    wallet = { provider: p, address: pk.toString() };
    renderWallet();
  }

  async function disconnectWallet() {
    if (wallet && wallet.provider && typeof wallet.provider.disconnect === 'function') {
      try { await wallet.provider.disconnect(); } catch (e) {}
    }
    wallet = null;
    renderWallet();
  }

  /* Sign the current high score as a cryptographic proof (no transaction). */
  async function signScore() {
    walletErrClear();
    var sigBox = $('sign-signature');
    var noteEl = $('sign-note');
    if (!wallet) { walletErr('Connect your wallet first to sign your score.'); return; }

    var game = activeGame;
    var score = game === 'snake' ? snakeGame.score : tetrisGame.score;
    if (!score) { walletErr('Play a game first \u2014 there is no score to sign.'); return; }

    var message =
      'Solana Arcade high score\n' +
      'Game: ' + (game === 'snake' ? 'Snake' : 'Tetris') + '\n' +
      'Score: ' + score + '\n' +
      'Player: ' + wallet.address + '\n' +
      'Time: ' + new Date().toISOString() + '\n\n' +
      'This signature proves the above wallet owns this score. It is a message signature only \u2014 no SOL is sent.';

    var enc = new TextEncoder().encode(message);
    var sigBytes = null;
    try {
      var res = await wallet.provider.signMessage(enc, 'utf8');
      sigBytes = extractSignature(res);
    } catch (e1) {
      // Backpack / wallet-standard providers sometimes reject the extra "display" arg.
      try {
        var res2 = await wallet.provider.signMessage(enc);
        sigBytes = extractSignature(res2);
      } catch (e2) {
        walletErr('Signing failed: ' + (e2 && e2.message ? e2.message : e2));
        return;
      }
    }
    if (!sigBytes) { walletErr('Wallet returned no signature.'); return; }
    var b58 = toBase58(sigBytes);
    if (sigBox) { sigBox.textContent = b58; sigBox.classList.add('has-sig'); }
    if (noteEl) noteEl.style.display = 'block';
    renderSignProof(message);
  }

  function extractSignature(res) {
    if (!res) return null;
    if (res.signature) return res.signature instanceof Uint8Array ? res.signature : new Uint8Array(res.signature);
    if (res.signatures && res.signatures.length) {
      var s0 = res.signatures[0];
      return s0 instanceof Uint8Array ? s0 : new Uint8Array(s0);
    }
    return null;
  }

  function renderSignProof(message) {
    var m = $('sign-message');
    if (m) m.textContent = message;
  }

  /* ---------- tab switching ---------- */
  var activeGame = 'snake';
  var snakeGame, tetrisGame;

  function switchTab(game) {
    activeGame = game;
    var sTab = $('tab-snake'), tTab = $('tab-tetris');
    var sPanel = $('panel-snake'), tPanel = $('panel-tetris');
    if (sTab) sTab.classList.toggle('active', game === 'snake');
    if (tTab) tTab.classList.toggle('active', game === 'tetris');
    if (sPanel) sPanel.style.display = game === 'snake' ? '' : 'none';
    if (tPanel) tPanel.style.display = game === 'tetris' ? '' : 'none';
    // Stop the inactive game so timers don't run in the background.
    if (game === 'snake') { if (tetrisGame) tetrisGame.stop(); }
    else { if (snakeGame) snakeGame.stop(); }
    resetSignPanel();
  }

  function resetSignPanel() {
    var sigBox = $('sign-signature');
    if (sigBox) { sigBox.textContent = 'No signed score yet.'; sigBox.classList.remove('has-sig'); }
    var noteEl = $('sign-note');
    if (noteEl) noteEl.style.display = 'none';
    var m = $('sign-message');
    if (m) m.textContent = '';
    walletErrClear();
  }

  /* ---------- canvas setup (retina crisp) ---------- */
  function fitCanvas(canvas, w, h) {
    var dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  /* =========================================================================
     SNAKE
     ========================================================================= */
  snakeGame = (function () {
    var COLS = 21, ROWS = 21, CELL = 16;
    var W = COLS * CELL, H = ROWS * CELL;
    var canvas, ctx;
    var dir, nextDir, body, food, score, running, timer, speed;

    function reset() {
      canvas = $('snake-canvas');
      ctx = fitCanvas(canvas, W, H);
      dir = { x: 1, y: 0 };
      nextDir = { x: 1, y: 0 };
      var cy = Math.floor(ROWS / 2), cx = Math.floor(COLS / 2);
      body = [{ x: cx, y: cy }, { x: cx - 1, y: cy }, { x: cx - 2, y: cy }];
      score = 0;
      speed = 130;
      food = null;
      running = false;
      spawnFood();
      updateHud();
      draw();
      showOverlay(true, 'Press Start or an arrow key to play');
    }

    function spawnFood() {
      var free = [];
      var occupied = {};
      body.forEach(function (s) { occupied[s.x + ',' + s.y] = true; });
      for (var x = 0; x < COLS; x++) {
        for (var y = 0; y < ROWS; y++) {
          if (!occupied[x + ',' + y]) free.push({ x: x, y: y });
        }
      }
      if (!free.length) { food = null; return; }
      food = free[Math.floor(Math.random() * free.length)];
    }

    function start() {
      if (running) return;
      reset();
      running = true;
      showOverlay(false, '');
      timer = setInterval(tick, speed);
    }
    function stop() {
      running = false;
      if (timer) { clearInterval(timer); timer = null; }
    }

    function setDir(nx, ny) {
      if (nx === -dir.x && ny === -dir.y) return; // no reverse
      nextDir = { x: nx, y: ny };
    }

    function tick() {
      dir = nextDir;
      var head = { x: body[0].x + dir.x, y: body[0].y + dir.y };
      // wall collision
      if (head.x < 0 || head.x >= COLS || head.y < 0 || head.y >= ROWS) { return gameOver(); }
      // self collision
      for (var i = 0; i < body.length; i++) {
        if (body[i].x === head.x && body[i].y === head.y) return gameOver();
      }
      body.unshift(head);
      if (food && head.x === food.x && head.y === food.y) {
        score += 10;
        speed = Math.max(55, 130 - score);
        clearInterval(timer); timer = setInterval(tick, speed);
        spawnFood();
      } else {
        body.pop();
      }
      updateHud();
      draw();
    }

    function gameOver() {
      stop();
      var prevBest = bestScore('snake');
      var isRecord = score > 0 && score >= prevBest && score > 0;
      if (score > 0) recordScore('snake', score, wallet ? wallet.address : null);
      showOverlay(true,
        'Game over \u2014 ' + score + ' pts' +
        (isRecord && score > prevBest ? ' (new best!)' : '') +
        '. Press Start to play again.');
      enableSign('snake');
    }

    function updateHud() {
      var s = $('snake-score'), h = $('snake-high');
      if (s) s.textContent = score;
      if (h) h.textContent = Math.max(bestScore('snake'), score);
    }

    function showOverlay(show, text) {
      var ov = $('snake-overlay');
      if (!ov) return;
      if (show) {
        ov.style.display = 'flex';
        var msg = $('snake-overlay-text');
        if (msg) msg.textContent = text;
        var btn = $('snake-start-btn');
        if (btn) btn.style.display = 'inline-block';
      } else {
        ov.style.display = 'none';
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      // subtle grid
      ctx.strokeStyle = 'rgba(255,255,255,0.04)';
      ctx.lineWidth = 1;
      for (var x = 1; x < COLS; x++) {
        ctx.beginPath(); ctx.moveTo(x * CELL + 0.5, 0); ctx.lineTo(x * CELL + 0.5, H); ctx.stroke();
      }
      for (var y = 1; y < ROWS; y++) {
        ctx.beginPath(); ctx.moveTo(0, y * CELL + 0.5); ctx.lineTo(W, y * CELL + 0.5); ctx.stroke();
      }
      // food
      if (food) {
        ctx.fillStyle = '#ff375f';
        var r = CELL / 2 - 2;
        ctx.beginPath();
        ctx.arc(food.x * CELL + CELL / 2, food.y * CELL + CELL / 2, r, 0, Math.PI * 2);
        ctx.fill();
      }
      // snake
      for (var i = body.length - 1; i >= 0; i--) {
        var seg = body[i];
        var t = i / Math.max(1, body.length);
        ctx.fillStyle = i === 0 ? '#34e08a' : 'rgba(48, 209, 88, ' + (0.85 - t * 0.5) + ')';
        var pad = i === 0 ? 1 : 2;
        roundRect(seg.x * CELL + pad, seg.y * CELL + pad, CELL - pad * 2, CELL - pad * 2, 4);
        ctx.fill();
      }
    }

    function roundRect(x, y, w, h, rad) {
      ctx.beginPath();
      ctx.moveTo(x + rad, y);
      ctx.arcTo(x + w, y, x + w, y + h, rad);
      ctx.arcTo(x + w, y + h, x, y + h, rad);
      ctx.arcTo(x, y + h, x, y, rad);
      ctx.arcTo(x, y, x + w, y, rad);
      ctx.closePath();
    }

    return { reset: reset, start: start, stop: stop, setDir: setDir, get score() { return score; } };
  })();

  /* =========================================================================
     TETRIS
     ========================================================================= */
  tetrisGame = (function () {
    var COLS = 10, ROWS = 20, CELL = 26;
    var W = COLS * CELL, H = ROWS * CELL;
    var NEXT_CELL = 20, NEXT_W = 4 * NEXT_CELL, NEXT_H = 4 * NEXT_CELL;

    var SHAPES = {
      I: [[1, 1, 1, 1]],
      O: [[1, 1], [1, 1]],
      T: [[0, 1, 0], [1, 1, 1]],
      S: [[0, 1, 1], [1, 1, 0]],
      Z: [[1, 1, 0], [0, 1, 1]],
      J: [[1, 0, 0], [1, 1, 1]],
      L: [[0, 0, 1], [1, 1, 1]]
    };
    var COLORS = {
      I: '#00e5ff', O: '#ffd60a', T: '#bf5af2', S: '#30d158',
      Z: '#ff375f', J: '#0a84ff', L: '#ff9f0a'
    };
    var KEYS = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

    var canvas, ctx, nextCanvas, nextCtx;
    var board, piece, nextType, score, lines, level, running, timer, dropMs;

    function reset() {
      canvas = $('tetris-canvas');
      nextCanvas = $('tetris-next-canvas');
      ctx = fitCanvas(canvas, W, H);
      nextCtx = fitCanvas(nextCanvas, NEXT_W, NEXT_H);
      board = [];
      for (var y = 0; y < ROWS; y++) { board.push(new Array(COLS).fill(0)); }
      score = 0; lines = 0; level = 1; dropMs = 700;
      nextType = randomType();
      spawnPiece();
      running = false;
      updateHud();
      draw();
      showOverlay(true, 'Press Start or an arrow key to play');
    }

    function randomType() { return KEYS[Math.floor(Math.random() * KEYS.length)]; }

    function spawnPiece() {
      piece = {
        type: nextType,
        shape: SHAPES[nextType].map(function (r) { return r.slice(); }),
        x: Math.floor((COLS - SHAPES[nextType][0].length) / 2),
        y: 0
      };
      nextType = randomType();
      if (collides(piece.shape, piece.x, piece.y)) return gameOver();
      draw();
    }

    function collides(shape, px, py) {
      for (var r = 0; r < shape.length; r++) {
        for (var c = 0; c < shape[r].length; c++) {
          if (!shape[r][c]) continue;
          var x = px + c, y = py + r;
          if (x < 0 || x >= COLS || y >= ROWS) return true;
          if (y >= 0 && board[y][x]) return true;
        }
      }
      return false;
    }

    function start() {
      if (running) return;
      reset();
      running = true;
      showOverlay(false, '');
      timer = setInterval(tick, dropMs);
    }
    function stop() {
      running = false;
      if (timer) { clearInterval(timer); timer = null; }
    }

    function tick() { moveDown(); }
    function moveDown() { if (!running) return; move(1, 0); }

    function moveLeft() { if (!running) return; move(0, -1); }
    function moveRight() { if (!running) return; move(0, 1); }
    function softDrop() {
      if (!running) return;
      if (move(1, 0)) score += 1;
      updateHud();
    }
    function move(dy, dx) {
      if (!collides(piece.shape, piece.x + dx, piece.y + dy)) {
        piece.x += dx; piece.y += dy; draw(); return true;
      }
      if (dy === 1) { lock(); }
      return false;
    }

    function rotate() {
      if (!running) return;
      var s = piece.shape;
      var rot = s[0].map(function (_, i) { return s.map(function (r) { return r[i]; }).reverse(); });
      var kicks = [0, -1, 1, -2, 2];
      for (var i = 0; i < kicks.length; i++) {
        if (!collides(rot, piece.x + kicks[i], piece.y)) {
          piece.shape = rot; piece.x += kicks[i]; draw(); return;
        }
      }
    }

    function hardDrop() {
      if (!running) return;
      var dist = 0;
      while (!collides(piece.shape, piece.x, piece.y + 1)) { piece.y++; dist++; }
      score += dist * 2;
      lock();
    }

    function lock() {
      var s = piece.shape;
      for (var r = 0; r < s.length; r++) {
        for (var c = 0; c < s[r].length; c++) {
          if (s[r][c]) {
            var y = piece.y + r, x = piece.x + c;
            if (y < 0) return gameOver();
            board[y][x] = piece.type;
          }
        }
      }
      clearLines();
      spawnPiece();
      updateHud();
      draw();
    }

    function clearLines() {
      var cleared = 0;
      for (var y = ROWS - 1; y >= 0; y--) {
        if (board[y].every(function (v) { return v; })) {
          board.splice(y, 1);
          board.unshift(new Array(COLS).fill(0));
          cleared++; y++;
        }
      }
      if (cleared) {
        var pts = [0, 40, 100, 300, 1200][cleared];
        score += pts * level;
        lines += cleared;
        level = Math.floor(lines / 10) + 1;
        dropMs = Math.max(90, 700 - (level - 1) * 55);
        clearInterval(timer); timer = setInterval(tick, dropMs);
      }
    }

    function gameOver() {
      stop();
      if (score > 0) recordScore('tetris', score, wallet ? wallet.address : null);
      showOverlay(true, 'Game over \u2014 ' + score + ' pts. Press Start to play again.');
      enableSign('tetris');
    }

    function updateHud() {
      var sc = $('tetris-score'), ln = $('tetris-lines'), lv = $('tetris-level'), hi = $('tetris-high');
      if (sc) sc.textContent = score;
      if (ln) ln.textContent = lines;
      if (lv) lv.textContent = level;
      if (hi) hi.textContent = Math.max(bestScore('tetris'), score);
    }

    function showOverlay(show, text) {
      var ov = $('tetris-overlay');
      if (!ov) return;
      if (show) {
        ov.style.display = 'flex';
        var msg = $('tetris-overlay-text');
        if (msg) msg.textContent = text;
        var btn = $('tetris-start-btn');
        if (btn) btn.style.display = 'inline-block';
      } else {
        ov.style.display = 'none';
      }
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(255,255,255,0.05)';
      ctx.lineWidth = 1;
      for (var x = 1; x < COLS; x++) {
        ctx.beginPath(); ctx.moveTo(x * CELL + 0.5, 0); ctx.lineTo(x * CELL + 0.5, H); ctx.stroke();
      }
      for (var y = 1; y < ROWS; y++) {
        ctx.beginPath(); ctx.moveTo(0, y * CELL + 0.5); ctx.lineTo(W, y * CELL + 0.5); ctx.stroke();
      }
      for (var r = 0; r < ROWS; r++) {
        for (var c = 0; c < COLS; c++) {
          if (board[r][c]) drawCell(ctx, c, r, COLORS[board[r][c]], CELL);
        }
      }
      if (piece) {
        for (var pr = 0; pr < piece.shape.length; pr++) {
          for (var pc = 0; pc < piece.shape[pr].length; pc++) {
            if (piece.shape[pr][pc]) drawCell(ctx, piece.x + pc, piece.y + pr, COLORS[piece.type], CELL);
          }
        }
      }
      drawNext();
    }

    function drawCell(c, x, y, color, cell) {
      c.fillStyle = color;
      c.fillRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2);
      c.fillStyle = 'rgba(255,255,255,0.18)';
      c.fillRect(x * cell + 1, y * cell + 1, cell - 2, 3);
    }

    function drawNext() {
      nextCtx.clearRect(0, 0, NEXT_W, NEXT_H);
      var s = SHAPES[nextType];
      var w = s[0].length * NEXT_CELL, h = s.length * NEXT_CELL;
      var ox = (NEXT_W - w) / 2, oy = (NEXT_H - h) / 2;
      for (var r = 0; r < s.length; r++) {
        for (var c = 0; c < s[r].length; c++) {
          if (s[r][c]) drawCell(nextCtx, ox / NEXT_CELL + c, oy / NEXT_CELL + r, COLORS[nextType], NEXT_CELL);
        }
      }
    }

    return {
      reset: reset, start: start, stop: stop,
      left: moveLeft, right: moveRight, down: softDrop, rotate: rotate, drop: hardDrop,
      get score() { return score; }
    };
  })();

  /* ---------- sign button state ---------- */
  function enableSign(game) {
    var btn = $('sign-score-btn');
    if (btn) {
      btn.textContent = 'Sign your ' + (game === 'snake' ? 'Snake' : 'Tetris') + ' score';
      btn.classList.add('sga-ready');
    }
  }

  /* ---------- keyboard ---------- */
  function onKey(e) {
    var k = e.key;
    var handled = false;
    if (activeGame === 'snake') {
      if (k === 'ArrowUp' || k === 'w' || k === 'W') { snakeGame.setDir(0, -1); snakeGame.start(); handled = true; }
      else if (k === 'ArrowDown' || k === 's' || k === 'S') { snakeGame.setDir(0, 1); snakeGame.start(); handled = true; }
      else if (k === 'ArrowLeft' || k === 'a' || k === 'A') { snakeGame.setDir(-1, 0); snakeGame.start(); handled = true; }
      else if (k === 'ArrowRight' || k === 'd' || k === 'D') { snakeGame.setDir(1, 0); snakeGame.start(); handled = true; }
      else if (k === ' ' || k === 'Enter') { snakeGame.start(); handled = true; }
    } else if (activeGame === 'tetris') {
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') { tetrisGame.left(); handled = true; }
      else if (k === 'ArrowRight' || k === 'd' || k === 'D') { tetrisGame.right(); handled = true; }
      else if (k === 'ArrowDown' || k === 's' || k === 'S') { tetrisGame.down(); handled = true; }
      else if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === 'x' || k === 'X') { tetrisGame.rotate(); handled = true; }
      else if (k === ' ') { tetrisGame.drop(); handled = true; }
      else if (k === 'Enter') { tetrisGame.start(); handled = true; }
    }
    if (handled) e.preventDefault();
  }

  /* ---------- hold-to-repeat button helper (mobile) ---------- */
  function holdButton(el, fn) {
    if (!el) return;
    var holdTimer = null, startTimer = null;
    function clearTimers() {
      if (startTimer) { clearTimeout(startTimer); startTimer = null; }
      if (holdTimer) { clearInterval(holdTimer); holdTimer = null; }
    }
    function down(e) {
      e.preventDefault();
      fn();
      startTimer = setTimeout(function () {
        holdTimer = setInterval(fn, 80);
      }, 220);
    }
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', clearTimers);
    el.addEventListener('pointerleave', clearTimers);
    el.addEventListener('pointercancel', clearTimers);
    el.addEventListener('contextmenu', function (e) { e.preventDefault(); });
  }

  /* ---------- init ---------- */
  function init() {
    snakeGame.reset();
    tetrisGame.reset();
    renderScores();
    renderWallet();

    var sTab = $('tab-snake'), tTab = $('tab-tetris');
    if (sTab) sTab.addEventListener('click', function () { switchTab('snake'); });
    if (tTab) tTab.addEventListener('click', function () { switchTab('tetris'); });

    var cBtn = $('wallet-connect-btn');
    var dBtn = $('wallet-disconnect-btn');
    if (cBtn) cBtn.addEventListener('click', connectWallet);
    if (dBtn) dBtn.addEventListener('click', disconnectWallet);

    var signBtn = $('sign-score-btn');
    if (signBtn) signBtn.addEventListener('click', signScore);

    var tipBtn = $('tip-copy');
    if (tipBtn) tipBtn.addEventListener('click', function () { copyText(TIP_ADDR, tipBtn); });

    var snakeStart = $('snake-start-btn');
    if (snakeStart) snakeStart.addEventListener('click', function () { snakeGame.start(); });
    var tetrisStart = $('tetris-start-btn');
    if (tetrisStart) tetrisStart.addEventListener('click', function () { tetrisGame.start(); });

    holdButton($('snake-up'), function () { snakeGame.setDir(0, -1); snakeGame.start(); });
    holdButton($('snake-down'), function () { snakeGame.setDir(0, 1); snakeGame.start(); });
    holdButton($('snake-left'), function () { snakeGame.setDir(-1, 0); snakeGame.start(); });
    holdButton($('snake-right'), function () { snakeGame.setDir(1, 0); snakeGame.start(); });

    holdButton($('tetris-left'), function () { tetrisGame.start(); tetrisGame.left(); });
    holdButton($('tetris-right'), function () { tetrisGame.start(); tetrisGame.right(); });
    holdButton($('tetris-down'), function () { tetrisGame.start(); tetrisGame.down(); });
    holdButton($('tetris-rotate'), function () { tetrisGame.start(); tetrisGame.rotate(); });
    holdButton($('tetris-drop'), function () { tetrisGame.start(); tetrisGame.drop(); });

    document.addEventListener('keydown', onKey);

    // Listen for wallet account changes / disconnect.
    var p = getProvider();
    if (p && typeof p.on === 'function') {
      p.on('accountChanged', function (pk) {
        if (!pk || !pk.toString) { wallet = null; renderWallet(); return; }
        if (wallet) { wallet.address = pk.toString(); renderWallet(); }
      });
      p.on('disconnect', function () { wallet = null; renderWallet(); });
    }

    // Copy-signature button (created dynamically in the sign panel).
    document.addEventListener('click', function (e) {
      if (e.target && e.target.id === 'sign-copy') {
        var sigBox = $('sign-signature');
        var text = sigBox ? sigBox.textContent : '';
        if (text && text !== 'No signed score yet.') {
          copyText(text, e.target);
        }
      }
    });
  }

  function copyText(text, btn) {
    function done() {
      btn.textContent = 'Copied!';
      setTimeout(function () { btn.textContent = 'Copy'; }, 1600);
    }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { done(); }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done, fallback);
    } else fallback();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
