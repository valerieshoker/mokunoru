// background.js

chrome.runtime.onInstalled.addListener(() => {
    console.log("Moku Noru Extension Installed!");
  });
  
  // Listen for the message to start the Pomodoro timer
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message === "startFocus") {
      // Mute all tabs when Pomodoro starts
      chrome.tabs.query({}, (tabs) => {
        tabs.forEach((tab) => {
          chrome.tabs.update(tab.id, { muted: true });
        });
      });
      sendResponse({ status: "Started focus mode" });
    }
    return true; // Keep the message channel open for async response
  });
  