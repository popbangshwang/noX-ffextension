# noX-ffextension Development Plan

## Goal
Build a Firefox extension that blocks user-specified words and, eventually, images/faces related to those words.

## Features

1. **Block specified words on web pages**
   - User can add/remove words via settings popup
        - example 'trump'

2. **Extensible architecture**
   - Easy to add new blocking rules (text, images, faces)

3. **Future: Block images/faces**
   - Use face recognition to block images of specific people

## Steps

1. Set up extension structure and manifest
2. Implement content script to block words
3. Create popup for user configuration
4. Store blocked words in extension storage
5. (Future) Add options page for advanced settings
6. (Future) Add image/face blocking logic
7. Add OCR support for images. Some image embed text into the image, so using OCR we can perhaps skip the step of having to use facial recognition and just rely on the text in the image.
8. Database of phrases that the person says. save along as a pair 'Trump:Billions and Billions' compare OCR and could even compare to text on page.

## Notes

- Start simple, expand features step by step
- Keep code modular for easy upgrades

## Libraries

- [face-api.js](https://github.com/justadudewhohacks/face-api.js) (for face detection and recognition)
- Models: FaceNet, ArcFace (compatible with face-api.js)
- [ONNX Runtime Web](https://github.com/microsoft/onnxruntime) (optional, for advanced inference)
- [Transformers.js](https://xenova.github.io/transformers.js/) (optional, for CLIP fallback)

## Installation & Usage

### Installing

1. Clone this repository:
   ```
   git clone https://github.com/yourusername/noX-ffextension.git
   ```
2. Download face-api.js and required models, place them in the `libs/` and `models/` directories.

### Loading in Firefox

1. Open Firefox and go to `about:debugging`.
2. Click "This Firefox" > "Load Temporary Add-on".
3. Select the `manifest.json` file from your project directory.

### Usage

- Click the extension icon to open the settings popup.
- Add words you want to block.
- The extension will blur or hide those words on web pages.
- (Future) Images/faces matching blocked identities will also be blurred.

## Future: Face Recognition & Image Blocking

### Approach

- Use face recognition (not CLIP) for identity matching.
- Pipeline:
    1. Detect faces in images on the page.
    2. Align faces.
    3. Generate face embeddings (vectors).
    4. Compare embeddings with stored identities (e.g., Trump).
    5. If similarity > threshold, block/blur image.

### Libraries & Models

- face-api.js (browser-compatible)
- Models: FaceNet, ArcFace

### Storage

- Store embeddings in a small JSON file (e.g., embeddings.json).
- Example: `{ "donald_trump": [[0.12, -0.33, ...], ...] }`

### Performance

- Face detection: 10–40 ms/image
- Embedding: 5–15 ms/image
- Comparison: <1 ms

### Optional Cloud Matching

- Compute embedding locally, send vector to server for large-scale matching.
- Privacy-friendly: Only vectors sent, not images.

### Challenges

- Tiny/blurry faces, profile angles, memes.
- Cross-origin image access.

### Final Pipeline

1. Scan text nodes (block keywords)
2. Scan images (block faces)
3. Skip small images (<120px)
4. Detect faces
5. Generate embeddings
6. Compare with blocked identities
7. Blur image if match

---