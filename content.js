// Only run if tab is visible
function initializeBlocking() {
  browser.storage.local.get("blockedWords").then((result) => {
    const words = result.blockedWords || [];
    if (words.length === 0) return;

    // Blur text nodes and their parent elements
    function blockWords(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        for (const word of words) {
          if (new RegExp(word, "i").test(node.textContent)) {
            node.parentNode.style.filter = "blur(20px)";
            break;
          }
        }
      } else {
        for (let child of node.childNodes) {
          blockWords(child);
        }
      }
    }

    blockWords(document.body);
  });

  scanImages();
}

const scannedImages = new Set(); // Track scanned images

function scanImages(imagesToScan = null) {
  const images = imagesToScan || document.querySelectorAll("img, picture img");
  
  browser.storage.local.get("blockedWords").then((result) => {
    const blockedWords = result.blockedWords || [];
    
    images.forEach(img => {
      // Skip if already scanned
      if (scannedImages.has(img)) return;
      scannedImages.add(img);
      
      // Check alt text for blocked words
      if (img.alt) {
        for (const word of blockedWords) {
          if (new RegExp(word, "i").test(img.alt)) {
            img.style.filter = "blur(20px)";
            return;
          }
        }
      }
      
      // Check image for faces only if alt text didn't block it
      const src = img.src || img.dataset.src;
      if (!src) return;
      
      browser.runtime.sendMessage({
        type: "scan-face",
        src: src
      }).then(result => {
        if (result && result.block) {
          img.style.filter = "blur(20px)";
        }
      });
    });
  });
}

let observer;

function startObserver() {
  // Only scan newly added images
  observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.tagName === "IMG") {
          scanImages([node]);
        } else if (node.querySelectorAll) {
          const images = node.querySelectorAll("img, picture img");
          scanImages(images);
        }
      });
    });
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

function stopObserver() {
  if (observer) {
    observer.disconnect();
  }
}

// Initialize on page load if visible
if (document.visibilityState === "visible") {
  initializeBlocking();
  startObserver();
} else {
  // Wait for tab to become visible before initializing
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && !observer) {
      initializeBlocking();
      startObserver();
    } else if (document.visibilityState === "hidden") {
      stopObserver();
    }
  }, { once: false });
}