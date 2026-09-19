---
layout: farshid_default
title: Games
permalink: /game/
extra_css: game.css
description: Play Snake, Flappy Bird and 2048 — classic arcade games in your browser or as a Telegram Mini App. High scores, haptics and a share button.
---
> **Games** — Play classic arcade games — Snake, Flappy Bird & 2048 — right in your browser or as a Telegram Mini App — https://pirahansiah.com/game/
Play Snake, Flappy Bird and 2048 — classic arcade games in your browser or as a Telegram Mini App. High scores, haptics and a share button.

*Last updated: 2026-08-16.*  <!--ENHANCED-->


<div class="game-page">
  <div class="game-header">
    <h1>&#127918; Arcade</h1>
    <p class="game-sub">Snake &middot; Flappy Bird &middot; 2048 &mdash; play right here, or open it inside Telegram as a Mini App.</p>
    <div class="game-tg-badge" id="game-tg-badge">&#128336; Checking&hellip;</div>
  </div>

  <div class="game-tabs" role="tablist" aria-label="Choose a game">
    <button type="button" class="game-tab is-active" data-game="snake" role="tab" aria-selected="true">&#128013; Snake</button>
    <button type="button" class="game-tab" data-game="flappy" role="tab" aria-selected="false">&#128038; Flappy</button>
    <button type="button" class="game-tab" data-game="2048" role="tab" aria-selected="false">&#128290; 2048</button>
  </div>

  <div class="game-scorebar">
    <span class="game-score" id="game-score">Score&nbsp;<b>0</b></span>
    <span class="game-best" id="game-best">Best&nbsp;<b>0</b></span>
    <button type="button" class="game-btn" id="game-restart" title="Restart the current game">&#8635; Restart</button>
    <button type="button" class="game-btn" id="game-share" title="Share your score">&#128279; Share</button>
  </div>

  <div class="game-stage" id="game-stage">
    <!-- SNAKE -->
    <div class="game-panel" id="game-snake">
      <canvas id="snake-canvas" aria-label="Snake game board"></canvas>
      <div class="game-overlay" id="snake-overlay">
        <div class="game-overlay-title">Snake</div>
        <div class="game-overlay-sub">Steer with arrows, WASD, swipe or the pad below. Eat &#127822; to grow.</div>
        <button type="button" class="game-btn game-btn-primary" data-start="snake">Start</button>
      </div>
    </div>

    <!-- FLAPPY -->
    <div class="game-panel" id="game-flappy" hidden>
      <canvas id="flappy-canvas" aria-label="Flappy Bird game board"></canvas>
      <div class="game-overlay" id="flappy-overlay">
        <div class="game-overlay-title">Flappy Bird</div>
        <div class="game-overlay-sub">Tap, click or press Space / &#8593; to flap. Fly through the gaps.</div>
        <button type="button" class="game-btn game-btn-primary" data-start="flappy">Start</button>
      </div>
    </div>

    <!-- 2048 -->
    <div class="game-panel" id="game-2048" hidden>
      <div class="board2048-wrap">
        <div class="grid2048" id="grid2048"></div>
        <div class="game-overlay" id="g2048-overlay">
          <div class="game-overlay-title">2048</div>
          <div class="game-overlay-sub">Swipe or use arrows to merge tiles. Reach the 2048 tile.</div>
          <button type="button" class="game-btn game-btn-primary" data-start="2048">Start</button>
        </div>
      </div>
    </div>
  </div>

  <div class="game-controls">
    <div class="game-dpad" id="game-dpad" aria-label="Directional pad">
      <button type="button" class="dpad-btn" data-dir="up" aria-label="Up">&#8593;</button>
      <div class="dpad-row">
        <button type="button" class="dpad-btn" data-dir="left" aria-label="Left">&#8592;</button>
        <button type="button" class="dpad-btn dpad-flap" data-dir="flap" aria-label="Flap / action">&#9679;</button>
        <button type="button" class="dpad-btn" data-dir="right" aria-label="Right">&#8594;</button>
      </div>
      <button type="button" class="dpad-btn" data-dir="down" aria-label="Down">&#8595;</button>
    </div>
    <div class="game-hint">
      <span id="game-hint-snake">Arrows / WASD / swipe to steer.</span>
      <span id="game-hint-flappy" hidden>Tap or Space to flap.</span>
      <span id="game-hint-2048" hidden>Swipe or arrows to slide &amp; merge.</span>
    </div>
  </div>
</div>

<script src="https://telegram.org/js/telegram-web-app.js"></script>
<script src="/farshid/content/game.js?v=2"></script>
