---
layout: farshid_default
title: "QR Codes — Scan, Open, Copy"
permalink: /qr/
description: "Scan a code or tap Open to reach Dr. Farshid Pirahansiah's links — profiles, referral invites and crypto tip addresses — with a copy button for every URL and address."
---

<div class="qr-hero">
  <h1>Scan, open, copy</h1>
  <p>Point a phone camera at a code, or press <strong>Open</strong>. Every card also carries a <strong>Copy</strong> button for the link or the address, and the code itself downloads for sharing. This page is the permanent short link <strong>pirahansiah.com/qr</strong>.</p>
</div>

<style>
/* QR hub — one card per code: the code, what it opens, and the actions. Uses the site
   tokens so it follows light/dark; the code tiles stay white so scanners still read them. */
.qr-hero { margin: 4px 0 6px; }
.qr-hero h1 { margin: 0 0 10px; }
.qr-hero p { color: var(--ink-2); max-width: 92ch; margin: 0; }
.qr-hero strong { color: var(--ink); }
.qr-jump { display: flex; flex-wrap: wrap; gap: 7px; margin: 20px 0 2px; padding: 0 0 18px; border-bottom: 1px solid var(--rule); }
.qr-jump a {
  display: inline-flex; align-items: baseline; gap: 6px; font-size: 13.5px; font-weight: 500;
  color: var(--ink-2); text-decoration: none; border: 1px solid var(--rule);
  border-radius: var(--radius-pill); padding: 5px 12px;
  transition-property: background-color, color, border-color; transition-duration: 140ms;
}
.qr-jump a:hover { background: rgba(233, 84, 32, 0.10); color: var(--accent-ink); }
.qr-jump a span { font-size: 12px; color: var(--ink-3); font-variant-numeric: tabular-nums; }
.qr-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 14px; margin: 16px 0 10px; }
.qr-card {
  display: grid; grid-template-columns: 148px minmax(0, 1fr); gap: 16px; align-items: start;
  background: var(--surface); border: 1px solid var(--rule); border-radius: var(--radius);
  padding: 16px; box-shadow: var(--shadow-sm);
  transition-property: box-shadow, transform, border-color; transition-duration: 180ms;
  transition-timing-function: cubic-bezier(0.2, 0, 0, 1);
}
.qr-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-lg); border-color: var(--rule-strong); }
.qr-code { display: block; background: #fff; border: 1px solid var(--rule); border-radius: var(--radius-sm); padding: 7px; }
.qr-code img { display: block; width: 100%; height: auto; }
.qr-body { min-width: 0; }
.qr-card h3 { font-family: var(--ui-display); font-size: 16.5px; font-weight: 680; line-height: 1.3; margin: 1px 0 5px; color: var(--ink); }
.qr-desc { font-size: 13px; line-height: 1.5; color: var(--ink-2); margin: 0 0 9px; max-width: none; }
.qr-target { font-family: var(--mono); font-size: 11.5px; color: var(--ink-3); margin: 0 0 11px; word-break: break-all; max-width: none; }
.qr-actions { display: flex; flex-wrap: wrap; gap: 6px; }
.qr-btn {
  display: inline-flex; align-items: center; min-height: 34px; padding: 7px 12px;
  font-family: var(--ui); font-size: 12.5px; font-weight: 600; line-height: 1;
  background: var(--surface-2); color: var(--ink); border: 1px solid var(--rule);
  border-radius: var(--radius-sm); text-decoration: none; cursor: pointer; white-space: nowrap;
  transition-property: background-color, border-color, color, transform; transition-duration: 140ms;
}
.qr-btn:hover { background: var(--surface-3); border-color: var(--rule-strong); }
.qr-btn:active { transform: scale(0.98); }
.qr-btn.open { background: var(--accent-fill); border-color: transparent; color: #fff; }
.qr-btn.open:hover { background: #b83a08; }
.qr-btn.ghost { background: transparent; color: var(--ink-2); }
.qr-btn.ghost:hover { background: var(--surface-2); color: var(--ink); }
.qr-btn.is-copied { background: var(--accent-2); border-color: transparent; color: #fff; }
.qr-btn.is-copy-failed { background: var(--pink); border-color: transparent; color: #fff; }
.qr-addr {
  font-family: var(--mono); font-size: 11.5px; line-height: 1.5; word-break: break-all;
  color: var(--ink); background: var(--surface-2); border: 1px solid var(--rule);
  border-radius: var(--radius-sm); padding: 8px 10px; margin: 0 0 11px;
  font-variant-numeric: tabular-nums; -webkit-user-select: all; user-select: all; cursor: text;
}
.qr-note { background: var(--surface-2); border: 1px solid var(--rule); border-radius: var(--radius-sm); padding: 14px 16px; font-size: 13.5px; line-height: 1.55; color: var(--ink-2); margin: 0 0 22px; max-width: 92ch; }
.qr-topics { font-size: 12.5px; line-height: 1.7; color: var(--ink-3); max-width: 110ch; margin-top: 34px; }
.qr-hint { font-size: 13px; color: var(--ink-3); margin: 6px 0 0; }
@media (max-width: 760px) {
  .qr-grid { grid-template-columns: 1fr; gap: 12px; }
  .qr-card { grid-template-columns: 112px minmax(0, 1fr); gap: 13px; padding: 14px; }
  .qr-btn { font-size: 12px; padding: 7px 10px; }
}
@media (max-width: 400px) { .qr-card { grid-template-columns: 1fr; } .qr-code { width: 132px; } }
</style>

<nav class="qr-jump" aria-label="Jump to a group">
  <a href="#qr-social">Social &amp; web <span>17</span></a>
  <a href="#qr-referrals">Referrals &amp; invites <span>6</span></a>
  <a href="#qr-crypto">Crypto tip addresses <span>5</span></a>
</nav>

<h2 id="qr-social">Social &amp; web</h2>

<div class="qr-grid">
<div class="qr-card">
  <a class="qr-code" href="https://www.pirahansiah.com" target="_blank" rel="noopener" aria-label="Open pirahansiah.com QR code"><img src="/farshid/content/pirahansiah.png" alt="pirahansiah.com QR code" loading="lazy" width="132" height="132"></a>
  <div class="qr-body">
    <h3>pirahansiah.com</h3>
    <p class="qr-desc">Main knowledge base &amp; articles.</p>
    <p class="qr-target" title="https://www.pirahansiah.com">pirahansiah.com</p>
    <div class="qr-actions">
      <a class="qr-btn open" href="https://www.pirahansiah.com" target="_blank" rel="noopener">Open</a>
      <button class="qr-btn" type="button" data-copy="https://www.pirahansiah.com">Copy link</button>
      <a class="qr-btn ghost" href="/farshid/content/pirahansiah.png" download>Download QR</a>
    </div>
  </div>
</div>
<div class="qr-card">
  <a class="qr-code" href="https://www.linkedin.com/in/pirahansiah/" target="_blank" rel="noopener" aria-label="Open LinkedIn — profile QR code"><img src="/farshid/content/linkedin2.png" alt="LinkedIn — profile QR code" loading="lazy" width="132" height="132"></a>
  <div class="qr-body">
    <h3>LinkedIn — profile</h3>
    <p class="qr-desc">CV, experience and posts.</p>
    <p class="qr-target" title="https://www.linkedin.com/in/pirahansiah/">linkedin.com/in/pirahansiah</p>
    <div class="qr-actions">
      <a class="qr-btn open" href="https://www.linkedin.com/in/pirahansiah/" target="_blank" rel="noopener">Open</a>
      <button class="qr-btn" type="button" data-copy="https://www.linkedin.com/in/pirahansiah/">Copy link</button>
      <a class="qr-btn ghost" href="/farshid/content/linkedin2.png" download>Download QR</a>
    </div>
  </div>
</div>
<div class="qr-card">
  <a class="qr-code" href="https://www.linkedin.com/groups/10320678/" target="_blank" rel="noopener" aria-label="Open LinkedIn — page & group QR code"><img src="/farshid/content/linkedin.png" alt="LinkedIn — page & group QR code" loading="lazy" width="132" height="132"></a>
  <div class="qr-body">
    <h3>LinkedIn — page &amp; group</h3>
    <p class="qr-desc">Company page and the computer-vision group.</p>
    <p class="qr-target" title="https://www.linkedin.com/groups/10320678/">linkedin.com/groups/10320678</p>
    <div class="qr-actions">
      <a class="qr-btn open" href="https://www.linkedin.com/groups/10320678/" target="_blank" rel="noopener">Open</a>
      <a class="qr-btn" href="https://www.linkedin.com/company/pirahansiah/" target="_blank" rel="noopener">Company page</a>
      <a class="qr-btn" href="https://www.linkedin.com/in/pirahansiah/" target="_blank" rel="noopener">Profile</a>
      <button class="qr-btn" type="button" data-copy="https://www.linkedin.com/groups/10320678/">Copy link</button>
      <a class="qr-btn ghost" href="/farshid/content/linkedin.png" download>Download QR</a>
    </div>
  </div>
</div>
<div class="qr-card">
  <a class="qr-code" href="https://github.com/pirahansiah" target="_blank" rel="noopener" aria-label="Open GitHub QR code"><img src="/farshid/content/github.png" alt="GitHub QR code" loading="lazy" width="132" height="132"></a>
  <div class="qr-body">
    <h3>GitHub</h3>
    <p class="qr-desc">Open-source repos and code.</p>
    <p class="qr-target" title="https://github.com/pirahansiah">github.com/pirahansiah</p>
    <div class="qr-actions">
      <a class="qr-btn open" href="https://github.com/pirahansiah" target="_blank" rel="noopener">Open</a>
      <button class="qr-btn" type="button" data-copy="https://github.com/pirahansiah">Copy link</button>
      <a class="qr-btn ghost" href="/farshid/content/github.png" download>Download QR</a>
    </div>
  </div>
</div>
<div class="qr-card">
  <a class="qr-code" href="https://x.com/pirahansiah" target="_blank" rel="noopener" aria-label="Open X / Twitter QR code"><img src="/farshid/content/twitter.png" alt="X / Twitter QR code" loading="lazy" width="132" height="132"></a>
  <div class="qr-body">
    <h3>X / Twitter</h3>
    <p class="qr-desc">Posts and updates.</p>
    <p class="qr-target" title="https://x.com/pirahansiah">x.com/pirahansiah</p>
    <div class="qr-actions">
      <a class="qr-btn open" href="https://x.com/pirahansiah" target="_blank" rel="noopener">Open</a>
      <button class="qr-btn" type="button" data-copy="https://x.com/pirahansiah">Copy link</button>
      <a class="qr-btn ghost" href="/farshid/content/twitter.png" download>Download QR</a>
    </div>
  </div>
</div>
<div class="qr-card">
  <a class="qr-code" href="https://www.youtube.com/@pirahansiah" target="_blank" rel="noopener" aria-label="Open YouTube QR code"><img src="/farshid/content/youtube.png" alt="YouTube QR code" loading="lazy" width="132" height="132"></a>
  <div class="qr-body">
    <h3>YouTube</h3>
    <p class="qr-desc">Video tutorials and tech talks.</p>
    <p class="qr-target" title="https://www.youtube.com/@pirahansiah">youtube.com/@pirahansiah</p>
    <div class="qr-actions">
      <a class="qr-btn open" href="https://www.youtube.com/@pirahansiah" target="_blank" rel="noopener">Open</a>
      <button class="qr-btn" type="button" data-copy="https://www.youtube.com/@pirahansiah">Copy link</button>
      <a class="qr-btn ghost" href="/farshid/content/youtube.png" download>Download QR</a>
    </div>
  </div>
</div>
<div class="qr-card">
  <a class="qr-code" href="https://www.instagram.com/computer_vision_deep_learning/" target="_blank" rel="noopener" aria-label="Open Instagram QR code"><img src="/farshid/content/instagram.png" alt="Instagram QR code" loading="lazy" width="132" height="132"></a>
  <div class="qr-body">
    <h3>Instagram</h3>
    <p class="qr-desc">Visual updates and highlights.</p>
    <p class="qr-target" title="https://www.instagram.com/computer_vision_deep_learning/">instagram.com/computer_vision_deep_learning</p>
    <div class="qr-actions">
      <a class="qr-btn open" href="https://www.instagram.com/computer_vision_deep_learning/" target="_blank" rel="noopener">Open</a>
      <a class="qr-btn" href="https://www.instagram.com/pirahansiah/" target="_blank" rel="noopener">Personal profile</a>
      <button class="qr-btn" type="button" data-copy="https://www.instagram.com/computer_vision_deep_learning/">Copy link</button>
      <a class="qr-btn ghost" href="/farshid/content/instagram.png" download>Download QR</a>
    </div>
  </div>
</div>
<div class="qr-card">
  <a class="qr-code" href="https://www.facebook.com/groups/computervisiondeeplearning/" target="_blank" rel="noopener" aria-label="Open Facebook QR code"><img src="/farshid/content/facebook.png" alt="Facebook QR code" loading="lazy" width="132" height="132"></a>
  <div class="qr-body">
    <h3>Facebook</h3>
    <p class="qr-desc">Community group and page.</p>
    <p class="qr-target" title="https://www.facebook.com/groups/computervisiondeeplearning/">facebook.com/groups/computervisiondeeplearning</p>
    <div class="qr-actions">
      <a class="qr-btn open" href="https://www.facebook.com/groups/computervisiondeeplearning/" target="_blank" rel="noopener">Open</a>
      <a class="qr-btn" href="https://www.facebook.com/farshid.pirahansiah" target="_blank" rel="noopener">Personal page</a>
      <button class="qr-btn" type="button" data-copy="https://www.facebook.com/groups/computervisiondeeplearning/">Copy link</button>
      <a class="qr-btn ghost" href="/farshid/content/facebook.png" download>Download QR</a>
    </div>
  </div>
</div>
<div class="qr-card">
  <a class="qr-code" href="https://t.me/computer_vision_llm" target="_blank" rel="noopener" aria-label="Open Telegram QR code"><img src="/farshid/content/telegram.png" alt="Telegram QR code" loading="lazy" width="132" height="132"></a>
  <div class="qr-body">
    <h3>Telegram</h3>
    <p class="qr-desc">Channel and bots.</p>
    <p class="qr-target" title="https://t.me/computer_vision_llm">t.me/computer_vision_llm</p>
    <div class="qr-actions">
      <a class="qr-btn open" href="https://t.me/computer_vision_llm" target="_blank" rel="noopener">Open</a>
      <a class="qr-btn" href="https://t.me/pirahansiah" target="_blank" rel="noopener">t.me/pirahansiah</a>
      <button class="qr-btn" type="button" data-copy="https://t.me/computer_vision_llm">Copy link</button>
      <a class="qr-btn ghost" href="/farshid/content/telegram.png" download>Download QR</a>
    </div>
  </div>
</div>
<div class="qr-card">
  <a class="qr-code" href="https://wa.me/pirahansiah" target="_blank" rel="noopener" aria-label="Open WhatsApp QR code"><img src="/farshid/content/whatsapp.png" alt="WhatsApp QR code" loading="lazy" width="132" height="132"></a>
  <div class="qr-body">
    <h3>WhatsApp</h3>
    <p class="qr-desc">Direct message.</p>
    <p class="qr-target" title="https://wa.me/pirahansiah">wa.me/pirahansiah</p>
    <div class="qr-actions">
      <a class="qr-btn open" href="https://wa.me/pirahansiah" target="_blank" rel="noopener">Open</a>
      <button class="qr-btn" type="button" data-copy="https://wa.me/pirahansiah">Copy link</button>
      <a class="qr-btn ghost" href="/farshid/content/whatsapp.png" download>Download QR</a>
    </div>
  </div>
</div>
<div class="qr-card">
  <a class="qr-code" href="https://discord.gg/mjKU9REW" target="_blank" rel="noopener" aria-label="Open Discord QR code"><img src="/farshid/content/discord.png" alt="Discord QR code" loading="lazy" width="132" height="132"></a>
  <div class="qr-body">
    <h3>Discord</h3>
    <p class="qr-desc">Community server.</p>
    <p class="qr-target" title="https://discord.gg/mjKU9REW">discord.gg/mjKU9REW</p>
    <div class="qr-actions">
      <a class="qr-btn open" href="https://discord.gg/mjKU9REW" target="_blank" rel="noopener">Open</a>
      <button class="qr-btn" type="button" data-copy="https://discord.gg/mjKU9REW">Copy link</button>
      <a class="qr-btn ghost" href="/farshid/content/discord.png" download>Download QR</a>
    </div>
  </div>
</div>
<div class="qr-card">
  <a class="qr-code" href="https://mastodon.social/@pirahansiah" target="_blank" rel="noopener" aria-label="Open Mastodon QR code"><img src="/farshid/content/mastodon.png" alt="Mastodon QR code" loading="lazy" width="132" height="132"></a>
  <div class="qr-body">
    <h3>Mastodon</h3>
    <p class="qr-desc">Fediverse profile.</p>
    <p class="qr-target" title="https://mastodon.social/@pirahansiah">mastodon.social/@pirahansiah</p>
    <div class="qr-actions">
      <a class="qr-btn open" href="https://mastodon.social/@pirahansiah" target="_blank" rel="noopener">Open</a>
      <button class="qr-btn" type="button" data-copy="https://mastodon.social/@pirahansiah">Copy link</button>
      <a class="qr-btn ghost" href="/farshid/content/mastodon.png" download>Download QR</a>
    </div>
  </div>
</div>
<div class="qr-card">
  <a class="qr-code" href="https://www.reddit.com/user/pirahansiah/" target="_blank" rel="noopener" aria-label="Open Reddit QR code"><img src="/farshid/content/reddit.png" alt="Reddit QR code" loading="lazy" width="132" height="132"></a>
  <div class="qr-body">
    <h3>Reddit</h3>
    <p class="qr-desc">Profile and communities.</p>
    <p class="qr-target" title="https://www.reddit.com/user/pirahansiah/">reddit.com/user/pirahansiah</p>
    <div class="qr-actions">
      <a class="qr-btn open" href="https://www.reddit.com/user/pirahansiah/" target="_blank" rel="noopener">Open</a>
      <button class="qr-btn" type="button" data-copy="https://www.reddit.com/user/pirahansiah/">Copy link</button>
      <a class="qr-btn ghost" href="/farshid/content/reddit.png" download>Download QR</a>
    </div>
  </div>
</div>
<div class="qr-card">
  <a class="qr-code" href="https://www.tiktok.com/@pirahansiah" target="_blank" rel="noopener" aria-label="Open TikTok QR code"><img src="/farshid/content/tiktok.png" alt="TikTok QR code" loading="lazy" width="132" height="132"></a>
  <div class="qr-body">
    <h3>TikTok</h3>
    <p class="qr-desc">Short-form video.</p>
    <p class="qr-target" title="https://www.tiktok.com/@pirahansiah">tiktok.com/@pirahansiah</p>
    <div class="qr-actions">
      <a class="qr-btn open" href="https://www.tiktok.com/@pirahansiah" target="_blank" rel="noopener">Open</a>
      <button class="qr-btn" type="button" data-copy="https://www.tiktok.com/@pirahansiah">Copy link</button>
      <a class="qr-btn ghost" href="/farshid/content/tiktok.png" download>Download QR</a>
    </div>
  </div>
</div>
<div class="qr-card">
  <a class="qr-code" href="https://www.tiziran.com" target="_blank" rel="noopener" aria-label="Open tiziran.com QR code"><img src="/farshid/content/tiziran.png" alt="tiziran.com QR code" loading="lazy" width="132" height="132"></a>
  <div class="qr-body">
    <h3>tiziran.com</h3>
    <p class="qr-desc">Tiziran project site.</p>
    <p class="qr-target" title="https://www.tiziran.com">tiziran.com</p>
    <div class="qr-actions">
      <a class="qr-btn open" href="https://www.tiziran.com" target="_blank" rel="noopener">Open</a>
      <button class="qr-btn" type="button" data-copy="https://www.tiziran.com">Copy link</button>
      <a class="qr-btn ghost" href="/farshid/content/tiziran.png" download>Download QR</a>
    </div>
  </div>
</div>
<div class="qr-card">
  <a class="qr-code" href="https://pirahansiah.com/atlas" target="_blank" rel="noopener" aria-label="Open Mind maps QR code"><img src="/farshid/content/mindmaps.png" alt="Mind maps QR code" loading="lazy" width="132" height="132"></a>
  <div class="qr-body">
    <h3>Mind maps</h3>
    <p class="qr-desc">Mind maps of the notes on this site.</p>
    <p class="qr-target" title="https://pirahansiah.com/atlas">pirahansiah.com/atlas</p>
    <div class="qr-actions">
      <a class="qr-btn open" href="https://pirahansiah.com/atlas" target="_blank" rel="noopener">Open</a>
      <a class="qr-btn" href="https://github.com/pirahansiah/my-mind" target="_blank" rel="noopener">my-mind repo</a>
      <button class="qr-btn" type="button" data-copy="https://pirahansiah.com/atlas">Copy link</button>
      <a class="qr-btn ghost" href="/farshid/content/mindmaps.png" download>Download QR</a>
    </div>
  </div>
</div>
<div class="qr-card">
  <a class="qr-code" href="https://docs.google.com/presentation/d/14HX-99rGO9x1AtOnEigZ_2gAzZaPwvxqCEnnG0dk870/edit?usp=sharing" target="_blank" rel="noopener" aria-label="Open Slide decks QR code"><img src="/farshid/content/slides.png" alt="Slide decks QR code" loading="lazy" width="132" height="132"></a>
  <div class="qr-body">
    <h3>Slide decks</h3>
    <p class="qr-desc">Talks and presentations.</p>
    <p class="qr-target" title="https://docs.google.com/presentation/d/14HX-99rGO9x1AtOnEigZ_2gAzZaPwvxqCEnnG0dk870/edit?usp=sharing">docs.google.com/presentation/d/14HX-99rGO9x1AtOnEigZ_2gAzZaPwvxqCEnnG0dk870/edit?usp=sharing</p>
    <div class="qr-actions">
      <a class="qr-btn open" href="https://docs.google.com/presentation/d/14HX-99rGO9x1AtOnEigZ_2gAzZaPwvxqCEnnG0dk870/edit?usp=sharing" target="_blank" rel="noopener">Open</a>
      <a class="qr-btn" href="https://pirahansiah.com/notes/slides/" target="_blank" rel="noopener">All decks on this site</a>
      <button class="qr-btn" type="button" data-copy="https://docs.google.com/presentation/d/14HX-99rGO9x1AtOnEigZ_2gAzZaPwvxqCEnnG0dk870/edit?usp=sharing">Copy link</button>
      <a class="qr-btn ghost" href="/farshid/content/slides.png" download>Download QR</a>
    </div>
  </div>
</div>
</div>

<h2 id="qr-referrals">Referrals &amp; invites</h2>

<p class="qr-note">Invite links to services I hold accounts with. Using one is optional &mdash; it earns me a small referral credit at no cost to you, and every link can be copied or downloaded like any other.</p>

<div class="qr-grid">
<div class="qr-card">
  <a class="qr-code" href="https://opencode.ai/go?ref=3KMNQG0CS4" target="_blank" rel="noopener" aria-label="Open OpenCode QR code"><img src="/farshid/content/opencode.png" alt="OpenCode QR code" loading="lazy" width="132" height="132"></a>
  <div class="qr-body">
    <h3>OpenCode</h3>
    <p class="qr-desc">Low-cost coding models for everyone.</p>
    <p class="qr-target" title="https://opencode.ai/go?ref=3KMNQG0CS4">opencode.ai/go?ref=3KMNQG0CS4</p>
    <div class="qr-actions">
      <a class="qr-btn open" href="https://opencode.ai/go?ref=3KMNQG0CS4" target="_blank" rel="noopener">Open</a>
      <button class="qr-btn" type="button" data-copy="https://opencode.ai/go?ref=3KMNQG0CS4">Copy link</button>
      <a class="qr-btn ghost" href="/farshid/content/opencode.png" download>Download QR</a>
    </div>
  </div>
</div>
<div class="qr-card">
  <a class="qr-code" href="https://refnocode.trade.re/z28xmjp6" target="_blank" rel="noopener" aria-label="Open Trade Republic QR code"><img src="/farshid/content/trade.png" alt="Trade Republic QR code" loading="lazy" width="132" height="132"></a>
  <div class="qr-body">
    <h3>Trade Republic</h3>
    <p class="qr-desc">Invest, spend and bank — free account, welcome bonus via the link.</p>
    <p class="qr-target" title="https://refnocode.trade.re/z28xmjp6">refnocode.trade.re/z28xmjp6</p>
    <div class="qr-actions">
      <a class="qr-btn open" href="https://refnocode.trade.re/z28xmjp6" target="_blank" rel="noopener">Open</a>
      <button class="qr-btn" type="button" data-copy="https://refnocode.trade.re/z28xmjp6">Copy link</button>
      <a class="qr-btn ghost" href="/farshid/content/trade.png" download>Download QR</a>
    </div>
  </div>
</div>
<div class="qr-card">
  <a class="qr-code" href="https://de.scalable.capital/en/invitation/bj2bkn" target="_blank" rel="noopener" aria-label="Open Scalable Capital QR code"><img src="/farshid/content/scalable.png" alt="Scalable Capital QR code" loading="lazy" width="132" height="132"></a>
  <div class="qr-body">
    <h3>Scalable Capital</h3>
    <p class="qr-desc">Investing platform — €25 start bonus via the invite.</p>
    <p class="qr-target" title="https://de.scalable.capital/en/invitation/bj2bkn">de.scalable.capital/en/invitation/bj2bkn</p>
    <div class="qr-actions">
      <a class="qr-btn open" href="https://de.scalable.capital/en/invitation/bj2bkn" target="_blank" rel="noopener">Open</a>
      <button class="qr-btn" type="button" data-copy="https://de.scalable.capital/en/invitation/bj2bkn">Copy link</button>
      <a class="qr-btn ghost" href="/farshid/content/scalable.png" download>Download QR</a>
    </div>
  </div>
</div>
<div class="qr-card">
  <a class="qr-code" href="https://wise.com/invite/ilpn/farshidp1" target="_blank" rel="noopener" aria-label="Open Wise QR code"><img src="/farshid/content/wise.png" alt="Wise QR code" loading="lazy" width="132" height="132"></a>
  <div class="qr-body">
    <h3>Wise</h3>
    <p class="qr-desc">Send and receive money internationally, low fees.</p>
    <p class="qr-target" title="https://wise.com/invite/ilpn/farshidp1">wise.com/invite/ilpn/farshidp1</p>
    <div class="qr-actions">
      <a class="qr-btn open" href="https://wise.com/invite/ilpn/farshidp1" target="_blank" rel="noopener">Open</a>
      <button class="qr-btn" type="button" data-copy="https://wise.com/invite/ilpn/farshidp1">Copy link</button>
      <a class="qr-btn ghost" href="/farshid/content/wise.png" download>Download QR</a>
    </div>
  </div>
</div>
<div class="qr-card">
  <a class="qr-code" href="https://etoro.tw/3XGZzNz" target="_blank" rel="noopener" aria-label="Open eToro QR code"><img src="/farshid/content/etoro.png" alt="eToro QR code" loading="lazy" width="132" height="132"></a>
  <div class="qr-body">
    <h3>eToro</h3>
    <p class="qr-desc">Trade thousands of assets; sign up with the link.</p>
    <p class="qr-target" title="https://etoro.tw/3XGZzNz">etoro.tw/3XGZzNz</p>
    <div class="qr-actions">
      <a class="qr-btn open" href="https://etoro.tw/3XGZzNz" target="_blank" rel="noopener">Open</a>
      <button class="qr-btn" type="button" data-copy="https://etoro.tw/3XGZzNz">Copy link</button>
      <a class="qr-btn ghost" href="/farshid/content/etoro.png" download>Download QR</a>
    </div>
  </div>
</div>
<div class="qr-card">
  <a class="qr-code" href="https://invite.kraken.com/JDNW/sqqgzc9a" target="_blank" rel="noopener" aria-label="Open Kraken QR code"><img src="/farshid/content/kraken.png" alt="Kraken QR code" loading="lazy" width="132" height="132"></a>
  <div class="qr-body">
    <h3>Kraken</h3>
    <p class="qr-desc">Buy, sell and trade crypto; join with the invite.</p>
    <p class="qr-target" title="https://invite.kraken.com/JDNW/sqqgzc9a">invite.kraken.com/JDNW/sqqgzc9a</p>
    <div class="qr-actions">
      <a class="qr-btn open" href="https://invite.kraken.com/JDNW/sqqgzc9a" target="_blank" rel="noopener">Open</a>
      <button class="qr-btn" type="button" data-copy="https://invite.kraken.com/JDNW/sqqgzc9a">Copy link</button>
      <a class="qr-btn ghost" href="/farshid/content/kraken.png" download>Download QR</a>
    </div>
  </div>
</div>
</div>

<h2 id="qr-crypto">Crypto tip addresses</h2>

<p class="qr-note">Purely optional &mdash; this is a tip jar, nothing more, for the open-source projects and free tools I build and maintain. No invoice, no obligation, nothing to sign. If you would rather not, everything stays free to use.</p>

<div class="qr-grid">
<div class="qr-card">
  <div class="qr-code"><img src="/farshid/content/btc.svg" alt="Bitcoin (BTC) address QR code" loading="lazy" width="132" height="132"></div>
  <div class="qr-body">
    <h3>Bitcoin (BTC)</h3>
    <p class="qr-desc">Bitcoin network &middot; BTC only</p>
    <div class="qr-addr">bc1q922uu6uwu3x2grlkypeuyywet9msk2fzxypy6d</div>
    <div class="qr-actions">
      <button class="qr-btn open" type="button" data-copy="bc1q922uu6uwu3x2grlkypeuyywet9msk2fzxypy6d">Copy address</button>
      <a class="qr-btn" href="https://mempool.space/address/bc1q922uu6uwu3x2grlkypeuyywet9msk2fzxypy6d" target="_blank" rel="noopener">Open in explorer</a>
      <a class="qr-btn ghost" href="/farshid/content/btc.svg" download>Download QR</a>
    </div>
  </div>
</div>
<div class="qr-card">
  <div class="qr-code"><img src="/farshid/content/eth.svg" alt="Ethereum (ETH) address QR code" loading="lazy" width="132" height="132"></div>
  <div class="qr-body">
    <h3>Ethereum (ETH)</h3>
    <p class="qr-desc">Ethereum mainnet &middot; ETH &amp; ERC-20</p>
    <div class="qr-addr">0xFcE78486AE65e006Dc0d235FDD5d1E9169D53B0C</div>
    <div class="qr-actions">
      <button class="qr-btn open" type="button" data-copy="0xFcE78486AE65e006Dc0d235FDD5d1E9169D53B0C">Copy address</button>
      <a class="qr-btn" href="https://etherscan.io/address/0xFcE78486AE65e006Dc0d235FDD5d1E9169D53B0C" target="_blank" rel="noopener">Open in explorer</a>
      <a class="qr-btn ghost" href="/farshid/content/eth.svg" download>Download QR</a>
    </div>
  </div>
</div>
<div class="qr-card">
  <div class="qr-code"><img src="/farshid/content/bnb.svg" alt="BNB address QR code" loading="lazy" width="132" height="132"></div>
  <div class="qr-body">
    <h3>BNB</h3>
    <p class="qr-desc">BNB Smart Chain &middot; BNB &amp; BEP-20</p>
    <div class="qr-addr">0xFcE78486AE65e006Dc0d235FDD5d1E9169D53B0C</div>
    <div class="qr-actions">
      <button class="qr-btn open" type="button" data-copy="0xFcE78486AE65e006Dc0d235FDD5d1E9169D53B0C">Copy address</button>
      <a class="qr-btn" href="https://bscscan.com/address/0xFcE78486AE65e006Dc0d235FDD5d1E9169D53B0C" target="_blank" rel="noopener">Open in explorer</a>
      <a class="qr-btn ghost" href="/farshid/content/bnb.svg" download>Download QR</a>
    </div>
  </div>
</div>
<div class="qr-card">
  <div class="qr-code"><img src="/farshid/content/sol.svg" alt="Solana (SOL) address QR code" loading="lazy" width="132" height="132"></div>
  <div class="qr-body">
    <h3>Solana (SOL)</h3>
    <p class="qr-desc">Solana network &middot; SOL &amp; SPL tokens</p>
    <div class="qr-addr">4Ub6VYF69PdCjpCMWDysU54WPb1xB7s628ASkCuJmcib</div>
    <div class="qr-actions">
      <button class="qr-btn open" type="button" data-copy="4Ub6VYF69PdCjpCMWDysU54WPb1xB7s628ASkCuJmcib">Copy address</button>
      <a class="qr-btn" href="https://solscan.io/account/4Ub6VYF69PdCjpCMWDysU54WPb1xB7s628ASkCuJmcib" target="_blank" rel="noopener">Open in explorer</a>
      <a class="qr-btn ghost" href="/farshid/content/sol.svg" download>Download QR</a>
    </div>
  </div>
</div>
<div class="qr-card">
  <div class="qr-code"><img src="/farshid/content/base.svg" alt="Base address QR code" loading="lazy" width="132" height="132"></div>
  <div class="qr-body">
    <h3>Base</h3>
    <p class="qr-desc">Base L2 &middot; ETH on Base only</p>
    <div class="qr-addr">0xFcE78486AE65e006Dc0d235FDD5d1E9169D53B0C</div>
    <div class="qr-actions">
      <button class="qr-btn open" type="button" data-copy="0xFcE78486AE65e006Dc0d235FDD5d1E9169D53B0C">Copy address</button>
      <a class="qr-btn" href="https://basescan.org/address/0xFcE78486AE65e006Dc0d235FDD5d1E9169D53B0C" target="_blank" rel="noopener">Open in explorer</a>
      <a class="qr-btn ghost" href="/farshid/content/base.svg" download>Download QR</a>
    </div>
  </div>
</div>
</div>

<p class="qr-addr-note">The same address covers ETH, BNB and Base &mdash; copy it once, then check it on the device that signs before sending, and send only on the network named above each code.</p>

<p class="qr-topics">Computer Vision, Generative AI, Edge Computing, Fine-tune Multimodal LLMs, Robotics, IoT, AR/VR, Medical Imaging, Autonomous Vehicles, Smart Cities, Industrial Automation, Surveillance Systems, Gesture Recognition, Facial Recognition, Emotion Detection, Object Tracking, 3D Reconstruction, Augmented Reality Applications, Virtual Reality Experiences, Edge AI Model Optimization, Real-time Video Analytics, Deep Learning Model Deployment, AI-powered Drones, AI in Healthcare Imaging</p>

<p class="qr-hint">Every code on this page can be opened with a tap, copied with one button, or downloaded as an image to share.</p>
