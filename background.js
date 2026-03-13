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
    if (!emb) {
      console.log("❌ No face detected in image");
      return { block: false };
    }

    // Get similarity threshold from config page (in storage)
    const { similarityThreshold } = await browser.storage.local.get("similarityThreshold");
    const threshold = similarityThreshold || 0.8;

    const { blockedFacesEmbeddings } = await browser.storage.local.get("blockedFacesEmbeddings");
    
    // Create a collapsible group for this image with clickable URL
    console.group(`🔍 Scanning image (Threshold: ${threshold})`);
    console.log("Image URL:", msg.src); // ← Clickable link in console
    
    let matched = false;
    
    for (const name in blockedFacesEmbeddings) {
      const refEmbeddings = blockedFacesEmbeddings[name];
      let bestMatch = 0;
      let bestIndex = -1;
      
      // Find best match for this person
      for (let i = 0; i < refEmbeddings.length; i++) {
        const sim = cosineSimilarity(emb, refEmbeddings[i]);
        if (sim > bestMatch) {
          bestMatch = sim;
          bestIndex = i;
        }
      }
      
      // Log the best match for this person
      const isMatch = bestMatch > threshold;
      const emoji = isMatch ? "✅" : "❌";
      const color = isMatch ? "color: #27ae60; font-weight: bold;" : "color: #7f8c8d;";
      
      console.log(
        `%c${emoji} ${name}: ${bestMatch.toFixed(4)}`,
        color,
        `(matched with image ${bestIndex + 1}/${refEmbeddings.length})`
      );
      
      if (isMatch) {
        matched = true;
      }
    }
    
    // Summary
    const resultEmoji = matched ? "🚫 BLOCKED" : "✅ ALLOWED";
    const resultColor = matched ? "color: #e74c3c; font-weight: bold;" : "color: #27ae60; font-weight: bold;";
    console.log(`%c${resultEmoji}`, resultColor);
    
    console.groupEnd();
    
    return { block: matched };
  }
});