let observer;

function startObserver(useFaces = true) {
  observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      // Only process childList mutations (ignore attribute and text changes)
      if (mutation.type !== 'childList') return;
      
      mutation.addedNodes.forEach((node) => {
        // Skip non-element nodes (text nodes, comments, etc.)
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        
        blockTextContent();
        
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
    // Removed attributes: true and characterData: true to reduce observer triggers
  });
}

function stopObserver() {
  if (observer) {
    observer.disconnect();
  }
}