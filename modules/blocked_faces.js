console.log("🔍 blocked_faces.js loaded");

const embeddingCache = new Map();

function applyBlur(imgElement, blurAmount) {
  console.log("🚫 Applying blur:", blurAmount + "px");
  imgElement.style.filter = `blur(${blurAmount}px)`;
  imgElement.style.WebkitFilter = `blur(${blurAmount}px)`;
}

async function checkIfFaceShouldBeBlocked(imgElement) {
  try {
    // Check cache first
    if (embeddingCache.has(imgElement.src)) {
      console.log("📦 Using cached result for:", imgElement.src.substring(0, 50), embeddingCache.get(imgElement.src));
      return embeddingCache.get(imgElement.src);
    }

    console.log("✅ Requesting embedding for:", imgElement.src.substring(0, 50));
    
    return new Promise((resolve) => {
      let timeoutId;
      const listener = (event) => {
        if (event.source !== window) return;
        if (event.data.type !== "embedding-response") return;
        if (event.data.src !== imgElement.src) return;
        
        // Match found!
        clearTimeout(timeoutId);
        window.removeEventListener("message", listener);
        
        const shouldBlock = event.data.block === true;
        console.log("📨 Got response for", imgElement.src.substring(0, 50), "- block:", shouldBlock);
        embeddingCache.set(imgElement.src, shouldBlock);
        resolve(shouldBlock);
      };
      
      window.addEventListener("message", listener);
      
      // Timeout after 5 seconds
      timeoutId = setTimeout(() => {
        window.removeEventListener("message", listener);
        console.warn("⏱️ Timeout waiting for embedding response for:", imgElement.src.substring(0, 50));
        embeddingCache.set(imgElement.src, false);
        resolve(false);
      }, 5000);
      
      // Send message AFTER listener is attached
      window.postMessage({
        type: "request-embedding",
        src: imgElement.src
      }, "*");
    });
  } catch (error) {
    console.error("Error checking face:", error);
    return false;
  }
}

async function scanImages(images, blurAmount = 20) {
  const imageArray = Array.from(images);
  console.log("🔍 Scanning", imageArray.length, "image(s)");

  for (const img of imageArray) {
    if (!img || !img.src) continue;
    if (window.scannedImages && window.scannedImages.has(img)) continue;
    
    if (window.scannedImages) window.scannedImages.add(img);
    
    const shouldBlock = await checkIfFaceShouldBeBlocked(img);
    if (shouldBlock) {
      applyBlur(img, blurAmount);
    }
  }
}

window.scanImages = scanImages;
window.checkIfFaceShouldBeBlocked = checkIfFaceShouldBeBlocked;

console.log("✅ blocked_faces.js ready");

// Handle clear-cache message from content.js
window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  
  if (event.data.type === "clear-cache") {
    console.log("🗑️ Clearing embedding cache");
    embeddingCache.clear();
  }
});

// Handle scan-images message from content.js
window.addEventListener("message", (event) => {
  if (event.source !== window) return;
  
  if (event.data.type === "scan-images") {
    console.log("🔍 Scanning images on page");
    const images = document.querySelectorAll("img");
    console.log(`Found ${images.length} images`);
    
    images.forEach((img) => {
      if (!window.scannedImages.has(img.src)) {
        window.scannedImages.add(img.src);
        checkIfFaceShouldBeBlocked(img).then((shouldBlock) => {
          if (shouldBlock) {
            img.style.filter = `blur(${event.data.blurAmount || 20}px)`;
            console.log("✅ Blurred image:", img.src.substring(0, 50));
          }
        });
      }
    });
  }
});

// Set global flag instead of sending message
window.__blockedFacesReady = true;
console.log("✅ Setting window.__blockedFacesReady = true");