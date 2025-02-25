// Remember the last element the user right-clicked on (e.g., the speaker icon)
let lastRightClickedElement = null;

document.addEventListener("contextmenu", (event) => {
  lastRightClickedElement = event.target;
});

// Receive messages from background.js and simulate a left click on the remembered element
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "simulateClick") {
    if (lastRightClickedElement) {
      lastRightClickedElement.dispatchEvent(new MouseEvent("click", {
        bubbles: true,
        cancelable: true,
        button: 0
      }));
      console.log("Simulated left click on:", lastRightClickedElement);
      sendResponse({ status: "Click simulated" });
    } else {
      console.warn("No remembered element to click.");
      sendResponse({ status: "No element" });
    }
    return true;
  }
});
