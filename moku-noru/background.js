// background.js

chrome.runtime.onInstalled.addListener(() => {
  console.log("Moku Noru Extension Installed!");
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
