/* ==========================================================================
   Arcade — Snake / Flappy Bird / 2048
   Telegram Mini App + standalone browser. No external deps beyond the
   Telegram WebApp SDK (telegram-web-app.js, loaded by the page).
   ========================================================================== */
(function () {
  'use strict';

  /* ----------------------------- Telegram init --------------------------- */
  var TGraw = (window.Telegram && window.Telegram.WebApp) ? window.Telegram.WebApp : null;
  // telegram-web-app.js creates a WebApp stub (v6.0) even OUTSIDE Telegram;
  // initData is only populated in a real Mini App, so it is the reliable check.
  var TG = (TGraw && TGraw.initData) ? TGraw : null;
  var inTelegram = !!TG;

  var theme = {
    bg: '#0b0b0f',
    panel: 'rgba(255,255,255,0.07)',
    border: 'rgba(255,255,255,0.12)',
    text: '#f5f5f7',
    accent: '#0a84ff',
    accent2: '#bf5af2',
    accent3: '#ff375f',
    gold: '#f5a623',
    green: '#30d158'
  };

  function initTelegram() {
    if (!TG) { return; }
    try {
      TG.ready();
      TG.expand();
      if (TG.themeParams) {
        var tp = TG.themeParams;
        if (tp.bg_color) { theme.bg = tp.bg_color; TG.setHeaderColor(tp.bg_color); TG.setBackgroundColor(tp.bg_color); }
        if (tp.text_color) theme.text = tp.text_color;
        if (tp.button_color) theme.accent = tp.button_color;
        if (tp.link_color) theme.accent2 = tp.link_color;
        if (tp.secondary_bg_color) theme.panel = tp.secondary_bg_color;
      }
      if (typeof TG.disableVerticalSwipes === 'function') TG.disableVerticalSwipes();
    } catch (e) { /* never let Telegram init break the games */ }
    var badge = document.getElementById('game-tg-badge');
    if (badge) {
      badge.textContent = '\u2705 Playing inside Telegram';
      badge.classList.add('in-telegram');
    }
  }

  function haptic(kind, style) {
    if (!TG || !TG.HapticFeedback) { return; }
    try {
      if (kind === 'impact') TG.HapticFeedback.impactOccurred(style || 'light');
      else if (kind === 'notify') TG.HapticFeedback.notificationOccurred(style || 'success');
      else if (kind === 'select') TG.HapticFeedback.selectionChanged();
    } catch (e) { /* no-op */ }
  }

  /* --------------------------- score persistence ------------------------- */
  var BEST_KEYS = { snake: 'arcade_best_snake', flappy: 'arcade_best_flappy', '2048': 'arcade_best_2048' };
  var best = { snake: 0, flappy: 0, '2048': 0 };

  function loadBest(game, cb) {
    var key = BEST_KEYS[game];
    var local = parseInt(localStorage.getItem(key) || '0', 10) || 0;
    if (TG && TG.CloudStorage && TG.CloudStorage.getItem) {
      TG.CloudStorage.getItem(key, function (err, val) {
        var cloud = (!err && val) ? (parseInt(val, 10) || 0) : 0;
        best[game] = Math.max(local, cloud);
        cb(best[game]);
      });
    } else {
      best[game] = local;
      cb(local);
    }
  }
  function saveBest(game, val) {
    var v = String(val);
    try { localStorage.setItem(BEST_KEYS[game], v); } catch (e) {}
    if (TG && TG.CloudStorage && TG.CloudStorage.setItem) {
      try { TG.CloudStorage.setItem(BEST_KEYS[game], v, function () {}); } catch (e) {}
    }
  }

  /* ------------------------------ DOM refs ------------------------------ */
  var $ = function (id) { return document.getElementById(id); };
  var scoreB = document.querySelector('#game-score b');
  var bestB = document.querySelector('#game-best b');
  var badge = $('game-tg-badge');
  var stage = $('game-stage') || document.querySelector('.game-stage');

  var panels = { snake: $('game-snake'), flappy: $('game-flappy'), '2048': $('game-2048') };
  var overlays = { snake: $('snake-overlay'), flappy: $('flappy-overlay'), '2048': $('g2048-overlay') };
  var hints = { snake: $('game-hint-snake'), flappy: $('game-hint-flappy'), '2048': $('game-hint-2048') };
  var dpadDir = Array.prototype.slice.call(document.querySelectorAll('.dpad-btn[data-dir="up"],.dpad-btn[data-dir="down"],.dpad-btn[data-dir="left"],.dpad-btn[data-dir="right"]'));
  var flapBtn = document.querySelector('.dpad-flap');

  var GAME_LABELS = { snake: 'Snake', flappy: 'Flappy Bird', '2048': '2048' };
  var active = 'snake';
  var scores = { snake: 0, flappy: 0, '2048': 0 };

  /* ----------------------------- UI helpers ----------------------------- */
  function toast(msg) {
    var t = document.createElement('div');
    t.textContent = msg;
    t.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);background:rgba(28,28,30,0.95);color:#f5f5f7;padding:10px 18px;border-radius:12px;font-size:14px;z-index:99999;transition:opacity .3s;';
    document.body.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; }, 1800);
    setTimeout(function () { t.parentNode && t.parentNode.removeChild(t); }, 2200);
  }

  function setOverlay(game, title, sub, btnLabel, showBtn) {
    var ov = overlays[game];
    if (!ov) { return; }
    var t = ov.querySelector('.game-overlay-title');
    var s = ov.querySelector('.game-overlay-sub');
    var b = ov.querySelector('button');
    if (t) { t.textContent = title; }
    if (s) { s.textContent = sub; }
    if (b) { b.textContent = btnLabel; }
    if (showBtn === false && b) { b.style.display = 'none'; } else if (b) { b.style.display = ''; }
    ov.classList.remove('is-hidden');
  }
  function hideOverlay(game) {
    var ov = overlays[game];
    if (ov) { ov.classList.add('is-hidden'); }
  }

  function refreshScoreboard() {
    if (scoreB) { scoreB.textContent = scores[active]; }
    if (bestB) { bestB.textContent = best[active]; }
  }

  /* ------------------------------ switching ----------------------------- */
  function switchGame(game) {
    active = game;
    Object.keys(panels).forEach(function (k) { panels[k].hidden = (k !== game); });
    Object.keys(hints).forEach(function (k) { hints[k].hidden = (k !== game); });
    document.querySelectorAll('.game-tab').forEach(function (t) {
      t.classList.toggle('is-active', t.getAttribute('data-game') === game);
      t.setAttribute('aria-selected', t.getAttribute('data-game') === game ? 'true' : 'false');
    });
    updateDpad();
    refreshScoreboard();
  }

  function updateDpad() {
    var isFlappy = active === 'flappy';
    dpadDir.forEach(function (b) { b.style.display = isFlappy ? 'none' : ''; });
    if (flapBtn) { flapBtn.style.display = isFlappy ? '' : 'none'; }
  }

  /* ================================ SNAKE ================================ */
  var snake = {
    ctx: null, canvas: null, CELL: 20, GRID: 20,
    body: [], dir: { x: 1, y: 0 }, nextDir: { x: 1, y: 0 },
    food: null, running: false, over: false, stepMs: 140, acc: 0, last: 0
  };

  function snakeReset() {
    snake.body = [{ x: 10, y: 10 }, { x: 9, y: 10 }, { x: 8, y: 10 }];
    snake.dir = { x: 1, y: 0 };
    snake.nextDir = { x: 1, y: 0 };
    snake.running = false;
    snake.over = false;
    snake.stepMs = 140;
    snake.acc = 0;
    scores.snake = 0;
    snakeSpawnFood();
    refreshScoreboard();
    snakeDraw();
  }

  function snakeSpawnFood() {
    var pos;
    do {
      pos = { x: Math.floor(Math.random() * snake.GRID), y: Math.floor(Math.random() * snake.GRID) };
    } while (snake.body.some(function (s) { return s.x === pos.x && s.y === pos.y; }));
    snake.food = pos;
  }

  function snakeStep() {
    var nx = snake.body[0].x + snake.nextDir.x;
    var ny = snake.body[0].y + snake.nextDir.y;
    snake.dir = { x: snake.nextDir.x, y: snake.nextDir.y };

    if (nx < 0 || nx >= snake.GRID || ny < 0 || ny >= snake.GRID ||
        snake.body.some(function (s) { return s.x === nx && s.y === ny; })) {
      snakeGameOver();
      return;
    }
    var ate = (snake.food.x === nx && snake.food.y === ny);
    snake.body.unshift({ x: nx, y: ny });
    if (ate) {
      scores.snake += 1;
      if (snake.stepMs > 70) { snake.stepMs -= 3; }
      snakeSpawnFood();
      haptic('impact', 'light');
      refreshScoreboard();
    } else {
      snake.body.pop();
    }
    snakeDraw();
  }

  function snakeGameOver() {
    snake.over = true;
    snake.running = false;
    haptic('notify', 'error');
    if (scores.snake > best.snake) { best.snake = scores.snake; saveBest('snake', scores.snake); }
    setOverlay('snake', 'Game Over', 'You ate ' + scores.snake + ' \uD83C\uDF4E \u00b7 Best ' + best.snake, 'Play again');
    refreshScoreboard();
  }

  function snakeUpdate(dt) {
    if (!snake.running) { return; }
    snake.acc += dt;
    if (snake.acc >= snake.stepMs) {
      snake.acc = 0;
      snakeStep();
    }
  }

  function snakeDraw() {
    var c = snake.canvas, g = snake.ctx;
    if (!g) { return; }
    var W = snake.GRID * snake.CELL, H = snake.GRID * snake.CELL;
    g.clearRect(0, 0, W, H);
    g.fillStyle = theme.bg; g.fillRect(0, 0, W, H);

    // subtle grid
    g.strokeStyle = 'rgba(255,255,255,0.04)';
    g.lineWidth = 1;
    for (var i = 1; i < snake.GRID; i++) {
      g.beginPath(); g.moveTo(i * snake.CELL, 0); g.lineTo(i * snake.CELL, H); g.stroke();
      g.beginPath(); g.moveTo(0, i * snake.CELL); g.lineTo(W, i * snake.CELL); g.stroke();
    }

    // food
    g.fillStyle = theme.accent3;
    g.beginPath();
    g.arc(snake.food.x * snake.CELL + snake.CELL / 2, snake.food.y * snake.CELL + snake.CELL / 2, snake.CELL / 2 - 3, 0, Math.PI * 2);
    g.fill();

    // snake
    snake.body.forEach(function (seg, idx) {
      var r = snake.CELL / 2 - 2;
      var cx = seg.x * snake.CELL + snake.CELL / 2;
      var cy = seg.y * snake.CELL + snake.CELL / 2;
      var grad = g.createLinearGradient(cx - r, cy - r, cx + r, cy + r);
      grad.addColorStop(0, idx === 0 ? theme.green : theme.accent);
      grad.addColorStop(1, idx === 0 ? theme.accent : theme.accent2);
      g.fillStyle = grad;
      g.beginPath();
      g.arc(cx, cy, r, 0, Math.PI * 2);
      g.fill();
    });
    // eyes on head
    var h = snake.body[0];
    g.fillStyle = '#0b0b0f';
    var hx = h.x * snake.CELL + snake.CELL / 2, hy = h.y * snake.CELL + snake.CELL / 2;
    g.beginPath(); g.arc(hx - 4, hy - 3, 2, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(hx + 4, hy - 3, 2, 0, Math.PI * 2); g.fill();
  }

  /* ================================ FLAPPY =============================== */
  var flappy = {
    ctx: null, canvas: null, W: 400, H: 540,
    running: false, over: false,
    birdY: 0, vel: 0, GRAVITY: 0.0018, FLAP: -0.46,
    pipes: [], pipeTimer: 0, PIPE_INTERVAL: 1500, PIPE_SPEED: 0.18,
    PIPE_W: 64, GAP: 150, BIRD_X: 90, R: 15
  };

  function flappyReset() {
    flappy.running = false;
    flappy.over = false;
    flappy.birdY = flappy.H / 2;
    flappy.vel = 0;
    flappy.pipes = [];
    flappy.pipeTimer = 0;
    scores.flappy = 0;
    refreshScoreboard();
    flappyDraw();
  }

  function flappyFlap() {
    if (!flappy.running) { return; }
    flappy.vel = flappy.FLAP;
    haptic('impact', 'light');
  }

  function flappyUpdate(dt) {
    if (!flappy.running) { return; }
    flappy.vel += flappy.GRAVITY * dt;
    flappy.birdY += flappy.vel * dt;

    // pipes
    flappy.pipeTimer += dt;
    if (flappy.pipeTimer >= flappy.PIPE_INTERVAL) {
      flappy.pipeTimer = 0;
      var gapY = 80 + Math.random() * (flappy.H - 160 - flappy.GAP);
      flappy.pipes.push({ x: flappy.W, gapY: gapY, passed: false });
    }
    flappy.pipes.forEach(function (p) { p.x -= flappy.PIPE_SPEED * dt; });
    flappy.pipes = flappy.pipes.filter(function (p) { return p.x + flappy.PIPE_W > 0; });

    // scoring + collision
    for (var i = 0; i < flappy.pipes.length; i++) {
      var p = flappy.pipes[i];
      if (!p.passed && p.x + flappy.PIPE_W < flappy.BIRD_X) {
        p.passed = true;
        scores.flappy += 1;
        haptic('impact', 'medium');
        refreshScoreboard();
      }
      // collision with pipe
      if (flappy.BIRD_X + flappy.R > p.x && flappy.BIRD_X - flappy.R < p.x + flappy.PIPE_W) {
        if (flappy.birdY - flappy.R < p.gapY || flappy.birdY + flappy.R > p.gapY + flappy.GAP) {
          flappyGameOver(); return;
        }
      }
    }
    // ceiling / floor
    if (flappy.birdY - flappy.R < 0 || flappy.birdY + flappy.R > flappy.H) {
      flappyGameOver(); return;
    }
    flappyDraw();
  }

  function flappyGameOver() {
    flappy.over = true;
    flappy.running = false;
    haptic('notify', 'error');
    if (scores.flappy > best.flappy) { best.flappy = scores.flappy; saveBest('flappy', scores.flappy); }
    setOverlay('flappy', 'Game Over', 'Score ' + scores.flappy + ' \u00b7 Best ' + best.flappy, 'Play again');
    refreshScoreboard();
  }

  function flappyDraw() {
    var g = flappy.ctx;
    if (!g) { return; }
    g.clearRect(0, 0, flappy.W, flappy.H);
    g.fillStyle = theme.bg; g.fillRect(0, 0, flappy.W, flappy.H);

    // pipes
    flappy.pipes.forEach(function (p) {
      var grad = g.createLinearGradient(p.x, 0, p.x + flappy.PIPE_W, 0);
      grad.addColorStop(0, theme.green); grad.addColorStop(1, '#1f9e3d');
      g.fillStyle = grad;
      g.fillRect(p.x, 0, flappy.PIPE_W, p.gapY);
      g.fillRect(p.x, p.gapY + flappy.GAP, flappy.PIPE_W, flappy.H - (p.gapY + flappy.GAP));
      // rims
      g.fillStyle = '#1f9e3d';
      g.fillRect(p.x - 4, p.gapY - 18, flappy.PIPE_W + 8, 18);
      g.fillRect(p.x - 4, p.gapY + flappy.GAP, flappy.PIPE_W + 8, 18);
    });

    // ground
    g.fillStyle = 'rgba(255,255,255,0.08)';
    g.fillRect(0, flappy.H - 6, flappy.W, 6);

    // bird
    var bx = flappy.BIRD_X, by = flappy.birdY;
    var grad = g.createRadialGradient(bx - 5, by - 5, 2, bx, by, flappy.R + 4);
    grad.addColorStop(0, theme.gold); grad.addColorStop(1, '#e08a00');
    g.fillStyle = grad;
    g.beginPath(); g.arc(bx, by, flappy.R, 0, Math.PI * 2); g.fill();
    // wing
    g.fillStyle = '#c97700';
    g.beginPath(); g.ellipse(bx - 7, by + 3, 7, 4, -0.4, 0, Math.PI * 2); g.fill();
    // eye
    g.fillStyle = '#fff';
    g.beginPath(); g.arc(bx + 5, by - 5, 5, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#0b0b0f';
    g.beginPath(); g.arc(bx + 7, by - 5, 2.4, 0, Math.PI * 2); g.fill();
    // beak
    g.fillStyle = theme.accent3;
    g.beginPath(); g.moveTo(bx + flappy.R - 2, by - 1); g.lineTo(bx + flappy.R + 9, by + 2); g.lineTo(bx + flappy.R - 2, by + 5); g.closePath(); g.fill();
  }

  /* ================================ 2048 ================================= */
  var g2048 = { board: [], cells: [], over: false, won: false, SIZE: 4 };

  function g2048Reset() {
    g2048.board = [];
    g2048.over = false;
    g2048.won = false;
    scores['2048'] = 0;
    for (var r = 0; r < g2048.SIZE; r++) {
      g2048.board.push([0, 0, 0, 0]);
    }
    g2048AddRandom(); g2048AddRandom();
    refreshScoreboard();
    g2048Render();
  }

  function g2048AddRandom() {
    var empty = [];
    for (var r = 0; r < g2048.SIZE; r++) for (var c = 0; c < g2048.SIZE; c++) {
      if (g2048.board[r][c] === 0) { empty.push({ r: r, c: c }); }
    }
    if (!empty.length) { return; }
    var cell = empty[Math.floor(Math.random() * empty.length)];
    g2048.board[cell.r][cell.c] = Math.random() < 0.9 ? 2 : 4;
  }

  function mergeLine(line) {
    var filtered = line.filter(function (v) { return v !== 0; });
    var out = [];
    for (var i = 0; i < filtered.length; i++) {
      if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
        var merged = filtered[i] * 2;
        out.push(merged);
        scores['2048'] += merged;
        haptic('impact', 'medium');
        if (merged === 2048) { g2048.won = true; }
        i++;
      } else {
        out.push(filtered[i]);
      }
    }
    while (out.length < g2048.SIZE) { out.push(0); }
    return out;
  }

  function g2048Move(dx, dy) {
    if (g2048.over) { return; }
    var before = JSON.stringify(g2048.board);
    var i, r, c, line;

    if (dx === 1) { // right
      for (r = 0; r < g2048.SIZE; r++) {
        line = mergeLine(g2048.board[r].slice().reverse());
        g2048.board[r] = line.reverse();
      }
    } else if (dx === -1) { // left
      for (r = 0; r < g2048.SIZE; r++) { g2048.board[r] = mergeLine(g2048.board[r]); }
    } else if (dy === -1) { // up
      for (c = 0; c < g2048.SIZE; c++) {
        line = mergeLine([g2048.board[0][c], g2048.board[1][c], g2048.board[2][c], g2048.board[3][c]]);
        for (r = 0; r < g2048.SIZE; r++) { g2048.board[r][c] = line[r]; }
      }
    } else if (dy === 1) { // down
      for (c = 0; c < g2048.SIZE; c++) {
        line = mergeLine([g2048.board[3][c], g2048.board[2][c], g2048.board[1][c], g2048.board[0][c]]);
        for (r = 0; r < g2048.SIZE; r++) { g2048.board[3 - r][c] = line[r]; }
      }
    }

    if (JSON.stringify(g2048.board) !== before) {
      g2048AddRandom();
      g2048Render();
      refreshScoreboard();
      if (g2048.won && !g2048.over) {
        if (scores['2048'] > best['2048']) { best['2048'] = scores['2048']; saveBest('2048', scores['2048']); }
        setOverlay('2048', 'You win! \uD83C\uDFC6', 'Score ' + scores['2048'] + ' \u00b7 keep going or restart', 'Keep going');
        hideOverlayLater('2048');
        g2048.won = false;
      } else if (g2048IsOver()) {
        g2048.over = true;
        haptic('notify', 'error');
        if (scores['2048'] > best['2048']) { best['2048'] = scores['2048']; saveBest('2048', scores['2048']); }
        setOverlay('2048', 'Game Over', 'Score ' + scores['2048'] + ' \u00b7 Best ' + best['2048'], 'Play again');
        refreshScoreboard();
      }
    }
  }

  function hideOverlayLater(game) {
    setTimeout(function () { if (active === game) { hideOverlay(game); } }, 1200);
  }

  function g2048IsOver() {
    for (var r = 0; r < g2048.SIZE; r++) for (var c = 0; c < g2048.SIZE; c++) {
      if (g2048.board[r][c] === 0) { return false; }
      if (c + 1 < g2048.SIZE && g2048.board[r][c] === g2048.board[r][c + 1]) { return false; }
      if (r + 1 < g2048.SIZE && g2048.board[r][c] === g2048.board[r + 1][c]) { return false; }
    }
    return true;
  }

  function g2048Render() {
    for (var r = 0; r < g2048.SIZE; r++) for (var c = 0; c < g2048.SIZE; c++) {
      var v = g2048.board[r][c];
      var el = g2048.cells[r * g2048.SIZE + c];
      el.textContent = v === 0 ? '' : v;
      el.className = 'cell' + (v === 0 ? '' : (v <= 2048 ? ' t' + v : ' tsuper'));
    }
  }

  /* ------------------------------ game start ----------------------------- */
  function startGame(game) {
    hideOverlay(game);
    if (game === 'snake') {
      snakeReset();
      snake.running = true;
    } else if (game === 'flappy') {
      flappyReset();
      flappy.running = true;
    } else {
      g2048Reset();
    }
    haptic('select');
    refreshScoreboard();
  }

  /* ------------------------------- input -------------------------------- */
  function handleDir(dx, dy) {
    if (active === 'snake') {
      if (!snake.running || snake.over) { return; }
      if (dx === -snake.dir.x && dy === -snake.dir.y) { return; } // no 180
      snake.nextDir = { x: dx, y: dy };
    } else if (active === '2048') {
      g2048Move(dx, dy);
    }
  }
  function handleFlap() {
    if (active === 'flappy') {
      if (!flappy.running) { startGame('flappy'); return; }
      flappyFlap();
    }
  }

  document.addEventListener('keydown', function (e) {
    var k = e.key;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].indexOf(k) !== -1) { e.preventDefault(); }
    if (k === 'ArrowUp' || k === 'w' || k === 'W') { active === 'flappy' ? handleFlap() : handleDir(0, -1); }
    else if (k === 'ArrowDown' || k === 's' || k === 'S') { handleDir(0, 1); }
    else if (k === 'ArrowLeft' || k === 'a' || k === 'A') { handleDir(-1, 0); }
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') { handleDir(1, 0); }
    else if (k === ' ') { handleFlap(); }
  });

  // swipe + tap on the stage
  var touchStart = null, touchStartT = 0;
  stage.addEventListener('touchstart', function (e) {
    var t = e.touches[0];
    touchStart = { x: t.clientX, y: t.clientY };
    touchStartT = Date.now();
  }, { passive: true });
  stage.addEventListener('touchend', function (e) {
    if (!touchStart) { return; }
    var t = e.changedTouches[0];
    var dx = t.clientX - touchStart.x;
    var dy = t.clientY - touchStart.y;
    var adx = Math.abs(dx), ady = Math.abs(dy);
    var dur = Date.now() - touchStartT;
    if (adx < 12 && ady < 12 && dur < 300) {
      // tap — only flappy acts on a tap
      if (active === 'flappy') { handleFlap(); }
    } else if (adx > ady) {
      handleDir(dx > 0 ? 1 : -1, 0);
    } else {
      handleDir(0, dy > 0 ? 1 : -1);
    }
    touchStart = null;
  }, { passive: true });

  // dpad
  document.querySelectorAll('.dpad-btn').forEach(function (b) {
    b.addEventListener('click', function () {
      var dir = b.getAttribute('data-dir');
      if (dir === 'up') { handleDir(0, -1); }
      else if (dir === 'down') { handleDir(0, 1); }
      else if (dir === 'left') { handleDir(-1, 0); }
      else if (dir === 'right') { handleDir(1, 0); }
      else if (dir === 'flap') { handleFlap(); }
    });
  });

  // tap the canvas to flap (flappy) — also covers mouse click
  document.querySelectorAll('.game-panel').forEach(function (p) {
    p.addEventListener('mousedown', function () {
      if (active === 'flappy') { handleFlap(); }
    });
  });

  /* ------------------------------ tabs / buttons ------------------------- */
  document.querySelectorAll('.game-tab').forEach(function (t) {
    t.addEventListener('click', function () { switchGame(t.getAttribute('data-game')); });
  });
  document.querySelectorAll('[data-start]').forEach(function (b) {
    b.addEventListener('click', function () { startGame(b.getAttribute('data-start')); });
  });
  document.getElementById('game-restart').addEventListener('click', function () { startGame(active); });

  document.getElementById('game-share').addEventListener('click', function () {
    var label = GAME_LABELS[active];
    var text = 'I scored ' + scores[active] + ' in ' + label + ' \u2014 can you beat me?';
    var url = location.href;
    if (TG && TG.openTelegramLink) {
      TG.openTelegramLink('https://t.me/share/url?url=' + encodeURIComponent(url) + '&text=' + encodeURIComponent(text));
    } else if (navigator.share) {
      navigator.share({ title: 'Arcade', text: text, url: url }).catch(function () {});
    } else if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text + ' ' + url).then(function () { toast('Copied to clipboard'); });
    } else {
      toast(text + ' ' + url);
    }
  });

  /* ------------------------------ main loop ------------------------------ */
  function loop(ts) {
    var dt = snake.last ? Math.min(ts - snake.last, 50) : 16;
    snake.last = ts;
    if (active === 'snake') { snakeUpdate(dt); }
    else if (active === 'flappy') { flappyUpdate(dt); }
    requestAnimationFrame(loop);
  }

  /* ------------------------------ bootstrap ------------------------------ */
  function init() {
    if (!TG) {
      badge.textContent = '\uD83C\uDF10 Browser mode';
    }
    // setup canvases
    snake.canvas = $('snake-canvas');
    snake.ctx = setupCanvas(snake.canvas, snake.GRID * snake.CELL, snake.GRID * snake.CELL);
    flappy.canvas = $('flappy-canvas');
    flappy.ctx = setupCanvas(flappy.canvas, flappy.W, flappy.H);

    // build 2048 cells
    var grid = $('grid2048');
    for (var i = 0; i < g2048.SIZE * g2048.SIZE; i++) {
      var cell = document.createElement('div');
      cell.className = 'cell';
      grid.appendChild(cell);
      g2048.cells.push(cell);
    }

    // load best scores
    ['snake', 'flappy', '2048'].forEach(function (g) {
      loadBest(g, function () { refreshScoreboard(); });
    });

    snakeReset();
    flappyReset();
    g2048Reset();
    switchGame('snake');
    updateDpad();
    refreshScoreboard();
    requestAnimationFrame(loop);
  }

  function setupCanvas(canvas, w, h) {
    var dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    var ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  initTelegram();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
