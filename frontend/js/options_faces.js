const personName = document.getElementById("personName");
const faceImage = document.getElementById("faceImage");
const addFaceBtn = document.getElementById("addFaceBtn");
const faceList = document.getElementById("faceList");

// Wait for MediaPipe models to load
let modelsReady = false;

async function initializeMediaPipe() {
  try {
    console.log("Initializing MediaPipe in options page...");
    
    // Wait for window.FilesetResolver to be available
    let attempts = 0;
    while ((!window.FilesetResolver || !window.ImageEmbedder) && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    const vision = await window.FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
    );
    
    window.imageEmbedder = await window.ImageEmbedder.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/image_embedder/mobilenet_v3_small/float32/1/mobilenet_v3_small.tflite"
      },
      runningMode: "IMAGE"
    });

    modelsReady = true;
    console.log("✅ MediaPipe ImageEmbedder ready in options page");
  } catch (error) {
    console.error("Error initializing MediaPipe:", error);
  }
}

// Initialize MediaPipe on page load
initializeMediaPipe();

let lastPersonName = ""; // Store the last entered name

// Clear input on focus if it was just populated
personName.addEventListener("focus", () => {
  if (personName.value === lastPersonName && personName.value !== "") {
    personName.value = "";
  }
});

// Track when user finishes editing
personName.addEventListener("blur", () => {
  if (personName.value.trim() !== "") {
    lastPersonName = personName.value.trim();
  }
});

function updateFaceCount() {
  const count = Object.keys(faces).length;
  document.getElementById("faceCount").textContent = `(${count})`;
}

async function generateEmbedding(imageDataUrl) {
  try {
    if (!modelsReady || !window.imageEmbedder) {
      console.error("MediaPipe not ready yet, please wait...");
      return null;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = imageDataUrl;
    
    return new Promise((resolve) => {
      img.onload = async () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0);
          
          const result = await window.imageEmbedder.embed(canvas);
          
          if (!result.embeddings || result.embeddings.length === 0) {
            console.log("❌ No embedding generated for image");
            resolve(null);
            return;
          }

          // Use floatEmbedding directly
          const embedding = Array.from(result.embeddings[0].floatEmbedding);
          console.log("✅ Embedding generated successfully, length:", embedding.length);
          resolve(embedding);
        } catch (error) {
          console.error("Error generating embedding:", error);
          resolve(null);
        }
      };
      
      img.onerror = () => {
        console.error("Error loading image");
        resolve(null);
      };
    });
  } catch (error) {
    console.error("Error in generateEmbedding:", error);
    return null;
  }
}

function renderFaces(facesData) {
  faceList.innerHTML = "";

  Object.keys(facesData).forEach((name) => {
    const images = facesData[name];
    
    // Create accordion container
    const accordion = document.createElement("div");
    accordion.className = "face-accordion";
    
    // Create header
    const header = document.createElement("div");
    header.className = "face-accordion-header";
    
    // Create the header content with inline SVG
    const headerContent = document.createElement("div");
    headerContent.style.display = "flex";
    headerContent.style.alignItems = "center";
    headerContent.style.flex = "1";
    
    const toggleSvg = document.createElement("div");
    toggleSvg.className = "face-accordion-toggle";
    toggleSvg.innerHTML = `
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="9 18 15 12 9 6"></polyline>
      </svg>
    `;
    
    const nameDiv = document.createElement("div");
    nameDiv.innerHTML = `
      <strong>${name}</strong>
      <span style="color: #666; font-size: 0.9em; margin-left: 8px;">(${images.length} image${images.length !== 1 ? 's' : ''})</span>
    `;
    
    headerContent.appendChild(toggleSvg);
    headerContent.appendChild(nameDiv);
    header.appendChild(headerContent);
    
    // Create content (images grid)
    const content = document.createElement("div");
    content.className = "face-accordion-content";
    
    const imagesGrid = document.createElement("div");
    imagesGrid.className = "face-images-grid";
    
    images.forEach((imgData, idx) => {
      const imgItem = document.createElement("div");
      imgItem.className = "face-image-item";
      
      const img = document.createElement("img");
      img.src = imgData;
      img.alt = `${name} image ${idx + 1}`;
      
      const removeBtn = document.createElement("button");
      removeBtn.className = "face-image-remove";
      removeBtn.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
      removeBtn.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        images.splice(idx, 1);
        if (images.length === 0) {
          delete facesData[name];
        }
        browser.storage.local.set({ blockedFaces: facesData });
        
        // Also remove embedding
        browser.storage.local.get("blockedFacesEmbeddings").then((result) => {
          const embeddings = result.blockedFacesEmbeddings || {};
          if (embeddings[name]) {
            embeddings[name].splice(idx, 1);
            if (embeddings[name].length === 0) {
              delete embeddings[name];
            }
            browser.storage.local.set({ blockedFacesEmbeddings: embeddings });
          }
        });
        
        renderFaces(facesData);
        updateFaceCount();
      };
      
      imgItem.appendChild(img);
      imgItem.appendChild(removeBtn);
      imagesGrid.appendChild(imgItem);
    });
    
    content.appendChild(imagesGrid);
    
    // Add actions
    const actions = document.createElement("div");
    actions.className = "face-accordion-actions";
    
    const removePersonBtn = document.createElement("button");
    removePersonBtn.textContent = "Remove Person";
    removePersonBtn.style.background = "#e17055";
    removePersonBtn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (confirm(`Remove all images for "${name}"?`)) {
        delete facesData[name];
        browser.storage.local.set({ blockedFaces: facesData });
        
        // Also remove embeddings
        browser.storage.local.get("blockedFacesEmbeddings").then((result) => {
          const embeddings = result.blockedFacesEmbeddings || {};
          delete embeddings[name];
          browser.storage.local.set({ blockedFacesEmbeddings: embeddings });
        });
        
        renderFaces(facesData);
        updateFaceCount();
      }
    };
    
    actions.appendChild(removePersonBtn);
    content.appendChild(actions);
    
    // Toggle accordion on header click
    header.addEventListener("click", (e) => {
      e.stopPropagation();
      header.classList.toggle("open");
      content.classList.toggle("open");
      header.querySelector(".face-accordion-toggle").classList.toggle("open");
    });
    
    accordion.appendChild(header);
    accordion.appendChild(content);
    faceList.appendChild(accordion);
  });
}

let faces = {};

// Load faces on page load
browser.storage.local.get("blockedFaces").then((result) => {
  faces = result.blockedFaces || {};
  renderFaces(faces);
  updateFaceCount();
});

// Handle file input change
faceImage.onchange = async () => {
  const name = personName.value.trim() || lastPersonName;
  if (!name) {
    alert("Please enter a person name");
    return;
  }

  const files = faceImage.files;
  if (files.length === 0) {
    alert("Please select at least one image");
    return;
  }

  if (!modelsReady) {
    alert("MediaPipe is still loading, please wait a moment and try again...");
    return;
  }

  let processedCount = 0;
  let failedCount = 0;

  for (let file of files) {
    const reader = new FileReader();
    reader.onload = async function () {
      const imgData = reader.result;
      
      // Generate embedding first
      const embedding = await generateEmbedding(imgData);
      if (!embedding) {
        alert(`No embedding generated for ${file.name}`);
        failedCount++;
        processedCount++;
        return;
      }

      // Store image as data URL
      if (!faces[name]) faces[name] = [];
      faces[name].push(imgData);
      browser.storage.local.set({ blockedFaces: faces });

      // Store embedding
      browser.storage.local.get("blockedFacesEmbeddings").then((result) => {
        const embeddings = result.blockedFacesEmbeddings || {};
        if (!embeddings[name]) embeddings[name] = [];
        embeddings[name].push(embedding);
        browser.storage.local.set({ blockedFacesEmbeddings: embeddings });
      });

      processedCount++;

      // Render after all files processed
      if (processedCount === files.length) {
        renderFaces(faces);
        updateFaceCount();
        // Populate field with name for next upload, don't clear it
        personName.value = name;
        lastPersonName = name;
        faceImage.value = "";
        if (failedCount > 0) {
          alert(`${failedCount} image(s) had no detectable embedding`);
        }
      }
    };
    reader.readAsDataURL(file);
  }
};