// ============================================================
// VidRevamp Extension — Popup Script
// ============================================================

const platformNames = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
};

// Elements
const platformNameEl = document.getElementById('platform-name');
const platformDotEl  = document.getElementById('platform-dot');
const videoCountEl   = document.getElementById('video-count');
const sortBtn        = document.getElementById('sort-btn');
const vaultListEl    = document.getElementById('vault-items-list');
const vaultCountEl   = document.getElementById('vault-count');

// ── Query active tab for page info ─────────────────────
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs[0];
  if (!tab?.id) return;

  chrome.tabs.sendMessage(tab.id, { action: 'getPageInfo' }, (response) => {
    if (chrome.runtime.lastError || !response) {
      platformNameEl.textContent = 'Not a supported page';
      platformDotEl.style.background = '#ef4444';
      return;
    }

    const { platform, videoCount, hasViews } = response;
    platformNameEl.textContent = platformNames[platform] || 'Unknown';
    platformDotEl.style.background = platform ? '#10b981' : '#ef4444';

    if (videoCount > 0) {
      videoCountEl.textContent = `${videoCount} videos detected`;
      sortBtn.disabled = false;
    } else {
      videoCountEl.textContent = 'No videos found yet';
      sortBtn.disabled = false; // still allow attempt
    }
  });
});

// ── Sort button ────────────────────────────────────────
sortBtn.addEventListener('click', () => {
  sortBtn.textContent = 'Sorting…';
  sortBtn.disabled = true;

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tabId = tabs[0]?.id;
    if (!tabId) return;

    chrome.tabs.sendMessage(tabId, { action: 'sort' }, (response) => {
      if (chrome.runtime.lastError || !response?.success) {
        sortBtn.textContent = 'Could not sort — try scrolling first';
      } else {
        sortBtn.textContent = '✓ Sorted!';
      }
      sortBtn.disabled = false;
      setTimeout(() => { sortBtn.textContent = '↓ Sort by Views'; }, 2500);
    });
  });
});

// ── Load vault items from storage ─────────────────────
chrome.storage.local.get(['vaultItems'], (result) => {
  const items = result.vaultItems || [];
  vaultCountEl.textContent = String(items.length);

  if (items.length === 0) return;

  // Clear placeholder
  vaultListEl.textContent = '';

  // Show most recent 3
  items.slice(0, 3).forEach((item) => {
    const row = document.createElement('div');
    row.className = 'vault-item';

    const badge = document.createElement('span');
    badge.className = `vault-type ${item.type === 'HOOK' ? 'hook' : 'style'}`;
    badge.textContent = item.type;

    const text = document.createElement('span');
    text.className = 'vault-item-text';
    // Safely set text content (no XSS risk)
    text.textContent = item.content.length > 80
      ? item.content.slice(0, 80) + '…'
      : item.content;

    row.appendChild(badge);
    row.appendChild(text);
    vaultListEl.appendChild(row);
  });
});
