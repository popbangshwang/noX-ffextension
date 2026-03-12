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
      console.log("Image alraedy blurred, skipping");
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
        console.log("Blocking image due to face detection"); // DEBUG
        img.style.filter = blurStyle;
        img.parentNode.style.filter = blurStyle;
      }
    }).catch(error => {
      console.error("Face scan error:", error); // DEBUG
    });
  });
}