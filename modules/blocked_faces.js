function scanImages(imagesToScan = null) {
  /** @ts-ignore */
  const blurAmount = window.cachedBlurAmount || 20;
  const blurStyle = `blur(${blurAmount}px)`;

  const images = imagesToScan || document.querySelectorAll("img, picture img");
  console.log("Found images:", images.length);

  images.forEach(img => {
    console.log("Processing image:", img.src);

    // Skip if already caught or scanned
    if (window.scannedImages.has(img)) {
      console.log("Image already scanned, skipping");
      return;
    }
    
    // Skip if already blurred
    if (img.style && img.style.filter === blurStyle) {
      console.log("Image already blurred, skipping");
      return;
    }

    const src = img.src || img.dataset.src;
    if (!src) return;
    
    window.scannedImages.add(img);

    browser.runtime.sendMessage({
      type: "scan-face",
      src: src
    }).then(result => {
      console.log("Face scan result:", result); // DEBUG
      if (result && result.block) {
        console.log("Blocking image and associated text due to face detection"); // DEBUG
        img.style.filter = blurStyle;
        
        // Blur associated text in parent container
        let parent = img.parentNode;
        let depth = 0;
        
        while (parent && depth < 5) {
          const textElements = parent.querySelectorAll("p, span, h1, h2, h3, h4, h5, h6, a, div");
          textElements.forEach(el => {
            if (el !== img && !el.contains(img)) {
              el.style.filter = blurStyle;
            }
          });
          parent = parent.parentNode;
          depth++;
        }
      }
    }).catch(error => {
      console.error("Face scan error:", error); // DEBUG
    });
  });
}