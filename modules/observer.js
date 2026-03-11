let observer;

function startObserver(useFaces = true) {
  observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        // Reblock text content for newly added nodes
        blockTextContent();
        
        // Scan faces only if enabled
        if (useFaces) {
          if (node.tagName === "IMG") {
            scanImages([node]);
          } else if (node.querySelectorAll) {
            const images = node.querySelectorAll("img, picture img");
            scanImages(images);
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
  }
}