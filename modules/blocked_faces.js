function scanImages(imagesToScan = null) {
  const images = imagesToScan || document.querySelectorAll("img, picture img");
  
  images.forEach(img => {
    // Skip if already caught or scanned
    if (window.scannedImages.has(img)) return;
    
    // Skip if already blurred
    if (img.style && img.style.filter === "blur(20px)") return;
    
    const src = img.src || img.dataset.src;
    if (!src) return;
    
    window.scannedImages.add(img);
    
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