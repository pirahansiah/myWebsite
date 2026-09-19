---
layout: farshid_default
title: "Solana Arcade — Snake & Tetris"
permalink: /solana-games/
description: "Play Snake and Tetris in your browser, connect a Phantom wallet, and sign your high score as a cryptographic proof on Solana. No install, no account, runs locally."
tags: [solana, games, snake, tetris, phantom, web3, arcade]
hashtags: "#solana #games #snake #tetris #phantom #web3 #crypto"
---

> **Solana Arcade** — Play Snake & Tetris, connect Phantom, and sign your high score as a cryptographic proof. — https://pirahansiah.com/solana-games/
Play Snake and Tetris in your browser, connect a Phantom wallet, and sign your high score as a cryptographic proof on Solana. No install, no account, runs locally.

*Last updated: 2026-08-16.*  <!--ENHANCED-->


<style>
.sga-wrap { max-width: 860px; margin: 0 auto; padding: 0 16px 40px; }

.sga-hero { text-align: center; padding: 32px 16px 8px; }
.sga-hero h1 {
  font-size: 2.4rem; font-weight: 800; line-height: 1.15; margin: 0 0 10px;
  background: linear-gradient(135deg, #14F195 0%, #9945FF 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
}
.sga-hero p { color: var(--text-muted); font-size: 1.05rem; max-width: 620px; margin: 0 auto; line-height: 1.6; }

/* wallet bar */
.sga-wallet { max-width: 560px; margin: 18px auto 0; text-align: center; }
.sga-btn {
  display: inline-block; padding: 12px 24px; border: none; border-radius: 12px; cursor: pointer;
  font-size: 1rem; font-weight: 600; color: #0b0b0f; line-height: 1.2;
  background: linear-gradient(135deg, #14F195, #9945FF);
  box-shadow: 0 4px 18px rgba(153, 69, 255, 0.35);
  transition: transform 0.15s ease, box-shadow 0.15s ease, opacity 0.15s ease;
}
.sga-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 22px rgba(153, 69, 255, 0.45); }
.sga-btn.ghost { background: var(--glass-bg-strong); color: var(--text); box-shadow: none; border: 1px solid var(--glass-border); }
.sga-btn.small { padding: 8px 16px; font-size: 0.85rem; }
.sga-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
#wallet-bar { display: none; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap;
  padding: 12px 16px; border-radius: 14px; background: var(--glass-bg); border: 1px solid var(--glass-border); font-size: 0.9rem; }
#wallet-bar.sga-connected { display: flex; }
#wallet-address { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; color: #14F195; }
#wallet-balance { color: var(--text-muted); }
.sga-err {
  margin: 12px auto 0; padding: 12px; border-radius: 10px; max-width: 520px;
  background: rgba(255,55,95,0.15); border: 1px solid rgba(255,55,95,0.4);
  color: #ff8a9b; font-size: 0.88rem; line-height: 1.5; display: none; text-align: left;
}

/* disclaimer boxes (shared with crypto page) */
.sga-warnings { max-width: 720px; margin: 22px auto 0; display: grid; gap: 12px; }
.sga-warn {
  display: flex; gap: 12px; align-items: flex-start;
  border-radius: 14px; padding: 13px 16px; font-size: 0.9rem; line-height: 1.6;
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); text-align: left;
}
.sga-warn .ic { font-size: 1.15rem; line-height: 1.4; flex-shrink: 0; }
.sga-warn b { display: block; margin-bottom: 2px; }
.sga-warn.note { background: rgba(20,241,149,0.08); border: 1px solid rgba(20,241,149,0.32); color: #b7e8c7; }
.sga-warn.note b { color: #14F195; }
.sga-warn.caution { background: rgba(255,149,0,0.10); border: 1px solid rgba(255,159,10,0.38); color: #ffd9a0; }
.sga-warn.caution b { color: #ffb340; }
.sga-warn code { font-family: ui-monospace, monospace; color: #14F195; }

/* tabs */
.sga-tabs { display: flex; gap: 8px; justify-content: center; margin: 26px 0 4px; }
.sga-tab {
  padding: 10px 20px; border-radius: 12px; cursor: pointer; font-size: 0.95rem; font-weight: 700;
  color: var(--text-muted); background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.14);
  transition: all 0.18s ease;
}
.sga-tab:hover { border-color: rgba(20,241,149,0.5); color: var(--text); }
.sga-tab.active { color: #0b0b0f; border-color: transparent; background: linear-gradient(135deg, #14F195, #9945FF); box-shadow: 0 4px 16px rgba(20,241,149,0.3); }
.sga-phone-note { max-width: 560px; margin: 12px auto 0; font-size: 0.9rem; color: var(--text-muted); line-height: 1.5; }
.sga-tip-addr { display: block; max-width: 540px; margin: 12px auto; padding: 12px 14px; border-radius: 10px; background: rgba(20,241,149,0.08); border: 1px solid rgba(20,241,149,0.28); font-family: ui-monospace, SF Mono, Menlo, monospace; font-size: 0.9rem; word-break: break-all; user-select: all; }
.sga-tip-hint { font-size: 0.85rem; color: var(--text-muted); }

.sga-panel { margin-top: 14px; }
.sga-hud {
  display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-bottom: 12px;
  font-size: 0.88rem; color: var(--text-muted);
}
.sga-hud div { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 6px 14px; }
.sga-hud span { color: #14F195; font-weight: 700; margin-left: 4px; }

.sga-stage { position: relative; width: 100%; max-width: 336px; margin: 0 auto; }
#panel-tetris .sga-stage { max-width: 260px; }
.sga-stage canvas { display: block; width: 100%; height: auto; border-radius: 12px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); }
.sga-overlay {
  position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
  background: rgba(6,6,10,0.72); border-radius: 12px; backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px);
}
.sga-overlay-inner { text-align: center; padding: 16px; }
.sga-overlay-inner p { color: var(--text); font-size: 1rem; margin: 0 0 12px; }

/* d-pad / controls */
.sga-dpad { display: flex; flex-direction: column; align-items: center; gap: 6px; margin-top: 14px; }
.sga-dpad-row { display: flex; gap: 6px; }
.sga-controls { display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin-top: 14px; }
.sga-pad {
  min-width: 48px; height: 48px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.14);
  background: rgba(255,255,255,0.06); color: var(--text); font-size: 1.05rem; font-weight: 700; cursor: pointer;
  touch-action: none; -webkit-tap-highlight-color: transparent; user-select: none;
  transition: background 0.12s ease, transform 0.12s ease;
}
.sga-pad:active { background: rgba(20,241,149,0.2); transform: scale(0.95); }
.sga-pad.wide { min-width: 88px; }

.sga-tetris-layout { display: flex; gap: 16px; justify-content: center; align-items: flex-start; flex-wrap: wrap; }
.sga-next-box { text-align: center; padding: 10px; border-radius: 12px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.08); }
.sga-next-label { font-size: 0.78rem; color: var(--text-muted); margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.5px; }
#tetris-next-canvas { width: 80px; height: 80px; border-radius: 6px; background: rgba(0,0,0,0.25); }

/* sign panel */
.sga-sign { max-width: 640px; margin: 26px auto 0; padding: 20px; border-radius: 16px;
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.12); text-align: center; }
.sga-sign h3 { margin: 0 0 6px; font-size: 1.1rem; }
.sga-sign p { color: var(--text-muted); font-size: 0.9rem; line-height: 1.6; margin: 0 0 14px; }
.sga-signature {
  margin: 12px auto 8px; padding: 12px; border-radius: 10px; max-width: 520px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.76rem; line-height: 1.5;
  word-break: break-all; color: #c9d4e3; text-align: left;
  background: rgba(0,0,0,0.28); border: 1px solid rgba(255,255,255,0.1);
}
.sga-signature.has-sig { color: #14F195; border-color: rgba(20,241,149,0.35); }
.sga-sign-note { margin: 10px auto 0; font-size: 0.82rem; color: #ffb340; line-height: 1.5; max-width: 520px; }
.sga-sign-msg {
  display: none; margin: 14px auto 0; max-width: 520px; text-align: left; white-space: pre-wrap;
  font-family: ui-monospace, Menlo, monospace; font-size: 0.72rem; line-height: 1.5; color: var(--text-muted);
  background: rgba(0,0,0,0.25); border: 1px solid rgba(255,255,255,0.08); border-radius: 10px; padding: 12px; overflow-x: auto;
}
.sga-sign-msg:not(:empty) { display: block; }

/* high scores */
.sga-scores { max-width: 640px; margin: 26px auto 0; display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.sga-score-col { padding: 16px; border-radius: 14px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); }
.sga-score-col h4 { margin: 0 0 8px; font-size: 0.95rem; color: var(--text); }
.sga-score-col ol { margin: 0; padding: 0; list-style: none; }
.sga-score-col li {
  display: flex; align-items: center; gap: 10px; padding: 5px 0; font-size: 0.85rem;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.sga-score-col li:last-child { border-bottom: none; }
.sga-rank { color: var(--text-muted); width: 16px; }
.sga-score { color: #14F195; font-weight: 700; }
.sga-who { color: var(--text-muted); font-family: ui-monospace, Menlo, monospace; flex: 1; overflow: hidden; text-overflow: ellipsis; }
.sga-date { color: var(--text-muted); font-size: 0.75rem; }
.sga-empty { color: var(--text-muted); font-size: 0.82rem; }

/* support */
.sga-support { max-width: 640px; margin: 26px auto 0; text-align: center; }
.sga-support p { color: var(--text-muted); font-size: 0.92rem; line-height: 1.6; margin: 0 0 12px; }
.sga-support-actions { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
.sga-support a { text-decoration: none; }

@media (max-width: 640px) {
  .sga-hero h1 { font-size: 1.9rem; }
  .sga-scores { grid-template-columns: 1fr; }
  .sga-pad { min-width: 52px; height: 52px; } /* 44px+ touch targets */
  .sga-tab { padding: 14px 26px; font-size: 1rem; }
}
</style>

<div class="sga-wrap">
  <div class="sga-hero">
    <h1>Solana Arcade</h1>
    <p>Play Snake and Tetris right in your browser, connect a Phantom wallet, and sign your high score as a cryptographic proof on Solana. No install, no account &mdash; everything runs locally.</p>
  </div>

  <div class="sga-wallet">
    <button id="wallet-connect-btn" class="sga-btn" type="button">Connect Phantom wallet</button>
    <div id="wallet-bar">
      <span id="wallet-address"></span>
      <span id="wallet-balance"></span>
      <button id="wallet-disconnect-btn" class="sga-btn ghost small" type="button">Disconnect</button>
    </div>
    <div class="sga-err" id="wallet-err"></div>
    <p class="sga-phone-note">📱 <b>On mobile or inside Telegram?</b> Solana wallets can't connect inside Telegram's browser &mdash; the games still work everywhere, and you can send a tip to the SOL address below.</p>
  </div>

  <div class="sga-tabs">
    <button id="tab-snake" class="sga-tab active" type="button">&#128013; Snake</button>
    <button id="tab-tetris" class="sga-tab" type="button">&#129521; Tetris</button>
  </div>

  <div class="sga-warnings">
    <div class="sga-warn note">
      <span class="ic">&#8505;&#65039;</span>
      <div><b>Runs entirely in your browser</b>
      No install, no account, no server. High scores are saved locally on your device (localStorage) and can only be seen by you.</div>
    </div>
    <div class="sga-warn note">
      <span class="ic">&#128737;&#65039;</span>
      <div><b>Connecting never sends a transaction</b>
      The &ldquo;Sign score&rdquo; button uses <code>signMessage</code> only &mdash; a free message signature. It can never move, send, or spend any SOL.</div>
    </div>
    <div class="sga-warn caution">
      <span class="ic">&#9888;&#65039;</span>
      <div><b>No on-chain leaderboard yet</b>
      Scores are local, not stored on-chain. Signing produces a proof you can verify against your public key, but scores are not written to the Solana network.</div>
    </div>
  </div>

  <div id="panel-snake" class="sga-panel">
    <div class="sga-hud">
      <div>Score<span id="snake-score">0</span></div>
      <div>Best<span id="snake-high">0</span></div>
    </div>
    <div class="sga-stage">
      <canvas id="snake-canvas" width="336" height="336" aria-label="Snake game board"></canvas>
      <div id="snake-overlay" class="sga-overlay">
        <div class="sga-overlay-inner">
          <p id="snake-overlay-text">Press Start or an arrow key to play</p>
          <button id="snake-start-btn" class="sga-btn" type="button">Start</button>
        </div>
      </div>
    </div>
    <div class="sga-dpad">
      <button id="snake-up" class="sga-pad" type="button">&#8593;</button>
      <div class="sga-dpad-row">
        <button id="snake-left" class="sga-pad" type="button">&#8592;</button>
        <button id="snake-down" class="sga-pad" type="button">&#8595;</button>
        <button id="snake-right" class="sga-pad" type="button">&#8594;</button>
      </div>
    </div>
  </div>

  <div id="panel-tetris" class="sga-panel" style="display:none">
    <div class="sga-hud">
      <div>Score<span id="tetris-score">0</span></div>
      <div>Lines<span id="tetris-lines">0</span></div>
      <div>Level<span id="tetris-level">1</span></div>
      <div>Best<span id="tetris-high">0</span></div>
    </div>
    <div class="sga-tetris-layout">
      <div class="sga-stage">
        <canvas id="tetris-canvas" width="260" height="520" aria-label="Tetris game board"></canvas>
        <div id="tetris-overlay" class="sga-overlay">
          <div class="sga-overlay-inner">
            <p id="tetris-overlay-text">Press Start or an arrow key to play</p>
            <button id="tetris-start-btn" class="sga-btn" type="button">Start</button>
          </div>
        </div>
      </div>
      <div class="sga-next-box">
        <div class="sga-next-label">Next</div>
        <canvas id="tetris-next-canvas" width="80" height="80" aria-label="Next piece preview"></canvas>
      </div>
    </div>
    <div class="sga-controls">
      <button id="tetris-left" class="sga-pad" type="button">&#8592;</button>
      <button id="tetris-rotate" class="sga-pad" type="button">Rotate</button>
      <button id="tetris-down" class="sga-pad" type="button">&#8595;</button>
      <button id="tetris-drop" class="sga-pad wide" type="button">Drop</button>
      <button id="tetris-right" class="sga-pad" type="button">&#8594;</button>
    </div>
  </div>

  <div class="sga-sign">
    <h3>Sign your score</h3>
    <p>Connect your wallet, play a game, then sign your best score as a cryptographic proof. Signing is free and never sends SOL &mdash; it only proves you own the address that earned the score.</p>
    <button id="sign-score-btn" class="sga-btn" type="button">Sign your score</button>
    <div class="sga-signature" id="sign-signature">No signed score yet.</div>
    <button id="sign-copy" class="sga-btn ghost small" type="button">Copy</button>
    <div class="sga-sign-note" id="sign-note" style="display:none">
      This is a message signature only &mdash; no transaction was sent and no SOL was spent. Anyone can verify it against your public key with a Solana library.
    </div>
    <pre class="sga-sign-msg" id="sign-message"></pre>
  </div>

  <div class="sga-scores" id="sga-scores"></div>

  <div class="sga-support">
    <p><strong>Tip the developer</strong> &mdash; if the games made you smile, a small SOL tip helps keep this open-source work going. Send any amount to this address:</p>
    <code class="sga-tip-addr" id="tip-address">4Ub6VYF69PdCjpCMWDysU54WPb1xB7s628ASkCuJmcib</code>
    <div class="sga-support-actions">
      <a class="sga-btn ghost" href="/farshid/content/crypto.md">All donation addresses</a>
      <button id="tip-copy" class="sga-btn ghost" type="button">Copy SOL address</button>
    </div>
    <p class="sga-tip-hint">Works in Telegram and mobile browsers too &mdash; no wallet connection needed to send.</p>
  </div>
</div>

<script src="/farshid/content/solana-games.js?v=2"></script>
