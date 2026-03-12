const personName = document.getElementById("personName");
const faceImage = document.getElementById("faceImage");
const addFaceBtn = document.getElementById("addFaceBtn");
const faceList = document.getElementById("faceList");

// Load face-api.js models from CDN
const modelUrl = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/";
Promise.all([
  faceapi.nets.ssdMobilenetv1.loadFromUri(modelUrl),
  faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl),
  faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl)
]).then(() => {
  console.log("Face-api models loaded in options page");
}).catch((error) => {
  console.error("Error loading models in options page:", error);
});

// Clear input on focus
personName.addEventListener("focus", () => {
  personName.value = "";
});

function updateFaceCount() {
  const count = Object.keys(faces).length;
  document.getElementById("faceCount").textContent = `(${count})`;
}

async function generateEmbedding(imageDataUrl) {
  const img = await faceapi.fetchImage(imageDataUrl);
  const detection = await faceapi
    .detectSingleFace(img)
    .withFaceLandmarks()
    .withFaceDescriptor();
  if (!detection) return null;
  return Array.from(detection.descriptor);
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
  const name = personName.value.trim();
  if (!name) {
    alert("Please enter a person name");
    return;
  }

  const files = faceImage.files;
  if (files.length === 0) {
    alert("Please select at least one image");
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
        alert(`No face detected in ${file.name}`);
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
        personName.value = "";
        faceImage.value = "";
        if (failedCount > 0) {
          alert(`${failedCount} image(s) had no detectable face`);
        }
      }
    };
    reader.readAsDataURL(file);
  }
};