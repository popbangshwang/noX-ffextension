function scanImages(imagesToScan = null) {
  const images = imagesToScan || document.querySelectorAll("img, picture img");
  
  images.forEach(img => {
    // Skip if already caught by blocked_words module
    if (window.scannedImages.has(img)) return;
    window.scannedImages.add(img);
    
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