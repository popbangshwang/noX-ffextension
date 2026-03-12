const blockedWordsToggle = document.getElementById("blockedWordsToggle");
const blockedFacesToggle = document.getElementById("blockedFacesToggle");

// Load saved toggle states
browser.storage.local.get(["blockedWordsEnabled", "blockedFacesEnabled"]).then((result) => {
  blockedWordsToggle.checked = result.blockedWordsEnabled !== false; // Default to true
  blockedFacesToggle.checked = result.blockedFacesEnabled !== false; // Default to true
});

// Save toggle states
blockedWordsToggle.addEventListener("change", (e) => {
  browser.storage.local.set({ blockedWordsEnabled: e.target.checked });
});

blockedFacesToggle.addEventListener("change", (e) => {
  browser.storage.local.set({ blockedFacesEnabled: e.target.checked });
});