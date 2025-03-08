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
    let pageName = tab.url ? extractPageName(tab.url) : "download";

    // Specjalne traktowanie dla diki.pl
    let isDiki = tab.url.includes("diki.pl");

    // Wysłanie wiadomości do content.js do kliknięcia na ostatni element
    chrome.tabs.sendMessage(tab.id, { action: "simulateClick" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error sending message:", chrome.runtime.lastError.message);
      } else if (!response) {
        console.warn("No response from content script.");
      } else {
        console.log("Message sent successfully:", response);
      }
    });

    observing = true;
    observedMp3Urls = [];
    if (observationTimeout) clearTimeout(observationTimeout);
    observationTimeout = setTimeout(() => {
      observing = false;
      console.log("Observed MP3s within 2 seconds:", observedMp3Urls);

      observedMp3Urls.forEach((url, index, arr) => {
        let filename;

        if (isDiki) {
          // Pobranie nazwy pliku z URL
          let urlParts = url.split("/");
          filename = urlParts[urlParts.length - 1]; // Ostatnia część URL jako nazwa pliku
        } else {
          // Standardowy mechanizm
          filename = pageName;
          if (arr.length > 1) {
            filename = filename + "_" + index;
          }
          filename = filename + ".mp3";
        }

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
