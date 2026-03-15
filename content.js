// Only run if tab is visible

let blockedWordsEnabled = true;
let blockedFacesEnabled = true;
let reinitializeTimeout;
let pageScriptsReady = false;

/** @ts-ignore */
window.scannedImages = new Set();
window.cachedBlockedWords = [];
window.cachedWhitelistedUrls = [];

console.log("✅ content.js loaded");

// Set up message listener BEFORE injecting script
window.addEventListener("message", async (event) => {
  if (event.source !== window) return;
  
  // Debug: log all messages
  if (event.data.type === "blocked-faces-ready") {
    console.log("✅ Received blocked-faces-ready message");
    pageScriptsReady = true;
    return;
  }
  
  // Handle embedding request from page script
  if (event.data.type === "request-embedding") {
    const { src } = event.data;
    console.log("📨 Embedding request for:", src.substring(0, 50));
    
    try {
      const response = await fetch(src, { mode: 'no-cors' });
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onload = (e) => {
        browser.runtime.sendMessage(
          { type: "process-image", imageData: e.target.result, src: src },
          (response) => {
            window.postMessage({
              type: "embedding-response",
              block: response ? response.block : false,
              src: src
            }, "*");
          }
        );
      };
      
      reader.onerror = () => {
        console.warn("⚠️ Failed to read image blob:", src);
        window.postMessage({
          type: "embedding-response",
          block: false,
          src: src
        }, "*");
      };
      
      reader.readAsDataURL(blob);
    } catch (error) {
      console.warn("⚠️ Failed to fetch image:", src, error.message);
      window.postMessage({
        type: "embedding-response",
        block: false,
        src: src
      }, "*");
    }
  }
});

function injectScript(src) {
  return new Promise((resolve) => {
    const scriptTag = document.createElement('script');
    scriptTag.src = browser.runtime.getURL(src);
    
    scriptTag.onload = () => {
      console.log(`✅ ${src} injected and loaded`);
      resolve();
    };
    
    scriptTag.onerror = (error) => {
      console.error(`❌ Failed to inject ${src}:`, error);
      resolve(); // Still resolve to not block
    };
    
    // Log before appending
    console.log(`📝 Attempting to inject: ${src}`);
    console.log(`📝 URL: ${browser.runtime.getURL(src)}`);
    
    document.documentElement.appendChild(scriptTag);
  });
}

async function loadPageScripts() {
  console.log("🚀 Starting loadPageScripts");
  
  await injectScript('modules/blocked_faces.js');
  
  console.log("⏳ Waiting for window.__blockedFacesReady...");
  
  let attempts = 0;
  while (!window.__blockedFacesReady && attempts < 100) {
    if (attempts % 20 === 0) {
      console.log(`⏳ Attempt ${attempts}: __blockedFacesReady = ${window.__blockedFacesReady}`);
    }
    await new Promise(resolve => setTimeout(resolve, 50));
    attempts++;
  }
  
  if (!window.__blockedFacesReady) {
    console.error("❌ Page scripts not ready after 5 seconds");
    console.log("⚠️ window.__blockedFacesReady is:", window.__blockedFacesReady);
    return false;
  }
  
  console.log("✅ Page scripts fully initialized");
  return true;
}

async function scanExistingImages() {
  const existingImages = document.querySelectorAll("img");
  if (existingImages.length > 0) {
    console.log("Scanning", existingImages.length, "existing images");
    await new Promise(resolve => setTimeout(resolve, 200));
    window.postMessage({ 
      type: "scan-images",
      blurAmount: window.cachedBlurAmount
    }, "*");
  }
}

async function initializeBlocking() {
  const { extensionEnabled } = await browser.storage.local.get("extensionEnabled");
  if (extensionEnabled === false) {
    console.log("Extension is disabled");
    return;
  }

  const result = await browser.storage.local.get(["blockedWordsEnabled", "blockedFacesEnabled", "blockedWords", "whitelistedUrls", "blurAmount"]);
  
  blockedWordsEnabled = result.blockedWordsEnabled !== false;
  blockedFacesEnabled = result.blockedFacesEnabled !== false;
  window.cachedBlockedWords = result.blockedWords || [];
  window.cachedWhitelistedUrls = result.whitelistedUrls || [];
  window.cachedBlurAmount = result.blurAmount || 20;
  
  console.log("📦 Cached blur amount:", window.cachedBlurAmount);
  
  const urlWhitelisted = isUrlWhitelisted();
  if (urlWhitelisted) {
    console.log("URL is whitelisted");
    return;
  }

  if (blockedWordsEnabled) {
    blockTextContent();
    startObserver(blockedFacesEnabled);
  }

  if (blockedFacesEnabled) {
    const ready = await loadPageScripts();
    if (!ready) return;
    
    await scanExistingImages();
    startObserver(true);
  }
}

function stopObserver() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
}

// Add scroll listener to detect new images
let scrollTimeout;
window.addEventListener('scroll', () => {
  clearTimeout(scrollTimeout);
  scrollTimeout = setTimeout(() => {
    console.log("📜 Scroll detected, rescanning images...");
    window.postMessage({ 
      type: "scan-images",
      blurAmount: window.cachedBlurAmount
    }, "*");
  }, 500);
}, { passive: true });

browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === "local") {
    if (changes.blurAmount && !changes.blockedWordsEnabled && !changes.blockedFacesEnabled && !changes.whitelistedUrls && !changes.extensionEnabled) {
      const newBlurAmount = changes.blurAmount.newValue;
      window.cachedBlurAmount = newBlurAmount;
      console.log("🔄 Blur amount changed to:", newBlurAmount);
      return;
    }
    
    if (changes.blockedWordsEnabled || changes.blockedFacesEnabled || changes.whitelistedUrls || changes.extensionEnabled) {
      clearTimeout(reinitializeTimeout);
      reinitializeTimeout = setTimeout(()=> {
        console.log("Settings changed, reinitializing...");
        document.querySelectorAll("[style*='blur']").forEach(el => {
          el.style.filter = "";
        });
        /** @ts-ignore */
        window.scannedImages.clear();
        window.postMessage({ type: "clear-cache" }, "*");
        
        stopObserver();
        pageScriptsReady = false;  // Reset this!
        initializeBlocking();
      }, 300);
    }
  }
});

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

function loadOverrides() {
  const overridePath = browser.runtime.getURL("modules/overrides/");
  const overrides = ["youtube-override.js"];

  overrides.forEach(override => {
    const script = document.createElement("script");
    script.src = overridePath + override;
    script.onload = () => console.log(`Loaded override: ${override}`);
    document.documentElement.appendChild(script);
  });
}

setTimeout(loadOverrides, 100);