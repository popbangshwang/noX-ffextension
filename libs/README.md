# Libraries

This directory contains third-party libraries used by the noX-ffextension.

## face-api.min.js

The facial recognition library is not included in this repository due to its size. 

### How to get face-api.min.js

**Option 1: Download from CDN (Recommended)**
```bash
curl -o face-api.min.js https://cdn.jsdelivr.net/npm/@vladmandic/face-api/dist/face-api.min.js
```

**Option 2: Use npm**
```bash
npm install @vladmandic/face-api
cp node_modules/@vladmandic/face-api/dist/face-api.min.js ./
```

**Option 3: Manual Download**
Visit https://cdn.jsdelivr.net/npm/@vladmandic/face-api and download the latest `face-api.min.js` file.

### License
face-api.js is licensed under the MIT License. See the official repository for more details: https://github.com/vladmandic/face-api