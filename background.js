let modelsLoaded = false;

async function loadModels() {
  try {
    const modelUrl = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/";
    console.log("Loading models from CDN:", modelUrl);
    
    await faceapi.nets.ssdMobilenetv1.loadFromUri(modelUrl);
    console.log("ssdMobilenetv1 loaded");
    
    await faceapi.nets.faceLandmark68Net.loadFromUri(modelUrl);
    console.log("faceLandmark68Net loaded");
    
    await faceapi.nets.faceRecognitionNet.loadFromUri(modelUrl);
    console.log("faceRecognitionNet loaded");
    
    modelsLoaded = true;
    console.log("All models loaded successfully");
  } catch (error) {
    console.error("Error loading models:", error);
  }
}

loadModels();

async function generateEmbedding(imageDataUrl) {
  const img = await faceapi.fetchImage(imageDataUrl);
  const detection = await faceapi
    .detectSingleFace(img)
    .withFaceLandmarks()
    .withFaceDescriptor();
  if (!detection) return null;
  return detection.descriptor;
}

function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

// Listen for scan-face messages from content script
browser.runtime.onMessage.addListener(async (msg) => {
  if (msg.type === "scan-face" && modelsLoaded) {
    const emb = await generateEmbedding(msg.src);
    if (!emb) return { block: false };

    // Get similarity threshold from config page (in storage)
    const { similarityThreshold } = await browser.storage.local.get("similarityThreshold");
    const threshold = similarityThreshold || 0.8;

    const { blockedFacesEmbeddings } = await browser.storage.local.get("blockedFacesEmbeddings");
    for (const name in blockedFacesEmbeddings) {
      for (const refEmb of blockedFacesEmbeddings[name]) {
        const sim = cosineSimilarity(emb, refEmb);
        console.log(
            `Similarity for ${name}: ${sim.toFixed(4)} | Threshold: ${threshold}`,
            msg.src
        );
        if (sim > threshold) return { block: true };
      }
    }
    return { block: false };
  }
});