---
layout: farshid_default
permalink: /metamask/
title: "MetaMask — Connect & Receive"
description: "Connect MetaMask to auto-fill your EVM address, send crypto, or reveal a receive address. Private test page."
sitemap: false
noindex: true
---
> **MetaMask Connect** — Connect your wallet, receive, or send crypto automatically. — https://pirahansiah.com/metamask/
Connect MetaMask to auto-fill your EVM address, send crypto, or reveal a receive address. Private test page.

*Last updated: 2026-08-16.*  <!--ENHANCED-->


<style>
.mm-hero { text-align: center; padding: 32px 16px 4px; }
.mm-hero h1 { font-size: 2rem; margin: 0 0 8px; }
.mm-hero p { color: var(--text-muted); margin: 0 auto 4px; max-width: 640px; }

.mm-connect-bar { max-width: 520px; margin: 18px auto 0; padding: 0 16px; text-align: center; }
.mm-btn {
  display: inline-block; padding: 12px 26px; border: none; border-radius: 12px; cursor: pointer;
  font-size: 1rem; font-weight: 600; color: #062A33;
  background: linear-gradient(135deg, var(--farshid-blue), var(--farshid-purple));
  box-shadow: 0 4px 18px rgba(34, 211, 238,0.35); transition: transform 0.15s ease, box-shadow 0.15s ease;
}
.mm-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 22px rgba(34, 211, 238,0.45); }
.mm-btn.ghost { background: var(--glass-bg-strong); box-shadow: none; }
.mm-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
.mm-connected {
  display: none; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap;
  padding: 12px 16px; border-radius: 14px; background: var(--glass-bg); border: 1px solid var(--glass-border);
  font-size: 0.9rem;
}
.mm-connected .acct { font-family: ui-monospace, monospace; color: #7ee0a3; }
.mm-connected .bal { color: var(--text-muted); }
.mm-err {
  margin-top: 12px; padding: 12px; border-radius: 10px;
  background: rgba(255,55,95,0.15); border: 1px solid rgba(255,55,95,0.4);
  color: #ff8a9b; font-size: 0.88rem; display: none;
}

.crypto-warnings { max-width: 760px; margin: 22px auto 6px; padding: 0 16px; display: grid; gap: 12px; }
.warn-box {
  display: flex; gap: 12px; align-items: flex-start;
  border-radius: 14px; padding: 14px 16px; font-size: 0.92rem; line-height: 1.6;
  backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
}
.warn-box .warn-icon { font-size: 1.2rem; line-height: 1.4; flex-shrink: 0; }
.warn-box b { display: block; margin-bottom: 2px; }
.warn-box.warning { background: rgba(255,59,48,0.10); border: 1px solid rgba(255,59,48,0.38); color: #ffb3b8; }
.warn-box.warning b { color: #ff6961; }
.warn-box.caution { background: rgba(255,149,0,0.10); border: 1px solid rgba(255,159,10,0.38); color: #ffd9a0; }
.warn-box.caution b { color: #ffb340; }
.warn-box.note { background: rgba(34, 211, 238,0.10); border: 1px solid rgba(34, 211, 238,0.38); color: #bcd9ff; }
.warn-box.note b { color: #06B6D4; }
.warn-box.when { background: rgba(48,209,88,0.09); border: 1px solid rgba(48,209,88,0.36); color: #b7e8c7; }
.warn-box.when b { color: #30d158; }
.warn-box code { font-family: ui-monospace, monospace; color: #06B6D4; }

.crypto-selector { max-width: 760px; margin: 26px auto 0; padding: 0 16px; display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
.token-pill {
  padding: 9px 18px; border-radius: 12px; cursor: pointer; font-size: 0.9rem; font-weight: 700;
  color: var(--text-muted); background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.14);
  transition: all 0.18s ease;
}
.token-pill:hover { border-color: rgba(34, 211, 238,0.5); color: var(--text); }
.token-pill.active { color: #062A33; border-color: transparent; background: linear-gradient(135deg, #22D3EE, #06B6D4); box-shadow: 0 4px 16px rgba(34, 211, 238,0.35); }

.crypto-panel {
  max-width: 440px; margin: 22px auto 0; padding: 26px 22px; border-radius: 20px; text-align: center;
  background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
}
.panel-head { display: flex; align-items: center; justify-content: center; gap: 10px; margin-bottom: 6px; }
.panel-head .ticker { font-size: 1.6rem; font-weight: 800; letter-spacing: 0.5px; }
.panel-head .chain { font-size: 0.8rem; color: var(--text-muted); background: rgba(255,255,255,0.08); padding: 3px 10px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); }
.panel-network { color: var(--text-muted); font-size: 0.82rem; margin-bottom: 14px; }
.panel-live { display: none; color: #30d158; font-size: 0.78rem; margin-bottom: 10px; }
.crypto-panel .qr { width: 168px; height: 168px; margin: 0 auto 16px; border-radius: 12px; background: #fff; padding: 10px; display: flex; align-items: center; justify-content: center; }
.crypto-panel .qr img { width: 148px; height: 148px; display: block; }
.crypto-panel .qr .qr-svg { display: none; }
.crypto-panel .qr .qr-svg svg { width: 148px; height: 148px; display: block; }
.crypto-panel .addr {
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
  font-size: 0.8rem; line-height: 1.5; word-break: break-all; color: #c9d4e3;
  background: rgba(0,0,0,0.28); border: 1px solid rgba(255,255,255,0.1); border-radius: 10px; padding: 12px; margin-bottom: 16px;
}
.copy-btn {
  display: inline-flex; align-items: center; gap: 8px; padding: 10px 22px;
  background: linear-gradient(135deg, #22D3EE, #06B6D4); color: #062A33; border: none; border-radius: 10px;
  font-size: 0.92rem; font-weight: 700; cursor: pointer; transition: opacity 0.2s ease, transform 0.2s ease;
}
.copy-btn:hover { opacity: 0.9; transform: scale(1.03); }
.copy-btn.copied { background: linear-gradient(135deg, #34c759, #30d158); }
.panel-warn { margin-top: 16px; font-size: 0.8rem; color: #ffb340; line-height: 1.5; }

/* --- send panel --- */
.send-panel {
  max-width: 440px; margin: 18px auto 40px; padding: 24px 22px; border-radius: 20px; text-align: center;
  background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.12);
  backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
}
.send-panel h3 { margin: 0 0 4px; font-size: 1.15rem; }
.send-desc { color: var(--text-muted); font-size: 0.82rem; margin: 0 0 14px; }
.send-balance { font-size: 0.9rem; font-weight: 600; color: #7ee0a3; margin-bottom: 14px; min-height: 1.2em; }
.send-row { display: flex; align-items: center; gap: 10px; justify-content: center; margin-bottom: 14px; }
.send-row input {
  width: 180px; padding: 11px 14px; border-radius: 10px; font-size: 1rem;
  background: rgba(0,0,0,0.28); border: 1px solid rgba(255,255,255,0.14); color: var(--text);
}
.send-row input:focus { outline: none; border-color: rgba(34, 211, 238,0.6); }
.send-sym { font-size: 0.9rem; font-weight: 700; color: var(--text-muted); min-width: 34px; }
.send-btn {
  display: inline-block; padding: 11px 28px; border: none; border-radius: 12px; cursor: pointer;
  font-size: 0.95rem; font-weight: 700; color: #fff;
  background: linear-gradient(135deg, #34c759, #30d158); box-shadow: 0 4px 18px rgba(48,209,88,0.3);
  transition: transform 0.15s ease, opacity 0.15s ease;
}
.send-btn:hover { transform: translateY(-1px); }
.send-btn:disabled { opacity: 0.45; cursor: not-allowed; transform: none; }
.send-status { margin-top: 12px; font-size: 0.84rem; line-height: 1.5; min-height: 1.2em; color: var(--text-muted); word-break: break-all; }
.send-status.ok { color: #30d158; }
.send-status.err { color: #ff8a9b; }
.send-status.pending { color: #ffb340; }

.mm-note { color: var(--text-muted); font-size: 0.8rem; margin: 20px auto 0; text-align: center; max-width: 560px; padding-bottom: 40px; }
</style>

<div class="mm-hero">
  <h1>MetaMask — Connect &amp; Receive</h1>
  <p>Connect your wallet, then receive or send crypto automatically. Select a token to switch networks.</p>
</div>

<div class="mm-connect-bar">
  <button class="mm-btn" id="mm-connect-btn" type="button">Connect MetaMask</button>
  <div class="mm-connected" id="mm-connected">
    <span class="acct" id="mm-acct"></span>
    <span class="bal" id="mm-bal"></span>
    <button class="mm-btn ghost" id="mm-disconnect" type="button">Disconnect</button>
  </div>
  <div class="mm-err" id="mm-err"></div>
</div>

<div class="crypto-warnings">
  <div class="warn-box warning">
    <span class="warn-icon">&#9888;&#65039;</span>
    <div><b>Warning — transfers are irreversible</b>
    Crypto transactions cannot be reversed, refunded, or recovered once confirmed. There is no chargeback and no support line that can undo a transfer. Double-check everything before you send.</div>
  </div>
  <div class="warn-box caution">
    <span class="warn-icon">&#9888;&#65039;</span>
    <div><b>Caution — send on the correct network</b>
    Ethereum, Base and BNB Smart Chain share the same address (<code>0xFcE7&hellip;53B0C</code>). Sending on the wrong network — for example Base instead of Ethereum — can permanently lose your funds. The page auto-switches to the right network before sending.</div>
  </div>
  <div class="warn-box note">
    <span class="warn-icon">&#8505;&#65039;</span>
    <div><b>Note — voluntary, no invoice</b>
    This page is a voluntary support option, not a purchase or invoice. Crypto payments are final with no automatic receipt or confirmation. If you are unsure, send a small test amount first.</div>
  </div>
  <div class="warn-box when">
    <span class="warn-icon">&#128161;</span>
    <div><b>When to use it</b>
    Use crypto to support the work anonymously or internationally with low fees. For contracts, invoices, consulting, or anything that needs a receipt, email <code>info@pirahansiah.com</code> instead.</div>
  </div>
</div>

<div class="crypto-selector" id="crypto-selector">
  <button class="token-pill" data-token="btc" type="button">BTC</button>
  <button class="token-pill active" data-token="eth" type="button">ETH</button>
  <button class="token-pill" data-token="sol" type="button">SOL</button>
  <button class="token-pill" data-token="base" type="button">BASE</button>
  <button class="token-pill" data-token="bnb" type="button">BNB</button>
</div>

<div class="crypto-panel">
  <div class="panel-head">
    <span class="ticker" id="sel-ticker">&#9874; ETH</span>
    <span class="chain" id="sel-chain">Ethereum</span>
  </div>
  <div class="panel-network" id="sel-network">Ethereum mainnet &middot; native ETH &amp; ERC-20 tokens</div>
  <div class="panel-live" id="sel-live">&#10003; Live from your connected MetaMask wallet</div>
  <div class="qr">
    <img id="sel-qr-img" src="/farshid/content/eth.svg" alt="Ethereum QR code">
    <div class="qr-svg" id="sel-qr-svg"></div>
  </div>
  <div class="addr" id="sel-addr">0xFcE78486AE65e006Dc0d235FDD5d1E9169D53B0C</div>
  <button class="copy-btn" id="sel-copy" type="button">Copy address</button>
  <div class="panel-warn" id="sel-warn">Send only on the Ethereum network (ERC-20).</div>
</div>

<div class="send-panel">
  <h3>Send crypto</h3>
  <p class="send-desc">Sends native tokens from your connected wallet to the support address (auto-switches network).</p>
  <div class="send-balance" id="send-balance">Connect MetaMask to see your balance.</div>
  <div class="send-row">
    <input type="text" id="send-amount" inputmode="decimal" placeholder="0.001" autocomplete="off">
    <span class="send-sym" id="send-sym">ETH</span>
  </div>
  <button class="send-btn" id="send-btn" type="button" disabled>Send</button>
  <div class="send-status" id="send-status">Connect MetaMask to enable sending.</div>
</div>

<p class="mm-note">Private test page — not linked from anywhere on the site. Requires the MetaMask browser extension.</p>

<script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"></script>
<script>
(function () {
  var RECIPIENT = '0xFcE78486AE65e006Dc0d235FDD5d1E9169D53B0C';

  var TOKENS = {
    btc: { ticker: '&#8383; BTC', chain: 'Bitcoin', qr: '/farshid/content/btc.svg',
      addr: 'bc1q922uu6uwu3x2grlkypeuyywet9msk2fzxypy6d',
      network: 'Bitcoin network &middot; native BTC &middot; bech32 (SegWit) address',
      warn: 'Send only on the Bitcoin network.', evm: false, sym: 'BTC' },
    eth: { ticker: '&#9874; ETH', chain: 'Ethereum', qr: '/farshid/content/eth.svg',
      addr: RECIPIENT,
      network: 'Ethereum mainnet &middot; native ETH &amp; ERC-20 tokens',
      warn: 'Send only on the Ethereum network (ERC-20).', evm: true, sym: 'ETH', chainId: '0x1' },
    sol: { ticker: '&#9670; SOL', chain: 'Solana', qr: '/farshid/content/sol.svg',
      addr: '4Ub6VYF69PdCjpCMWDysU54WPb1xB7s628ASkCuJmcib',
      network: 'Solana network &middot; native SOL &amp; SPL tokens',
      warn: 'Send only on the Solana network.', evm: false, sym: 'SOL' },
    base: { ticker: '&#9650; BASE', chain: 'Base', qr: '/farshid/content/base.svg',
      addr: RECIPIENT,
      network: 'Base L2 &middot; native ETH &amp; ERC-20 tokens',
      warn: 'Send only on the Base network &mdash; do NOT send on Ethereum mainnet.', evm: true, sym: 'ETH', chainId: '0x2105' },
    bnb: { ticker: '&#9679; BNB', chain: 'BNB Smart Chain', qr: '/farshid/content/bnb.svg',
      addr: RECIPIENT,
      network: 'BNB Smart Chain &middot; native BNB &amp; BEP-20 tokens',
      warn: 'Send only on BNB Smart Chain (BEP-20).', evm: true, sym: 'BNB', chainId: '0x38' }
  };
  var CHAINS = {
    '0x1': { name: 'Ethereum Mainnet', sym: 'ETH' },
    '0xaa36a7': { name: 'Sepolia Testnet', sym: 'ETH' },
    '0x2105': { name: 'Base', sym: 'ETH' },
    '0x38': { name: 'BNB Smart Chain', sym: 'BNB' },
    '0x89': { name: 'Polygon', sym: 'POL' },
    '0xa4b1': { name: 'Arbitrum One', sym: 'ETH' },
    '0xa': { name: 'Optimism', sym: 'ETH' }
  };
  var CHAIN_DETAILS = {
    eth: { chainId: '0x1', name: 'Ethereum Mainnet', symbol: 'ETH', rpc: 'https://eth.llamarpc.com' },
    base: { chainId: '0x2105', name: 'Base', symbol: 'ETH', rpc: 'https://mainnet.base.org' },
    bnb: { chainId: '0x38', name: 'BNB Smart Chain', symbol: 'BNB', rpc: 'https://bsc-dataseed.binance.org' }
  };
  var BALANCE_RPC = {
    eth: 'https://ethereum-rpc.publicnode.com',
    base: 'https://mainnet.base.org',
    bnb: 'https://bsc-dataseed.binance.org'
  };

  var tickerEl = document.getElementById('sel-ticker');
  var chainEl = document.getElementById('sel-chain');
  var networkEl = document.getElementById('sel-network');
  var liveEl = document.getElementById('sel-live');
  var qrImg = document.getElementById('sel-qr-img');
  var qrSvg = document.getElementById('sel-qr-svg');
  var addrEl = document.getElementById('sel-addr');
  var warnEl = document.getElementById('sel-warn');
  var copyBtn = document.getElementById('sel-copy');
  var pills = document.querySelectorAll('.token-pill');

  var connectBtn = document.getElementById('mm-connect-btn');
  var connectedBox = document.getElementById('mm-connected');
  var acctEl = document.getElementById('mm-acct');
  var balEl = document.getElementById('mm-bal');
  var disconnectBtn = document.getElementById('mm-disconnect');
  var errBox = document.getElementById('mm-err');

  var sendAmount = document.getElementById('send-amount');
  var sendSym = document.getElementById('send-sym');
  var sendBtn = document.getElementById('send-btn');
  var sendStatus = document.getElementById('send-status');
  var sendBalance = document.getElementById('send-balance');

  var connectedAccount = null;
  var current = 'eth';

  function showErr(msg) { errBox.textContent = msg; errBox.style.display = 'block'; }
  function clearErr() { errBox.style.display = 'none'; errBox.textContent = ''; }
  function short(a) { return a.slice(0, 6) + '&hellip;' + a.slice(-4); }

  function toWei(s, decimals) {
    decimals = decimals || 18;
    s = String(s).trim();
    var neg = s[0] === '-';
    if (neg) s = s.slice(1);
    var parts = s.split('.');
    if (parts.length > 2) throw new Error('bad amount');
    var whole = (parts[0] || '').replace(/[^0-9]/g, '') || '0';
    var frac = (parts[1] || '').replace(/[^0-9]/g, '').padEnd(decimals, '0').slice(0, decimals);
    var val = BigInt(whole) * (10n ** BigInt(decimals)) + BigInt(frac || '0');
    return neg ? -val : val;
  }

  function formatBalance(hexWei) {
    try {
      var wei = BigInt(hexWei);
      var whole = wei / (10n ** 18n);
      var frac = (wei % (10n ** 18n)).toString().padStart(18, '0').slice(0, 6).replace(/0+$/, '');
      return frac ? whole.toString() + '.' + frac : whole.toString();
    } catch (e) { return '0'; }
  }

  async function fetchBalance(account, rpc) {
    var resp = await fetch(rpc, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'eth_getBalance', params: [account, 'latest'] })
    });
    if (!resp.ok) throw new Error('rpc ' + resp.status);
    var data = await resp.json();
    if (data && data.error) throw new Error(data.error.message);
    return data.result;
  }

  async function refreshBalance() {
    var t = TOKENS[current];
    if (!connectedAccount) {
      sendBalance.textContent = 'Connect MetaMask to see your balance.';
      return;
    }
    if (!t.evm) {
      sendBalance.textContent = 'MetaMask can only read EVM wallets (ETH, BASE, BNB).';
      return;
    }
    var rpc = BALANCE_RPC[current];
    if (!rpc) { sendBalance.textContent = ''; return; }
    sendBalance.textContent = 'Loading balance…';
    try {
      var hex = await fetchBalance(connectedAccount, rpc);
      sendBalance.textContent = 'Your balance: ' + formatBalance(hex) + ' ' + t.sym + ' (' + t.chain + ')';
    } catch (e) {
      sendBalance.textContent = 'Balance unavailable on ' + t.chain + '.';
    }
  }

  function renderQR(text) {
    qrSvg.innerHTML = '';
    if (typeof qrcode === 'function') {
      try {
        var qr = qrcode(0, 'M');
        qr.addData(text);
        qr.make();
        qrSvg.innerHTML = qr.createSvgTag({ cellSize: 4, margin: 0 });
      } catch (e) { /* leave empty */ }
    }
  }

  function display() {
    var t = TOKENS[current];
    tickerEl.innerHTML = t.ticker;
    chainEl.textContent = t.chain;
    networkEl.innerHTML = t.network;
    warnEl.innerHTML = t.warn;
    sendSym.textContent = t.sym;
    var useLive = t.evm && connectedAccount;
    var addr = useLive ? connectedAccount : t.addr;
    addrEl.textContent = addr;
    if (useLive) {
      liveEl.style.display = 'block';
      qrImg.style.display = 'none';
      qrSvg.style.display = 'block';
      renderQR(addr);
    } else {
      liveEl.style.display = 'none';
      qrSvg.style.display = 'none';
      qrImg.style.display = 'block';
      qrImg.src = t.qr;
      qrImg.alt = t.chain + ' QR code';
    }
    copyBtn.classList.remove('copied');
    copyBtn.textContent = 'Copy address';
    pills.forEach(function (p) { p.classList.toggle('active', p.getAttribute('data-token') === current); });
    updateSendState();
    refreshBalance();
  }

  function updateSendState() {
    var t = TOKENS[current];
    if (!connectedAccount) {
      sendBtn.disabled = true;
      sendStatus.textContent = 'Connect MetaMask to enable sending.';
      sendStatus.className = 'send-status';
      return;
    }
    if (!t.evm) {
      sendBtn.disabled = true;
      sendStatus.textContent = 'MetaMask can only send EVM tokens (ETH, BASE, BNB).';
      sendStatus.className = 'send-status';
      return;
    }
    sendBtn.disabled = false;
    sendStatus.textContent = 'Sends ' + t.sym + ' to ' + short(RECIPIENT) + ' (' + t.chain + ').';
    sendStatus.className = 'send-status';
  }

  function select(token) { current = token; display(); }
  pills.forEach(function (p) {
    p.addEventListener('click', function () { select(p.getAttribute('data-token')); });
  });

  async function refreshLive() {
    if (!connectedAccount) return;
    try {
      var chainId = await window.ethereum.request({ method: 'eth_chainId' });
      var c = CHAINS[chainId] || { name: chainId, sym: '' };
      var bal = await window.ethereum.request({ method: 'eth_getBalance', params: [connectedAccount, 'latest'] });
      acctEl.textContent = short(connectedAccount);
      balEl.textContent = (parseInt(bal, 16) / 1e18).toFixed(4) + (c.sym ? ' ' + c.sym : '') + '  ·  ' + c.name;
    } catch (e) {
      balEl.textContent = '';
    }
  }

  async function connect() {
    if (typeof window.ethereum === 'undefined') {
      showErr('MetaMask not detected. Please install the MetaMask extension and reload.');
      return;
    }
    clearErr();
    try {
      var accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) throw new Error('No account returned.');
      connectedAccount = accounts[0];
      connectBtn.style.display = 'none';
      connectedBox.style.display = 'flex';
      await refreshLive();
      display();
    } catch (e) {
      if (e && e.code === 4001) showErr('Connection request rejected.');
      else showErr((e && e.message) || 'Failed to connect.');
    }
  }

  async function disconnect() {
    connectedAccount = null;
    connectBtn.style.display = 'inline-block';
    connectedBox.style.display = 'none';
    acctEl.textContent = '';
    balEl.textContent = '';
    display();
    if (typeof window.ethereum !== 'undefined' && window.ethereum.request) {
      try {
        await window.ethereum.request({ method: 'wallet_revokePermissions', params: [{ eth_accounts: {} }] });
      } catch (e) { /* not supported everywhere — local state is already cleared */ }
    }
  }

  async function ensureChain(token) {
    var detail = CHAIN_DETAILS[token];
    if (!detail) return true;
    var currentChain = await window.ethereum.request({ method: 'eth_chainId' });
    if (currentChain === detail.chainId) return true;
    try {
      await window.ethereum.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: detail.chainId }] });
    } catch (switchErr) {
      if (switchErr && switchErr.code === 4902) {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: detail.chainId,
            chainName: detail.name,
            rpcUrls: [detail.rpc],
            nativeCurrency: { name: detail.symbol, symbol: detail.symbol, decimals: 18 }
          }]
        });
      } else {
        throw switchErr;
      }
    }
  }

  async function send() {
    var t = TOKENS[current];
    if (!connectedAccount) { sendStatus.textContent = 'Connect MetaMask first.'; sendStatus.className = 'send-status err'; return; }
    if (!t.evm) { sendStatus.textContent = 'MetaMask can only send EVM tokens (ETH, BASE, BNB).'; sendStatus.className = 'send-status err'; return; }
    var amountStr = sendAmount.value.trim();
    var wei;
    try { wei = toWei(amountStr, 18); } catch (e) { wei = 0n; }
    if (!amountStr || wei <= 0n) {
      sendStatus.textContent = 'Enter a valid amount greater than zero.';
      sendStatus.className = 'send-status err';
      return;
    }
    sendBtn.disabled = true;
    sendStatus.textContent = 'Switching network & requesting confirmation…';
    sendStatus.className = 'send-status pending';
    try {
      await ensureChain(current);
      sendStatus.textContent = 'Confirm the transaction in MetaMask…';
      var txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{ from: connectedAccount, to: RECIPIENT, value: '0x' + wei.toString(16) }]
      });
      sendStatus.textContent = 'Sent! Tx: ' + txHash;
      sendStatus.className = 'send-status ok';
      sendAmount.value = '';
      refreshLive();
      refreshBalance();
    } catch (e) {
      if (e && e.code === 4001) { sendStatus.textContent = 'Transaction rejected.'; sendStatus.className = 'send-status err'; }
      else { sendStatus.textContent = (e && e.message) || 'Send failed.'; sendStatus.className = 'send-status err'; }
    } finally {
      sendBtn.disabled = false;
    }
  }

  connectBtn.addEventListener('click', connect);
  disconnectBtn.addEventListener('click', disconnect);
  sendBtn.addEventListener('click', send);

  copyBtn.addEventListener('click', function () {
    var addr = addrEl.textContent;
    var onDone = function () {
      copyBtn.textContent = 'Copied!';
      copyBtn.classList.add('copied');
      setTimeout(function () { copyBtn.textContent = 'Copy address'; copyBtn.classList.remove('copied'); }, 1800);
    };
    function fallbackCopy(text, done) {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) { done(); }
      document.body.removeChild(ta);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(addr).then(onDone, function () { fallbackCopy(addr, onDone); });
    } else {
      fallbackCopy(addr, onDone);
    }
  });

  if (typeof window.ethereum !== 'undefined') {
    window.ethereum.on('accountsChanged', function (accounts) {
      if (!accounts || accounts.length === 0) disconnect();
      else { connectedAccount = accounts[0]; refreshLive(); display(); }
    });
    window.ethereum.on('chainChanged', function () { refreshLive(); display(); });
  }

  display();
})();
</script>
