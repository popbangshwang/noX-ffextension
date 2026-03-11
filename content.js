// Only run if tab is visible
function initializeBlocking() {
  browser.storage.local.get(["blockedWordsEnabled", "blockedFacesEnabled"]).then((result) => {
    const wordsEnabled = result.blockedWordsEnabled !== false;
    const facesEnabled = result.blockedFacesEnabled !== false;

    // Only block words if enabled
    if (wordsEnabled) {
      blockTextContent();
      startObserver(facesEnabled); // Start observer, pass whether faces are enabled
    }

    // Only scan images for faces if faces module is enabled
    if (facesEnabled && !wordsEnabled) {
      scanImages();
      startObserver(true);
    }
  });
}

function blockTextContent() {
  browser.storage.local.get("blockedWords").then((result) => {
    const words = result.blockedWords || [];
    if (words.length === 0) return;

    // Block text nodes and their article/container parent elements
    function blockWords(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        for (const word of words) {
          if (new RegExp(word, "i").test(node.textContent)) {
            // Find the closest article, div with data-testid, or container element
            let parent = node.parentNode;
            while (parent && parent !== document.body) {
              if (parent.tagName === "ARTICLE" || 
                  parent.getAttribute("data-testid") === "result" ||
                  parent.classList.contains("result")) {
                parent.style.filter = "blur(20px)";
                return;
              }
              parent = parent.parentNode;
            }
            // Fallback: blur the immediate parent if no article found
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

    // Block images whose alt text OR src contains blocked words
    const images = document.querySelectorAll("img, picture img");
    images.forEach(img => {
      for (const word of words) {
        const altMatch = img.alt && new RegExp(word, "i").test(img.alt);
        const srcMatch = img.src && new RegExp(word, "i").test(img.src);
        
        if (altMatch || srcMatch) {
          img.style.filter = "blur(20px)";
          img.parentNode.style.filter = "blur(20px)";
          scannedImages.add(img);
          break;
        }
      }
    });
  });
}

const scannedImages = new Set();

function scanImages(imagesToScan = null) {
  const images = imagesToScan || document.querySelectorAll("img, picture img");
  
  images.forEach(img => {
    // Skip if already caught by blocked_words module
    if (scannedImages.has(img)) return;
    scannedImages.add(img);
    
    const src = img.src || img.dataset.src;
    if (!src) return;
    
    browser.runtime.sendMessage({
      type: "scan-face",
      src: src
    }).then(result => {
      if (result && result.block) {
        img.style.filter = "blur(20px)";
        img.parentNode.style.filter = "blur(20px)";
      }
    });
  });
}

let observer;

function startObserver(useFaces = true) {
  observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        // Reblock text content for newly added nodes
        blockTextContent();
        
        // Scan faces only if enabled
        if (useFaces) {
          if (node.tagName === "IMG") {
            scanImages([node]);
          } else if (node.querySelectorAll) {
            const images = node.querySelectorAll("img, picture img");
            scanImages(images);
          }
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
} else {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && !observer) {
      initializeBlocking();
    } else if (document.visibilityState === "hidden") {
      stopObserver();
    }
  }, { once: false });
}