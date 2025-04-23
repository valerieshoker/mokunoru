// background.js

chrome.runtime.onInstalled.addListener(() => {
  console.log("Moku Noru Extension Installed!");
});

// Open popup.html in a new floating window when the icon is clicked
chrome.action.onClicked.addListener(() => {
  chrome.windows.create({
    url: chrome.runtime.getURL("popup.html"),
    type: "popup",
    width: 300,
    height: 500,
    focused: true
  });
});

// Handle messages like muting tabs during Pomodoro
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message === "startFocus") {
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        chrome.tabs.update(tab.id, { muted: true });
      });
    });
    sendResponse({ status: "Started focus mode" });
  }
  return true;
});

chrome.windows.create({
  url: chrome.runtime.getURL("popup.html"),
  type: "popup",
  width: 300,
  height: 500, 
  focused: true
});

