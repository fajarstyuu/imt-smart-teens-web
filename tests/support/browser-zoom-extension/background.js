// Start the permission-free MV3 worker; Playwright evaluates native tabs zoom
// calls in this extension context, never in application scripts or CSS.
chrome.runtime.onInstalled.addListener(() => {});
