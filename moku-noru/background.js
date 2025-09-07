// background.js
let appWindowId = null;

async function openOrFocusAppWindow() {
  if (appWindowId !== null) {
    try {
      await chrome.windows.update(appWindowId, { focused: true });
      return;
    } catch (_) {
      appWindowId = null;
    }
  }

  const w = await chrome.windows.create({
    url: chrome.runtime.getURL("popup.html"),
    type: "popup",
    width: 420,
    height: 640,
    focused: true
  });

  appWindowId = w.id;
}

chrome.action.onClicked.addListener(() => {
  openOrFocusAppWindow();
});

chrome.windows.onRemoved.addListener((closedId) => {
  if (closedId === appWindowId) {
    appWindowId = null;
  }
});