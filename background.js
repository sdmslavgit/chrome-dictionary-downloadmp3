let observing = false;
let observedMp3Urls = [];
let observationTimeout = null;

// Helper function to extract page name – removes URL fragment (part after '#' and parameters)
function extractPageName(url) {
  let cleanUrl = url.split('#')[0];
  let name = cleanUrl.substring(cleanUrl.lastIndexOf('/') + 1).split('?')[0];
  return name || "download";
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "simulateLeftClick",
    title: "Download mp3 – Simulate click",
    contexts: ["all"]
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "simulateLeftClick") {
    // Get the page name (active tab address)
    let pageName = tab.url ? extractPageName(tab.url) : "download";

    // correction for forvo
    if (tab.url.includes("forvo.com")) {
      let match = tab.url.match(/search\/([^\/]+)/);
      if (match && match[1]) {
        pageName = decodeURIComponent(match[1].replace(/%20/g, ""));
      }

      match = tab.url.match(/word\/([^\/]+)/);
      if (match && match[1]) {
        pageName = decodeURIComponent(match[1].replace(/%2C/g, "").replace(/%E2%80%99/g, "").replace(/\./g, "").replace(/%20/g, "_"));
      }
    }
  
    // Send a message to the content script to simulate a left click
    chrome.tabs.sendMessage(tab.id, { action: "simulateClick" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error sending message:", chrome.runtime.lastError.message);
      } else if (!response) {
        console.warn("No response from content script.");
      } else {
        console.log("Message sent successfully:", response);
      }
    });

    // Start observing MP3 requests for 2 seconds
    observing = true;
    observedMp3Urls = [];
    if (observationTimeout) clearTimeout(observationTimeout);
    observationTimeout = setTimeout(() => {
      observing = false;
      console.log("Observed MP3s within 2 seconds:", observedMp3Urls);

      // For each URL, download the file with a name based on the page address.
      // If only one file is registered, do not add an index.
      observedMp3Urls.forEach((url, index, arr) => {
        let filename = pageName;

        // correction for multiple files
        if (arr.length > 1) {
          filename = filename + "_" + index;
        }

        filename = filename + ".mp3";

        chrome.downloads.download({
          url: url,
          filename: filename,
          saveAs: true
        }, (downloadId) => {
          if (chrome.runtime.lastError) {
            console.error("Download error:", chrome.runtime.lastError.message);
          } else if (!downloadId) {
            console.error("Download error: downloadId is undefined or null.");
          } else {
            console.log("Download started, id:", downloadId);
          }
        });
      });
    }, 2000);
  }
});
// Listen for completed HTTP requests from any domain
chrome.webRequest.onCompleted.addListener(
  (details) => {
    if (observing && details.url && details.url.includes(".mp3")) {
      observedMp3Urls.push(details.url);
      console.log("Observed MP3:", details.url);
    }
  },
  { urls: ["*://*/*"] }
);
