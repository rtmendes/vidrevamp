// ============================================================
// VidRevamp Extension — Service Worker (Background)
// Handles message passing and storage between popup + content
// ============================================================

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.set({
    vidrevampUrl: 'http://localhost:3001',
    sortEnabled: false,
    vaultItems: [],
  });
});

// Relay messages from popup to active content script tab
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target === 'content') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tabId = tabs[0]?.id;
      if (tabId) {
        chrome.tabs.sendMessage(tabId, message, sendResponse);
      }
    });
    return true; // keep channel open for async response
  }

  if (message.action === 'saveToVault') {
    chrome.storage.local.get(['vaultItems'], (result) => {
      const items = result.vaultItems || [];
      items.unshift({
        id: Date.now().toString(),
        type: message.itemType,
        content: message.content,
        tags: message.tags || [],
        savedAt: new Date().toISOString(),
        sourceUrl: message.sourceUrl,
      });
      chrome.storage.local.set({ vaultItems: items }, () => {
        sendResponse({ success: true, count: items.length });
      });
    });
    return true;
  }
});
