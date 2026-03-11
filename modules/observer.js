let observer;
let blockTextTimeout;

function startObserver(useFaces = true) {
  observer = new MutationObserver((mutations) => {
    // Debounce blockTextContent to prevent rapid repeated calls
    clearTimeout(blockTextTimeout);
    blockTextTimeout = setTimeout(() => {
      blockTextContent();
    }, 500);
    
    mutations.forEach((mutation) => {
      // Only process childList mutations (ignore attribute and text changes)
      if (mutation.type !== 'childList') return;
      
      mutation.addedNodes.forEach((node) => {
        // Skip non-element nodes (text nodes, comments, etc.)
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        
        if (useFaces) {
          if (node.tagName === "IMG") {
            scanImages([node]);
          } else if (node.querySelectorAll) {
            const images = node.querySelectorAll("img, picture img");
            // Only scan if images were actually found
            if (images.length > 0) scanImages(images);
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
    clearTimeout(blockTextTimeout); // Clean up timeout on stop
  }
}