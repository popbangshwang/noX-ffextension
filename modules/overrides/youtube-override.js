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
   * Enhanced blockTextContent for YouTube
   * Handles titles and metadata in ytd-video-preview components
   */
  const originalBlockTextContent = window.blockTextContent;
  window.blockTextContent = function() {
    // Call original function first
    originalBlockTextContent();

    // Then apply YouTube-specific logic
    /** @ts-ignore */
    const words = window.cachedBlockedWords || [];
    if (words.length === 0) return;

    // Target YouTube video preview containers
    const videoContainers = document.querySelectorAll("ytd-video-preview");
    console.log("Found YouTube video previews:", videoContainers.length);

    videoContainers.forEach(container => {
      // Skip if already blurred
      if (container.style.filter === blurStyle) return;

      // Check if container text matches blocked words
      for (const word of words) {
        if (new RegExp(`\\b${word}\\b`, "i").test(container.textContent)) {
          console.log("YouTube: Blocking video preview with word:", word);

          // Blur the entire preview container
          container.style.filter = blurStyle;

          // Blur thumbnail component
          const thumbnail = container.querySelector("ytd-thumbnail");
          if (thumbnail) {
            thumbnail.style.filter = blurStyle;
            
            // Mark all images in thumbnail as scanned
            const thumbImages = thumbnail.querySelectorAll("img");
            thumbImages.forEach(img => {
              img.style.filter = blurStyle;
              /** @ts-ignore */
              window.scannedImages.add(img);
            });
          }

          // Blur metadata text
          const titleElements = container.querySelectorAll("h3, yt-formatted-string, span, a, div");
          titleElements.forEach(el => {
            if (!el.contains(thumbnail)) {
              el.style.filter = blurStyle;
            }
          });

          break;
        }
      }
    });
  };

  /**
   * Enhanced scanImages for YouTube
   * Handles ytd-thumbnail components and their nested structure
   */
  const originalScanImages = window.scanImages;
  window.scanImages = function(imagesToScan = null) {
    // Call original function first
    originalScanImages(imagesToScan);

    // Then apply YouTube-specific logic
    const youtubeImages = document.querySelectorAll("ytd-thumbnail img");
    console.log("Found YouTube thumbnail images:", youtubeImages.length);

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
  };
}

// Apply overrides when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", applyYouTubeOverrides);
} else {
  applyYouTubeOverrides();
}