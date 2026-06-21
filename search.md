---
layout: farshid_default
title: Search
---

<style>
  .google-search-box {
    max-width: 600px;
    margin: 2rem auto;
    text-align: center;
  }
  .google-search-box input {
    width: 100%;
    padding: 14px 20px;
    font-size: 16px;
    border: 1px solid rgba(255,255,255,0.3);
    border-radius: 12px;
    background: rgba(255,255,255,0.15);
    color: var(--text);
    outline: none;
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    box-sizing: border-box;
  }
  .google-search-box input::placeholder { color: var(--text-muted); }
  .google-search-box input:focus { border-color: var(--accent); }
  .google-search-box button {
    margin-top: 12px;
    padding: 12px 32px;
    font-size: 15px;
    background: #3a7a3a;
    color: white;
    border: none;
    border-radius: 10px;
    cursor: pointer;
    font-weight: 600;
  }
  .google-search-box button:hover { background: #2d6a2d; }
  .search-note { color: var(--text-muted); font-size: 0.85em; margin-top: 1rem; text-align: center; }
</style>

<div class="google-search-box">
  <h2>Search this site</h2>
  <form onsubmit="googleSearch(event)">
    <input type="text" id="search-input" placeholder="Search www.pirahansiah.com..." autofocus>
    <br>
    <button type="submit">Search</button>
  </form>
  <p class="search-note">Powered by Google</p>
</div>

<script>
function googleSearch(e) {
  e.preventDefault();
  var q = document.getElementById("search-input").value.trim();
  if (q) {
    window.location.href = "https://www.google.com/search?q=site:www.pirahansiah.com+" + encodeURIComponent(q);
  }
}
</script>
