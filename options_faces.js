const personName = document.getElementById("personName");
const faceImage = document.getElementById("faceImage");
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

function renderFaces(faces) {
  faceList.innerHTML = "";
  Object.keys(faces).forEach((name) => {
    const li = document.createElement("li");
    li.textContent = name + " (" + faces[name].length + " images)";
    faces[name].forEach((imgData) => {
      const img = document.createElement("img");
      img.src = imgData;
      img.width = 40;
      img.height = 40;
      img.style.margin = "2px";
      li.appendChild(img);
    });
    const rm = document.createElement("button");
    rm.textContent = "Remove";
    rm.onclick = () => {
      delete faces[name];
      browser.storage.local.set({ blockedFaces: faces });
      renderFaces(faces);
    };
    li.appendChild(rm);
    faceList.appendChild(li);
  });
}

browser.storage.local.get("blockedFaces").then((result) => {
  const faces = result.blockedFaces || {};
  renderFaces(faces);
});

async function generateEmbedding(imageDataUrl) {
  const img = await faceapi.fetchImage(imageDataUrl);
  const detection = await faceapi
    .detectSingleFace(img)
    .withFaceLandmarks()
    .withFaceDescriptor();
  if (!detection) return null;
  return Array.from(detection.descriptor);
}

faceImage.onchange = async () => {
  const name = personName.value.trim();
  const file = faceImage.files[0];
  if (!name || !file) return;

  const reader = new FileReader();
  reader.onload = async function () {
    const imgData = reader.result;
    // Store image as data URL
    browser.storage.local.get("blockedFaces").then((result) => {
      const faces = result.blockedFaces || {};
      if (!faces[name]) faces[name] = [];
      faces[name].push(imgData);
      browser.storage.local.set({ blockedFaces: faces });
      renderFaces(faces);
    });

    // Generate and store embedding
    const embedding = await generateEmbedding(imgData);
    if (!embedding) {
      alert("No face detected in image.");
      return;
    }
    browser.storage.local.get("blockedFacesEmbeddings").then((result) => {
      const embeddings = result.blockedFacesEmbeddings || {};
      if (!embeddings[name]) embeddings[name] = [];
      embeddings[name].push(embedding);
      browser.storage.local.set({ blockedFacesEmbeddings: embeddings });
    });

    faceImage.value = "";
  };
  reader.readAsDataURL(file);
};