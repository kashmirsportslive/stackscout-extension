// StackScout MV3 Service Worker
// Ephemeral by design: all user state is stored in chrome.storage.local

chrome.runtime.onInstalled.addListener(async () => {
  try {
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
    const existing = await chrome.storage.local.get(["apiKey"]);
    if (!existing.apiKey) {
      await chrome.storage.local.set({ apiKey: "demo_free_key" });
    }
  } catch (err) {
    console.error("[StackScout] onInstalled error:", err);
  }
});

// Ensure panel behavior is also set on browser startup
chrome.runtime.onStartup.addListener(async () => {
  try {
    await chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  } catch (err) {
    console.error("[StackScout] onStartup error:", err);
  }
});
