let modelsLoaded = false;
let faceDetector = null;
let imageEmbedder = null;

async function loadModels() {
  try {
    console.log("Loading MediaPipe FaceDetector and ImageEmbedder...");
    
    let attempts = 0;
    while ((!globalThis.FilesetResolver || !globalThis.FaceDetector || !globalThis.ImageEmbedder) && attempts < 50) {
      await new Promise(resolve => setTimeout(resolve, 100));
      attempts++;
    }

    if (!globalThis.FilesetResolver || !globalThis.FaceDetector || !globalThis.ImageEmbedder) {
      throw new Error("MediaPipe not available after 5 seconds");
    }

    const vision = await globalThis.FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8/wasm"
    );
    
    // Load FaceDetector for detecting individual faces
    faceDetector = await globalThis.FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite"
      },
      runningMode: "IMAGE"
    });

    // Load ImageEmbedder for generating embeddings
    imageEmbedder = await globalThis.ImageEmbedder.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: "https://storage.googleapis.com/mediapipe-models/image_embedder/mobilenet_v3_small/float32/1/mobilenet_v3_small.tflite"
      },
      runningMode: "IMAGE"
    });

    modelsLoaded = true;
    console.log("✅ MediaPipe FaceDetector and ImageEmbedder loaded successfully");
  } catch (error) {
    console.error("Error loading MediaPipe models:", error);
  }
}

setTimeout(loadModels, 500);

function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

/**
 * Detect faces in canvas and return their bounding box information
 */
function detectFaces(canvas, minConfidence = 0.5) {
  try {
    if (!faceDetector) {
      console.log("FaceDetector not available");
      return [];
    }

    const results = faceDetector.detect(canvas);
    
    if (!results.detections || results.detections.length === 0) {
      console.log("❌ No faces detected");
      return [];
    }

    console.log(`👤 Detected ${results.detections.length} face(s) in canvas (${canvas.width}x${canvas.height})`);

    const detectedFaces = [];

    for (let i = 0; i < results.detections.length; i++) {
      const detection = results.detections[i];
      const confidence = detection.categories[0]?.score || 0;
      
      // Filter by confidence threshold
      if (confidence < minConfidence) {
        console.log(`Face ${i}: Skipped (confidence ${confidence.toFixed(4)} < ${minConfidence})`);
        continue;
      }

      // Get bounding box - FaceDetector uses originX, originY, width, height
      const bbox = detection.boundingBox;
      if (!bbox) continue;

      console.log(`Face ${i} raw bbox:`, JSON.stringify(bbox));

      // originX and originY are the top-left corner
      let originX = bbox.originX || 0;
      let originY = bbox.originY || 0;
      let bboxWidth = bbox.width || 0;
      let bboxHeight = bbox.height || 0;

      if (bboxWidth <= 0 || bboxHeight <= 0) {
        console.warn(`Face ${i}: Invalid bbox dimensions`);
        continue;
      }

      // Add padding around the face
      const padding = 0.2;  // 20% padding
      const paddedWidth = bboxWidth * (1 + padding * 2);
      const paddedHeight = bboxHeight * (1 + padding * 2);
      
      let cropX = originX - (bboxWidth * padding);
      let cropY = originY - (bboxHeight * padding);

      // Clamp to canvas bounds
      cropX = Math.max(0, Math.min(cropX, canvas.width - paddedWidth));
      cropY = Math.max(0, Math.min(cropY, canvas.height - paddedHeight));
      
      let cropWidth = Math.min(paddedWidth, canvas.width - cropX);
      let cropHeight = Math.min(paddedHeight, canvas.height - cropY);

      // Ensure minimum size
      if (cropWidth < 10 || cropHeight < 10) {
        console.warn(`Face ${i}: Crop too small (${cropWidth}x${cropHeight}), skipping`);
        continue;
      }

      detectedFaces.push({
        index: i,
        cropX: Math.round(cropX),
        cropY: Math.round(cropY),
        cropWidth: Math.round(cropWidth),
        cropHeight: Math.round(cropHeight),
        confidence: confidence
      });

      console.log(`👤 Face ${i}: confidence ${confidence.toFixed(4)}, crop: (${Math.round(cropX)}, ${Math.round(cropY)}, ${Math.round(cropWidth)}x${Math.round(cropHeight)})`);
    }

    return detectedFaces;
  } catch (error) {
    console.error("Error detecting faces:", error);
    return [];
  }
}

/**
 * Crop a face from canvas and generate embedding for it
 */
async function generateFaceEmbedding(canvas, faceInfo) {
  try {
    if (!imageEmbedder) {
      console.log("ImageEmbedder not available");
      return null;
    }

    // Validate crop dimensions
    if (faceInfo.cropWidth <= 0 || faceInfo.cropHeight <= 0) {
      console.log(`Face ${faceInfo.index}: Invalid crop dimensions`);
      return null;
    }

    // Create cropped canvas with proper dimensions
    const croppedCanvas = document.createElement('canvas');
    croppedCanvas.width = faceInfo.cropWidth;
    croppedCanvas.height = faceInfo.cropHeight;
    
    const ctx = croppedCanvas.getContext('2d');
    
    // Draw the cropped region
    try {
      ctx.drawImage(
        canvas,
        faceInfo.cropX,
        faceInfo.cropY,
        faceInfo.cropWidth,
        faceInfo.cropHeight,
        0,
        0,
        faceInfo.cropWidth,
        faceInfo.cropHeight
      );
    } catch (error) {
      console.error(`Face ${faceInfo.index}: Error drawing image`, error);
      return null;
    }

    console.log(`Face ${faceInfo.index}: Generating embedding from ${faceInfo.cropWidth}x${faceInfo.cropHeight} crop`);

    const result = await imageEmbedder.embed(croppedCanvas);
    
    if (!result.embeddings || result.embeddings.length === 0) {
      console.log(`Face ${faceInfo.index}: Failed to generate embedding`);
      return null;
    }

    const embedding = Array.from(result.embeddings[0].floatEmbedding);
    console.log(`Face ${faceInfo.index}: Generated embedding (${embedding.length} dims)`);
    return embedding;
  } catch (error) {
    console.error(`Error generating embedding for face ${faceInfo.index}:`, error);
    return null;
  }
}

// Single message listener
browser.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("📨 Background received:", msg.type);
  
  // Handle image processing (detect faces + embedding + comparison)
  if (msg.type === "process-image" && msg.imageData) {
    (async () => {
      try {
        if (!modelsLoaded) {
          console.log("⏳ Models not loaded yet");
          sendResponse({ block: false });
          return;
        }

        const img = new Image();
        img.src = msg.imageData;
        
        img.onload = async () => {
          try {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0);

            // Detect faces in the image
            // Use lower confidence threshold for small images (like thumbnails)
            const minConfidence = canvas.width < 200 ? 0.3 : 0.5;
            const detectedFaces = detectFaces(canvas, minConfidence);

            console.log(`Using confidence threshold: ${minConfidence}`);

            if (detectedFaces.length === 0) {
              console.log("ℹ️ No faces detected in image");
              sendResponse({ block: false });
              return;
            }

            // Get comparison settings
            const { similarityThreshold } = await browser.storage.local.get("similarityThreshold");
            const threshold = similarityThreshold || 0.8;
            const { blockedFacesEmbeddings } = await browser.storage.local.get("blockedFacesEmbeddings");
            
            if (!blockedFacesEmbeddings || Object.keys(blockedFacesEmbeddings).length === 0) {
              console.log("❌ No blocked faces configured");
              sendResponse({ block: false });
              return;
            }

            console.group(`🔍 Comparing ${detectedFaces.length} face(s) (Threshold: ${threshold})`);
            console.log("Image URL:", msg.src);

            let matched = false;
            let matchedName = null;
            let matchedScore = 0;

            // Process each detected face individually
            for (const face of detectedFaces) {
              console.log(`\n👤 Processing face ${face.index}...`);
              
              const embedding = await generateFaceEmbedding(canvas, face);
              
              if (!embedding) {
                continue;
              }

              // Compare this face's embedding against all blocked faces
              for (const name in blockedFacesEmbeddings) {
                const refEmbeddings = blockedFacesEmbeddings[name];
                let bestMatch = 0;
                
                for (let i = 0; i < refEmbeddings.length; i++) {
                  const sim = cosineSimilarity(embedding, refEmbeddings[i]);
                  if (sim > bestMatch) {
                    bestMatch = sim;
                  }
                }
                
                const isMatch = bestMatch >= threshold;
                const emoji = isMatch ? "✅" : "❌";
                const color = isMatch ? "color: #27ae60; font-weight: bold;" : "color: #7f8c8d;";
                console.log(`%c${emoji} ${name}: ${bestMatch.toFixed(4)}`, color);
                
                if (isMatch) {
                  matched = true;
                  matchedName = name;
                  matchedScore = bestMatch;
                }
              }
            }

            console.groupEnd();
            
            if (matched) {
              console.log(`✅ MATCH FOUND: ${matchedName} (${matchedScore.toFixed(4)})`);
            } else {
              console.log("❌ No matches found");
            }
            
            sendResponse({ block: matched });
          } catch (error) {
            console.error("Error processing image:", error);
            sendResponse({ block: false });
          }
        };
        
        img.onerror = () => {
          console.error("Failed to load image");
          sendResponse({ block: false });
        };
      } catch (error) {
        console.error("Error in process-image handler:", error);
        sendResponse({ block: false });
      }
    })();
    return true;
  }
});