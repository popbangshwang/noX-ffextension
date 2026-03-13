/**
 * YouTube-specific overrides for blocked content
 * YouTube uses custom Web Components (ytd-thumbnail) that need special handling
 */

function applyYouTubeOverrides() {
  // Only run on YouTube
  if (!window.location.hostname.includes("youtube.com")) return;

  // Wait for base modules to be ready
  if (!window.blockTextContent || !window.scanImages) {
    console.log("YouTube override: Waiting for base modules...");
    setTimeout(applyYouTubeOverrides, 100);
    return;
  }

  console.log("Applying YouTube overrides");

  /** @ts-ignore */
  const blurAmount = window.cachedBlurAmount || 20;
  const blurStyle = `blur(${blurAmount}px)`;

  /**
   * Helper function to get all visible text including Shadow DOM
   */
  function getAllVisibleText(element) {
    let text = "";
    
    // Get direct text content
    if (element.nodeType === Node.TEXT_NODE) {
      text += element.textContent;
    } else {
      // Check if element has Shadow DOM and traverse it
      if (element.shadowRoot) {
        for (let child of element.shadowRoot.childNodes) {
          text += " " + getAllVisibleText(child);
        }
      }
      
      // Traverse light DOM children
      for (let child of element.childNodes) {
        text += " " + getAllVisibleText(child);
      }
    }
    
    return text;
  }

  /**
   * YouTube-specific blockTextContent implementation
   */
  function youtubeBlockTextContent() {
    // Call original base function first for non-YouTube logic
    const originalBlockTextContent = window.blockTextContent;
    if (originalBlockTextContent && originalBlockTextContent !== youtubeBlockTextContent) {
      // Don't call it since we're replacing it
    }

    /** @ts-ignore */
    const words = window.cachedBlockedWords || [];
    if (words.length === 0) return;

    // Target YouTube video preview containers
    const videoContainers = document.querySelectorAll("ytd-video-preview");
    console.log("YouTube: Found video previews:", videoContainers.length);

    videoContainers.forEach(container => {
      // Skip if already blurred
      if (container.style.filter === blurStyle) return;

      // Get all text including Shadow DOM
      const allText = getAllVisibleText(container);

      // Check if container text matches blocked words
      for (const word of words) {
        if (new RegExp(`\\b${word}\\b`, "i").test(allText)) {
          console.log("YouTube: Blocking video preview with word:", word);

          // Blur the entire preview container
          container.style.filter = blurStyle;

          // Blur thumbnail component AND its image
          const thumbnail = container.querySelector("ytd-thumbnail");
          if (thumbnail) {
            thumbnail.style.filter = blurStyle;
            
            // Mark all images in thumbnail as scanned and blur them directly
            const thumbImages = thumbnail.querySelectorAll("img");
            thumbImages.forEach(img => {
              img.style.filter = blurStyle;
              /** @ts-ignore */
              window.scannedImages.add(img);
            });
          }

          // Blur metadata text - including yt-formatted-string elements
          const titleElements = container.querySelectorAll("h3, yt-formatted-string, span, a, div");
          titleElements.forEach(el => {
            if (thumbnail && !el.contains(thumbnail)) {
              el.style.filter = blurStyle;
            }
          });

          break;
        }
      }
    });
  }

  /**
   * YouTube-specific scanImages implementation
   */
  function youtubeScanImages(imagesToScan = null) {
    // Process YouTube thumbnail images specifically
    const youtubeImages = document.querySelectorAll("ytd-thumbnail img");
    console.log("YouTube: Found thumbnail images:", youtubeImages.length);

    youtubeImages.forEach(img => {
      // Skip if already processed
      if (window.scannedImages.has(img) || (img.style && img.style.filter === blurStyle)) return;

      const src = img.src || img.dataset.src;
      if (!src) return;

      window.scannedImages.add(img);

      browser.runtime.sendMessage({
        type: "scan-face",
        src: src
      }).then(result => {
        if (result && result.block) {
          console.log("YouTube: Blocking thumbnail and associated text (face detected)");
          img.style.filter = blurStyle;

          // Blur the entire ytd-thumbnail component
          const ytdThumbnail = img.closest("ytd-thumbnail");
          if (ytdThumbnail) {
            ytdThumbnail.style.filter = blurStyle;
          }

          // Blur the video title and metadata below thumbnail
          const videoContainer = img.closest("ytd-video-preview");
          if (videoContainer) {
            const titleElements = videoContainer.querySelectorAll("h3, yt-formatted-string, span, a, div");
            titleElements.forEach(el => {
              if (!el.contains(img)) {
                el.style.filter = blurStyle;
              }
            });
          }
        }
      }).catch(error => {
        console.error("YouTube face scan error:", error);
      });
    });
  }

  /**
   * Replace the global functions
   */
  window.blockTextContent = youtubeBlockTextContent;
  window.scanImages = youtubeScanImages;

  /**
   * Hook into MutationObserver to catch dynamically loaded content
   * YouTube loads new content when scrolling
   */
  let debounceTimer;
  const originalStartObserver = window.startObserver;
  window.startObserver = function(enableFaces = true) {
    // Call original observer
    originalStartObserver(enableFaces);

    // Add YouTube-specific observer for dynamically loaded content
    const youtubeObserver = new MutationObserver((mutations) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        console.log("YouTube: New content detected, processing...");
        youtubeBlockTextContent();
        if (enableFaces) {
          youtubeScanImages();
        }
      }, 300); // Debounce to avoid excessive processing
    });

    // Observe the main content area for changes
    const mainContent = document.querySelector("ytd-rich-grid-renderer");
    if (mainContent) {
      youtubeObserver.observe(mainContent, {
        childList: true,
        subtree: true
      });
    }
  };
}

// Apply overrides when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", applyYouTubeOverrides);
} else {
  applyYouTubeOverrides();
}