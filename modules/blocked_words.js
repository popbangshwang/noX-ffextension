function blockTextContent() {
    // Use cached words instead of fetching from storage
    const words = window.cachedBlockedWords || [];
    if (words.length === 0) return;

    // Block text nodes and their article/container parent elements
    function blockWords(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        for (const word of words) {
          if (new RegExp(`\\b${word}\\b`, "i").test(node.textContent)) {
            let parent = node.parentNode;
            while (parent && parent !== document.body) {
              if (parent.tagName === "ARTICLE" || 
                  parent.getAttribute("data-testid") === "result" ||
                  parent.classList.contains("result")) {
                parent.style.filter = "blur(20px)";
                return;
              }
              parent = parent.parentNode;
            }
            node.parentNode.style.filter = "blur(20px)";
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
      for (const word of words) {
        const altMatch = img.alt && new RegExp(`\\b${word}\\b`, "i").test(img.alt);
        const srcMatch = img.src && new RegExp(`\\b${word}\\b`, "i").test(img.src);
        
        if (altMatch || srcMatch) {
          img.style.filter = "blur(20px)";
          img.parentNode.style.filter = "blur(20px)";
          /** @ts-ignore */
          window.scannedImages.add(img);
          break;
        }
      }
    });

    // Block links ONLY within result containers, not site-wide navigation
    const resultLinks = document.querySelectorAll("article a[href], [data-testid='result'] a[href]");
    resultLinks.forEach(link => {
      for (const word of words) {
        const hrefMatch = link.href && new RegExp(`\\b${word}\\b`, "i").test(link.href);
        
        if (hrefMatch) {
          link.style.filter = "blur(20px)";
          /** @ts-ignore */
          window.scannedImages.add(link);
          break;
        }
      }
    });
}