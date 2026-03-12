// Only run if tab is visible

let blockedWordsEnabled = true;
let blockedFacesEnabled = true;
let reinitializeTimeout;

// Global state accessible to all modules
/** @ts-ignore */
window.scannedImages = new Set();
window.cachedBlockedWords = [];
window.cachedWhitelistedUrls = [];
window.cachedBlurAmount = 20; // Default blur amount

async function initializeBlocking() {
  // Check if extension is globally enabled
  const { extensionEnabled } = await browser.storage.local.get("extensionEnabled");
  if (extensionEnabled === false) {
    console.log("Extension is disabled");
    return;
  }

  // Fetch all settings at once
  const result = await browser.storage.local.get(["blockedWordsEnabled", "blockedFacesEnabled", "blockedWords", "whitelistedUrls", "blurAmount"]);
  
  // Cache everything first
  blockedWordsEnabled = result.blockedWordsEnabled !== false;
  blockedFacesEnabled = result.blockedFacesEnabled !== false;
  window.cachedBlockedWords = result.blockedWords || [];
  window.cachedWhitelistedUrls = result.whitelistedUrls || [];
  window.cachedBlurAmount = result.blurAmount || 20;
  
  // Check whitelist using the module function
  const urlWhitelisted = isUrlWhitelisted();
  
  if (urlWhitelisted) {
    console.log("URL is whitelisted, extension disabled on this site");
    return;
  }

  // Only block words if enabled
  if (blockedWordsEnabled) {
    blockTextContent();
    startObserver(blockedFacesEnabled);
  }

  // Only scan images for faces if faces module is enabled
  if (blockedFacesEnabled && !blockedWordsEnabled) {
    scanImages();
    startObserver(true);
  }
}

// Listen for toggle changes from options page
browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local") {
    if (changes.blockedWordsEnabled || changes.blockedFacesEnabled || changes.whitelistedUrls || changes.blurAmount || changes.extensionEnabled) {
      clearTimeout(reinitializeTimeout);
      reinitializeTimeout = setTimeout(()=> {
        console.log("Toggle state changed, reinitializing...");
        // Clear previous blur styles
        document.querySelectorAll("[style*='blur']").forEach(el => {
          el.style.filter = "";
        });
        /** @ts-ignore */
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

// ============================================
// Load site-specific overrides
// ============================================

function loadOverrides() {
  const overridePath = browser.runtime.getURL("modules/overrides/");
  const overrides = [
    "youtube-override.js"
    // Add more overrides here as needed
  ];

  overrides.forEach(override => {
    const script = document.createElement("script");
    script.src = overridePath + override;
    script.onload = () => {
      console.log(`Loaded override: ${override}`);
    };
    script.onerror = () => {
      console.warn(`Failed to load override: ${override}`);
    };
    document.documentElement.appendChild(script);
  });
}

// Load overrides after a short delay to ensure base modules are loaded
setTimeout(loadOverrides, 100);