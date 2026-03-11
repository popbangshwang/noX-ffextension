const similarityThreshold = document.getElementById("similarityThreshold");
const thresholdValue = document.getElementById("thresholdValue");

// Load saved threshold
browser.storage.local.get("similarityThreshold").then((result) => {
  const threshold = result.similarityThreshold || 0.8;
  similarityThreshold.value = threshold;
  thresholdValue.textContent = threshold.toFixed(2);
});

// Update threshold on change
similarityThreshold.addEventListener("input", (e) => {
  const value = parseFloat(e.target.value);
  thresholdValue.textContent = value.toFixed(2);
  browser.storage.local.set({ similarityThreshold: value });
});