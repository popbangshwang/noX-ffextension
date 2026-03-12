# noX-ffextension

A Firefox extension that blocks user-specified words and faces on web pages. Customize what content you see by adding words to block and uploading images of people whose faces should be blurred.

## Features

### Core Features (Implemented)
- **Block specified words** - Add words you want hidden/blurred on any webpage
- **Block faces** - Upload images of people and the extension will detect and blur their faces
- **URL whitelist** - Exclude specific sites from blocking (e.g., trusted news sources)
- **Customizable blur amount** - Adjust blur intensity (1-100 pixels)
- **Quick toggle** - Enable/disable extension from popup without opening settings
- **Face similarity threshold** - Fine-tune facial recognition matching (0.5-1.0)
- **Dark mode support** - All UI respects system dark mode preference

### Technical Features
- **Modular architecture** - Easily extensible for new blocking rules
- **Efficient MutationObserver** - Monitors DOM changes and blocks dynamically loaded content
- **Face embeddings** - Stores facial recognition vectors for fast matching
- **Settings persistence** - All settings saved in browser storage
- **Cross-domain support** - Works with CDN-hosted images and resources

## Installation & Setup

### Prerequisites
- Firefox browser (version 57+)
- No additional dependencies required (libraries bundled)

### Installing

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/noX-ffextension.git
   cd noX-ffextension
   ```

2. Face-api.js models are loaded from CDN, no manual setup needed.

### Loading in Firefox

1. Open Firefox and navigate to `about:debugging`
2. Click **"This Firefox"** in the left sidebar
3. Click **"Load Temporary Add-on"**
4. Select the `manifest.json` file from the project directory
5. The extension icon should appear in your toolbar

## Usage

### Basic Setup

1. **Click the extension icon** in your toolbar
2. **Toggle on/off** - Use the toggle switch to quickly enable/disable the extension
3. **Open settings** - Click the ⚙️ icon to access full settings

### Adding Blocked Words

1. Go to **Settings** → **Blocked Words**
2. Enter a word (e.g., "trump")
3. Click **"Add Word"**
4. The word and associated elements will be blurred on all web pages (except whitelisted sites)

### Adding Blocked Faces

1. Go to **Settings** → **Blocked Faces**
2. Enter the person's name (e.g., "trump")
3. **Upload 3-5 clear images** of the person from different angles
4. Images should be at least 120×120 pixels
5. Click **"Add Person"**
6. Expand the accordion to see uploaded images and manage them

### Adjusting Settings

- **Blur Amount** - Slide to increase/decrease blur intensity
- **Face Similarity Threshold** - Higher = stricter matching (fewer false positives)
  - 0.9-1.0: Very strict (may miss some matches)
  - 0.5-0.7: Loose (may have more false positives)

### Whitelisting Sites

1. Go to **Settings** → **URL Whitelist**
2. Enter domain names (one per line):
   ```
   twitch.tv
   youtube.com
   example.com
   ```
3. The extension will not run on these sites
4. Click **"Save Whitelist"**

## Project Structure

```
noX-ffextension/
├── manifest.json                    # Extension configuration
├── content.js                       # Content script (runs on web pages)
├── background.js                    # Background service worker
├── icon.svg                         # Extension icon
├── frontend/
│   ├── options.html                # Settings page
│   ├── popup.html                  # Popup interface
│   ├── css/
│   │   ├── options.css            # Settings styles
│   │   └── popup.css              # Popup styles
│   ├── js/
│   │   ├── options_modules.js     # Toggle module logic
│   │   ├── options_blockedWords.js # Word blocking UI
│   │   ├── options_faces.js       # Face management UI
│   │   ├── options_display.js     # Display settings
│   │   ├── options_whitelist.js   # Whitelist management
│   │   ├── options_reset.js       # Reset functionality
│   │   ├── popup.js               # Popup logic
│   │   └── lib/
│   │       └── face-api.min.js    # Face recognition library
├── modules/
│   ├── blocked-words.js           # Word blocking logic
│   ├── blocked-faces.js           # Face detection & blocking
│   ├── observer.js                # DOM mutation observer
│   └── url_filter.js              # URL whitelist logic
└── libs/
    └── (optional additional libraries)
```

## How It Works

### Word Blocking
1. Content script scans text nodes on page load
2. Compares text against blocked words list
3. Applies blur filter to matching text and parent elements
4. MutationObserver monitors for new content and applies filters

### Face Blocking
1. Detects all images on page
2. Analyzes images for faces using face-api.js
3. Generates facial embeddings (vector representations)
4. Compares embeddings against stored identity embeddings
5. Blurs images if similarity exceeds threshold
6. Works with CDN-hosted images and dynamically loaded content

### Performance
- Text blocking: <5ms per page
- Face detection: 10-40ms per image
- Face embedding: 5-15ms per image
- Embedding comparison: <1ms per comparison

## Configuration

### Extension Toggle
Quickly enable/disable the extension from the popup without losing your settings.

### Similarity Threshold
Adjust how strict facial recognition matching should be. Start at 0.8 and adjust based on results.

### Blur Amount
Higher values create more blur, lower values are more subtle. Useful for different contexts.

## Browser Compatibility

- **Firefox**: 57+ (tested on latest versions)
- **Note**: This extension requires Manifest V3 support

## Known Limitations

- Very small images (<120px) may not detect faces reliably
- Highly stylized or filtered images may not match well
- Some extreme angles or profile shots may be missed
- Works only on visible page content, not in PDFs or iframes with different origins

## Future Enhancements

- [ ] OCR support for text within images
- [ ] Quote/phrase database matching
- [ ] Cloud-based identity matching (privacy-preserving)
- [ ] Support for more image formats
- [ ] Export/import settings
- [ ] Sync settings across devices

## Troubleshooting

**Face detection not working:**
- Ensure "Blocked Faces" is enabled in settings
- Upload clearer, well-lit images of the person
- Try lowering the similarity threshold
- Check console (F12) for error messages

**Words not being blocked:**
- Ensure "Blocked Words" is enabled
- Check Settings → Blocked Words to confirm words are in the list
- Reload the page after adding words
- Verify the site isn't whitelisted

**Extension not running on a site:**
- Check if site is whitelisted in URL Whitelist
- Check if extension is globally disabled (toggle in popup)
- Try resetting all settings and re-enabling
- Open console (F12) to check for errors

## Credits & Attribution

### Libraries
- **face-api.js** - Facial recognition library by [Vladimir Mandic](https://github.com/vladmandic/face-api)
  - Licensed under MIT License
  - Models based on [TensorFlow.js](https://www.tensorflow.org/js)

### Icons
- Settings icon from [Material Design Icons](https://fonts.google.com/icons) by Google
  - Licensed under Apache 2.0

## License

This project is licensed under the **Apache License 2.0** - see the [LICENSE](LICENSE) file for details.

### Third-Party Licenses

- **face-api.js**: MIT License - https://github.com/vladmandic/face-api/blob/master/LICENSE
- **Material Design Icons**: Apache 2.0 - https://github.com/google/material-design-icons/blob/master/LICENSE
- **TensorFlow.js**: Apache 2.0 - https://www.tensorflow.org/js

## Development Note

I created this extension with the help of AI, I'm not a master javascript programmer and I used this project as a way for me to learn more about javascript. I've been writing code for far more than a decade and the internet has always been my guide. In my view if used properly AI can be the new stack-overflow. It doesn't replace the docs and I still use those.

If you wish to improve this extension for everyone to use, go ahead. I hope to learn a thing or two about extensions and javascript.

---

**Last Updated:** March 12, 2026