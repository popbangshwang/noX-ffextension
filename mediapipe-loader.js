import { FilesetResolver, FaceDetector, FaceLandmarker, ImageEmbedder } from "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.8";

globalThis.FilesetResolver = FilesetResolver;
globalThis.FaceDetector = FaceDetector;
globalThis.FaceLandmarker = FaceLandmarker;
globalThis.ImageEmbedder = ImageEmbedder;

console.log("FilesetResolver:", FilesetResolver);
console.log("FaceDetector:", FaceDetector);
console.log("FaceLandmarker:", FaceLandmarker);
console.log("ImageEmbedder:", ImageEmbedder);

console.log("✅ MediaPipe modules imported successfully");