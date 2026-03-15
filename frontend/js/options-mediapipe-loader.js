import * as Vision from 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8';

window.FilesetResolver = Vision.FilesetResolver;
window.ImageEmbedder = Vision.ImageEmbedder;
window.mediapiPipeReady = true;

console.log("✅ MediaPipe loaded in options page");