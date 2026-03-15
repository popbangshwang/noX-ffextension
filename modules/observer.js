let observer;
let blockTextTimeout;

function startObserver(useFaces = true) {
  observer = new MutationObserver((mutations) => {
    clearTimeout(blockTextTimeout);
    blockTextTimeout = setTimeout(() => {
      blockTextContent();
    }, 500);
    
    mutations.forEach((mutation) => {
      if (mutation.type !== 'childList') return;
      
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType !== Node.ELEMENT_NODE) return;
        
        if (useFaces && window.scanImages) {
          if (node.tagName === "IMG") {
            window.scanImages([node]);
          } else if (node.querySelectorAll) {
            const images = node.querySelectorAll("img, picture img");
            if (images.length > 0) {
              window.scanImages(images);
            }
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
    clearTimeout(blockTextTimeout);
  }
}