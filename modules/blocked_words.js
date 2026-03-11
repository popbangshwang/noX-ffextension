function blockTextContent() {
  // Use cached words instead of fetching from storage
  /** @ts-ignore */
  const words = window.cachedBlockedWords || [];
    /** @ts-ignore */
  const blurAmount = window.cachedBlurAmount || 20;
  const blurStyle = `blur(${blurAmount}px)`;

  if (words.length === 0) return;

  // Block text nodes and their article/container parent elements
  function blockWords(node) {
    // Skip if node is already blurred
    if (node.style && node.style.filter === blurStyle) return;
    
    if (node.nodeType === Node.TEXT_NODE) {
      for (const word of words) {
        if (new RegExp(`\\b${word}\\b`, "i").test(node.textContent)) {
          let parent = node.parentNode;
          while (parent && parent !== document.body) {
            // Skip if parent is already blurred
            if (parent.style && parent.style.filter === blurStyle) return;
            
            if (parent.tagName === "ARTICLE" || 
                parent.getAttribute("data-testid") === "result" ||
                parent.classList.contains("result")) {
              parent.style.filter = blurStyle;
              return;
            }
            parent = parent.parentNode;
          }
          node.parentNode.style.filter = blurStyle;
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
    // Skip if image already scanned or blurred
    if (window.scannedImages.has(img) || (img.style && img.style.filter === blurStyle)) return;
    
    for (const word of words) {
      const altMatch = img.alt && new RegExp(`\\b${word}\\b`, "i").test(img.alt);
      const srcMatch = img.src && new RegExp(`\\b${word}\\b`, "i").test(img.src);
      
      if (altMatch || srcMatch) {
        img.style.filter = blurStyle;
        img.parentNode.style.filter = blurStyle;
        /** @ts-ignore */
        window.scannedImages.add(img);
        break;
      }
    }
  });

  // Block images based on parent container text content
  const images2 = document.querySelectorAll("img, picture img");
  images2.forEach(img => {
    // Skip if already processed
    if (window.scannedImages.has(img) || (img.style && img.style.filter === blurStyle)) return;
    
    // Check parent container text for blocked words
    let parent = img.parentNode;
    let depth = 0;
    
    while (parent && depth < 5) { // Limit search depth to avoid performance issues
      for (const word of words) {
        if (new RegExp(`\\b${word}\\b`, "i").test(parent.textContent)) {
          img.style.filter = blurStyle;
          parent.style.filter = blurStyle;
          /** @ts-ignore */
          window.scannedImages.add(img);
          return;
        }
      }
      parent = parent.parentNode;
      depth++;
    }
  });

  // Block links ONLY within result containers, not site-wide navigation
  const resultLinks = document.querySelectorAll("article a[href], [data-testid='result'] a[href]");
  resultLinks.forEach(link => {
    // Skip if link already scanned or blurred
    if (window.scannedImages.has(link) || (link.style && link.style.filter === blurStyle)) return;
    
    for (const word of words) {
      const hrefMatch = link.href && new RegExp(`\\b${word}\\b`, "i").test(link.href);
      
      if (hrefMatch) {
        link.style.filter = blurStyle;
        /** @ts-ignore */
        window.scannedImages.add(link);
        break;
      }
    }
  });
}