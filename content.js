// Only run if tab is visible

let blockedWordsEnabled = true;
let blockedFacesEnabled = true;
let reinitializeTimeout;

window.scannedImages = new Set();

function initializeBlocking() {
  browser.storage.local.get(["blockedWordsEnabled", "blockedFacesEnabled"]).then((result) => {
    blockedWordsEnabled = result.blockedWordsEnabled !== false;
    blockedFacesEnabled = result.blockedFacesEnabled !== false;

    // Only block words if enabled
    if (blockedWordsEnabled) {
      blockTextContent();
      startObserver(blockedFacesEnabled); // Start observer, pass whether faces are enabled
    }

    // Only scan images for faces if faces module is enabled
    if (blockedFacesEnabled && !blockedWordsEnabled) {
      scanImages();
      startObserver(true);
    }
  });
}

// Listen for toggle changes from options page
browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local") {
    if (changes.blockedWordsEnabled || changes.blockedFacesEnabled) {
      clearTimeout(reinitializeTimeout);
      reinitializeTimeout = setTimeout(()=> {
        console.log("Toggle state changed, reinitializing...");
        // Clear previous blur styles
        document.querySelectorAll("[style*='blur']").forEach(el => {
          el.style.filter = "";
        });
        window.scannedImages.clear();
        stopObserver();
        initializeBlocking();
      }, 300);
    }
  }
});

// Initialize on page load if visible
if (document.visibilityState === "visible") {
  initializeBlocking();
} else {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && !observer) {
      initializeBlocking();
    } else if (document.visibilityState === "hidden") {
      stopObserver();
    }
  }, { once: false });
}