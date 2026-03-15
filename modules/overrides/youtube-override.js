/**
 * YouTube-specific overrides for blocked content
 * Hooks into existing blocked_faces.js functionality
 */

(function() {
  // Only run on YouTube
  if (!window.location.hostname.includes("youtube.com")) return;

  console.log("🎥 YouTube override loading...");

  // Wait for base modules to be ready
  let attempts = 0;
  const waitForModules = setInterval(() => {
    if (window.checkIfFaceShouldBeBlocked && window.cachedBlockedWords) {
      clearInterval(waitForModules);
      applyYouTubeOverrides();
    }
    attempts++;
    if (attempts > 50) {
      clearInterval(waitForModules);
      console.warn("YouTube override: Timed out waiting for modules");
    }
  }, 100);

  function applyYouTubeOverrides() {
    console.log("✅ Applying YouTube overrides");

    /** @ts-ignore */
    const blurAmount = window.cachedBlurAmount || 20;
    const blurStyle = `blur(${blurAmount}px)`;
    
    // Track processed images with element reference
    const processedImages = new WeakSet();

    /**
     * Helper function to get all visible text including Shadow DOM
     */
    function getAllVisibleText(element) {
      let text = "";
      
      if (element.nodeType === Node.TEXT_NODE) {
        text += element.textContent;
      } else {
        if (element.shadowRoot) {
          try {
            for (let child of element.shadowRoot.childNodes) {
              text += " " + getAllVisibleText(child);
            }
          } catch (e) {
            // Ignore shadow DOM access errors
          }
        }
        
        for (let child of element.childNodes) {
          text += " " + getAllVisibleText(child);
        }
      }
      
      return text;
    }

    /**
     * YouTube-specific blockTextContent
     */
    function youtubeBlockTextContent() {
      /** @ts-ignore */
      const words = window.cachedBlockedWords || [];
      if (words.length === 0) return;

      const videoContainers = document.querySelectorAll("ytd-video-preview");
      
      videoContainers.forEach(container => {
        if (container.style.filter === blurStyle) return;

        const allText = getAllVisibleText(container);

        for (const word of words) {
          if (new RegExp(`\\b${word}\\b`, "i").test(allText)) {
            console.log("🎥 YouTube: Blocking video preview with word:", word);
            container.style.filter = blurStyle;
            break;
          }
        }
      });
    }

    /**
     * YouTube-specific face scanning
     */
    async function youtubeScanImages() {
      const youtubeImages = document.querySelectorAll("ytd-thumbnail img");
      console.log(`🎥 YouTube: Found ${youtubeImages.length} total thumbnail images`);
      
      let newImagesScanned = 0;
      
      for (const img of youtubeImages) {
        // Skip if already processed
        if (processedImages.has(img)) continue;
        
        const src = img.src || img.dataset.src;
        if (!src) continue;

        console.log(`🎥 YouTube: Processing new thumbnail (${src.substring(0, 80)}...)`);
        processedImages.add(img);
        newImagesScanned++;

        try {
          if (window.checkIfFaceShouldBeBlocked) {
            const shouldBlock = await window.checkIfFaceShouldBeBlocked(img);
            
            if (shouldBlock) {
              console.log("🎥 YouTube: Blocking thumbnail (face detected)");
              img.style.filter = blurStyle;
            }
          }
        } catch (error) {
          console.warn("YouTube override: Error checking image:", error.message);
        }
      }
      
      if (newImagesScanned > 0) {
        console.log(`🎥 YouTube: Scanned ${newImagesScanned} new thumbnail(s)`);
      }
    }

    // Set up MutationObserver to watch for new images
    const observer = new MutationObserver((mutations) => {
      console.log("🎥 YouTube: MutationObserver triggered");
      youtubeBlockTextContent();
      youtubeScanImages();
    });

    // Start observing the main content area
    function setupObserver() {
      const mainContent = document.querySelector("ytd-rich-grid-renderer, ytd-browse, #content");
      if (mainContent) {
        observer.observe(mainContent, {
          childList: true,
          subtree: true,
          attributes: false,
          characterData: false
        });
        console.log("🎥 YouTube: MutationObserver started");
      } else {
        console.warn("🎥 YouTube: Could not find main content area, retrying...");
        setTimeout(setupObserver, 1000);
      }
    }

    setupObserver();

    // Also set up scroll listener as backup
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        console.log("🎥 YouTube: Scroll event triggered scan");
        youtubeBlockTextContent();
        youtubeScanImages();
      }, 300);
    }, { passive: true });

    // Initial scan
    youtubeBlockTextContent();
    youtubeScanImages();
    
    console.log("✅ YouTube overrides fully applied");
  }
})();