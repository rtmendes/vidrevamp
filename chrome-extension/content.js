// ============================================================
// VidRevamp Extension — Content Script
// Injected into Instagram, TikTok, YouTube pages
//
// Core features:
// 1. Sort feed posts/reels by view count (SortFeed clone)
// 2. Inject outlier score badges on video cards
// 3. Inject "Save to Vault" buttons on hover
// ============================================================

(function () {
  'use strict';

  let platform = detectPlatform();

  // ── Platform Detection ─────────────────────────────────
  function detectPlatform() {
    const host = window.location.hostname;
    if (host.includes('instagram.com')) return 'instagram';
    if (host.includes('tiktok.com')) return 'tiktok';
    if (host.includes('youtube.com')) return 'youtube';
    return null;
  }

  // ── View Count Parsers ─────────────────────────────────
  function parseViewCount(text) {
    if (!text) return 0;
    const cleaned = text.replace(/,/g, '').trim().toUpperCase();
    if (cleaned.endsWith('M')) return parseFloat(cleaned) * 1_000_000;
    if (cleaned.endsWith('K')) return parseFloat(cleaned) * 1_000;
    if (cleaned.endsWith('B')) return parseFloat(cleaned) * 1_000_000_000;
    return parseInt(cleaned) || 0;
  }

  function formatViews(n) {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000) return (n / 1_000).toFixed(0) + 'K';
    return n.toString();
  }

  // ── Outlier Score Calculator ──────────────────────────
  function calculateOutlierScore(views, allViews) {
    if (allViews.length < 2) return 1.0;
    const sorted = [...allViews].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
    if (median === 0) return 1.0;
    return Math.round((views / median) * 10) / 10;
  }

  function getOutlierColor(score) {
    if (score >= 8) return '#10b981';
    if (score >= 3) return '#f59e0b';
    return '#6b7280';
  }

  // ── Platform Selectors & Extractors ──────────────────
  const PLATFORM_CONFIG = {
    instagram: {
      selector: '[data-testid="media-gallery-item"], article, div[role="button"]',
      extractViews(card) {
        const spans = card.querySelectorAll('span');
        for (const span of spans) {
          const text = span.textContent?.trim() ?? '';
          if (/^\d[\d,.]*[KMB]?$/.test(text)) {
            const v = parseViewCount(text);
            if (v > 100) return v;
          }
        }
        const aria = card.getAttribute('aria-label') ?? '';
        const m = aria.match(/([\d,.]+\s*[KMBk]?)\s*(views|plays)/i);
        return m ? parseViewCount(m[1]) : 0;
      },
    },
    tiktok: {
      selector: '[data-e2e="user-post-item"]',
      extractViews(card) {
        const el = card.querySelector('[data-e2e="video-views"], strong');
        if (el) return parseViewCount(el.textContent ?? '');
        const spans = card.querySelectorAll('strong, span');
        for (const s of spans) {
          const text = s.textContent?.trim() ?? '';
          if (/^\d[\d,.]*[KMB]?$/i.test(text)) {
            const v = parseViewCount(text);
            if (v > 100) return v;
          }
        }
        return 0;
      },
    },
    youtube: {
      selector: 'ytd-rich-item-renderer, ytd-video-renderer, ytd-grid-video-renderer',
      extractViews(card) {
        const meta = card.querySelector('#metadata-line span, .ytd-video-meta-block span');
        if (meta) {
          const m = (meta.textContent ?? '').match(/([\d,.]+[KMB]?)\s+views/i);
          if (m) return parseViewCount(m[1]);
        }
        return 0;
      },
    },
  };

  // ── Build SVG icon safely ─────────────────────────────
  function makeSvgIcon(path, size = 12) {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', String(size));
    svg.setAttribute('height', String(size));
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2.5');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    el.setAttribute('d', path);
    svg.appendChild(el);
    return svg;
  }

  // ── Outlier Badge ─────────────────────────────────────
  function injectOutlierBadge(card, score, views) {
    card.querySelector('.sc-outlier-badge')?.remove();

    const badge = document.createElement('div');
    badge.className = 'sc-outlier-badge';
    const color = getOutlierColor(score);

    Object.assign(badge.style, {
      position: 'absolute',
      top: '8px',
      right: '8px',
      zIndex: '999',
      background: 'rgba(0,0,0,0.85)',
      border: `1px solid ${color}40`,
      color,
      fontSize: '11px',
      fontWeight: '700',
      padding: '3px 7px',
      borderRadius: '20px',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      pointerEvents: 'none',
      backdropFilter: 'blur(8px)',
    });

    badge.appendChild(makeSvgIcon('M23 6L13.5 15.5 8.5 10.5 1 18M17 6h6v6', 10));

    const label = document.createElement('span');
    label.textContent = `${score}x`;
    badge.appendChild(label);
    badge.title = `Outlier Score: ${score}x vs median | ${formatViews(views)} views`;

    if (getComputedStyle(card).position === 'static') card.style.position = 'relative';
    card.appendChild(badge);
  }

  // ── Save to Vault Button ──────────────────────────────
  function injectSaveButton(card) {
    card.querySelector('.sc-save-btn')?.remove();

    const btn = document.createElement('button');
    btn.className = 'sc-save-btn';

    Object.assign(btn.style, {
      position: 'absolute',
      bottom: '8px',
      right: '8px',
      zIndex: '999',
      background: 'rgba(139, 92, 246, 0.9)',
      color: 'white',
      fontSize: '11px',
      fontWeight: '600',
      padding: '4px 9px',
      borderRadius: '20px',
      border: 'none',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      opacity: '0',
      transition: 'opacity 0.15s ease',
      backdropFilter: 'blur(8px)',
    });

    btn.appendChild(makeSvgIcon('M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z', 12));
    const btnLabel = document.createElement('span');
    btnLabel.textContent = 'Save Hook';
    btn.appendChild(btnLabel);

    card.addEventListener('mouseenter', () => { btn.style.opacity = '1'; });
    card.addEventListener('mouseleave', () => { btn.style.opacity = '0'; });

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const link = card.querySelector('a');
      const sourceUrl = link?.href || window.location.href;

      chrome.runtime.sendMessage(
        { action: 'saveToVault', itemType: 'HOOK', content: sourceUrl, tags: [platform ?? 'web', 'extension'], sourceUrl },
        (response) => {
          if (response?.success) {
            btnLabel.textContent = '✓ Saved!';
            btn.style.background = 'rgba(16, 185, 129, 0.9)';
            setTimeout(() => {
              btnLabel.textContent = 'Save Hook';
              btn.style.background = 'rgba(139, 92, 246, 0.9)';
            }, 2000);
          }
        }
      );
    });

    if (getComputedStyle(card).position === 'static') card.style.position = 'relative';
    card.appendChild(btn);
  }

  // ── Toast Notification ────────────────────────────────
  function showToast(message) {
    document.querySelector('.sc-toast')?.remove();

    const toast = document.createElement('div');
    toast.className = 'sc-toast';
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: '99999',
      background: 'rgba(0,0,0,0.92)',
      color: '#e4e4e7',
      fontSize: '13px',
      fontWeight: '500',
      padding: '10px 20px',
      borderRadius: '100px',
      border: '1px solid rgba(139, 92, 246, 0.4)',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
    });

    toast.appendChild(makeSvgIcon('M13 2L3 14h9l-1 8 10-12h-9l1-8z', 14));
    const msg = document.createElement('span');
    msg.textContent = message;
    toast.appendChild(msg);
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }

  // ── Sort Feed ─────────────────────────────────────────
  function sortFeedByViews() {
    if (!platform) return;
    const config = PLATFORM_CONFIG[platform];
    if (!config) return;

    const cards = Array.from(document.querySelectorAll(config.selector));
    if (cards.length < 2) {
      showToast('Not enough videos found — try scrolling to load more.');
      return;
    }

    const cardsWithViews = cards.map((card) => ({ card, views: config.extractViews(card) }));
    const allViews = cardsWithViews.map((c) => c.views).filter((v) => v > 0);
    cardsWithViews.sort((a, b) => b.views - a.views);

    const container = cards[0]?.parentElement;
    if (!container) return;

    cardsWithViews.forEach(({ card, views }) => {
      if (views > 0) {
        injectOutlierBadge(card, calculateOutlierScore(views, allViews), views);
      }
      injectSaveButton(card);
      container.appendChild(card);
    });

    showToast(`Sorted ${cardsWithViews.length} videos by views`);
  }

  // ── Floating Side Bar ─────────────────────────────────
  function injectFloatingBar() {
    if (document.querySelector('.sc-floating-bar') || !platform) return;

    const bar = document.createElement('div');
    bar.className = 'sc-floating-bar';
    Object.assign(bar.style, {
      position: 'fixed',
      top: '50%',
      right: '16px',
      transform: 'translateY(-50%)',
      zIndex: '99998',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
    });

    const panel = document.createElement('div');
    Object.assign(panel.style, {
      background: 'rgba(0,0,0,0.90)',
      border: '1px solid rgba(139, 92, 246, 0.4)',
      borderRadius: '12px',
      padding: '10px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '8px',
      backdropFilter: 'blur(12px)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      minWidth: '110px',
    });

    // Logo row
    const logoRow = document.createElement('div');
    Object.assign(logoRow.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      paddingBottom: '8px',
      borderBottom: '1px solid rgba(255,255,255,0.08)',
      width: '100%',
    });
    const logoIcon = document.createElement('div');
    Object.assign(logoIcon.style, {
      width: '22px',
      height: '22px',
      borderRadius: '6px',
      background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    });
    logoIcon.appendChild(makeSvgIcon('M13 2L3 14h9l-1 8 10-12h-9l1-8z', 12));
    const logoText = document.createElement('span');
    logoText.textContent = 'VidRevamp';
    Object.assign(logoText.style, { color: '#e4e4e7', fontSize: '11px', fontWeight: '700' });
    logoRow.appendChild(logoIcon);
    logoRow.appendChild(logoText);
    panel.appendChild(logoRow);

    // Sort button
    const sortBtn = document.createElement('button');
    sortBtn.textContent = '↓ Sort by Views';
    Object.assign(sortBtn.style, {
      width: '100%',
      background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
      color: 'white',
      fontSize: '11px',
      fontWeight: '700',
      padding: '7px 10px',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
    });
    sortBtn.addEventListener('click', sortFeedByViews);
    panel.appendChild(sortBtn);

    // Platform label
    const platformLabel = document.createElement('div');
    platformLabel.textContent = platform.toUpperCase();
    Object.assign(platformLabel.style, { color: '#71717a', fontSize: '10px', textAlign: 'center' });
    panel.appendChild(platformLabel);

    // Vault link
    const vaultLink = document.createElement('a');
    vaultLink.href = 'http://localhost:3001/dashboard/vault';
    vaultLink.target = '_blank';
    vaultLink.rel = 'noopener noreferrer';
    vaultLink.textContent = 'Open Vault →';
    Object.assign(vaultLink.style, {
      width: '100%',
      color: '#a78bfa',
      fontSize: '10px',
      fontWeight: '600',
      padding: '5px',
      borderRadius: '6px',
      border: '1px solid rgba(139, 92, 246, 0.3)',
      textAlign: 'center',
      textDecoration: 'none',
      display: 'block',
    });
    panel.appendChild(vaultLink);

    bar.appendChild(panel);
    document.body.appendChild(bar);
  }

  // ── Message Listener (from popup) ────────────────────
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message.action === 'sort') {
      sortFeedByViews();
      sendResponse({ success: true, platform });
    }
    if (message.action === 'getPageInfo') {
      const config = platform ? PLATFORM_CONFIG[platform] : null;
      const cards = config ? Array.from(document.querySelectorAll(config.selector)) : [];
      const views = cards.map((c) => config?.extractViews(c) ?? 0);
      sendResponse({ platform, url: window.location.href, videoCount: cards.length, hasViews: views.some((v) => v > 0) });
    }
    if (message.action === 'injectBar') {
      injectFloatingBar();
      sendResponse({ success: true });
    }
    return true;
  });

  // ── Auto-init ─────────────────────────────────────────
  if (platform) injectFloatingBar();

})();
