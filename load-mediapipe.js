async function loadMediaPipeScripts() {
  try {
    console.log("Loading MediaPipe dependencies...");
    
    // Load TensorFlow first
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-core@4";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });

    // Load TensorFlow Converter
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-converter@4";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });

    // Load TensorFlow WebGL backend
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs-backend-webgl@4";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });

    // Load MediaPipe module
    await new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'mediapipe-loader.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });

    // Wait for MediaPipe to be available
    await new Promise(resolve => setTimeout(resolve, 2000));

    if (!globalThis.FilesetResolver || !globalThis.FaceDetector || !globalThis.ImageEmbedder) {
      throw new Error("MediaPipe libraries not loaded correctly");
    }

    console.log("✅ All MediaPipe dependencies loaded successfully");
    globalThis.mediaPipeReady = true;
  } catch (error) {
    console.error("Error loading MediaPipe scripts:", error);
  }
}

loadMediaPipeScripts();