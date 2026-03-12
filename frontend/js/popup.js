const configBtn = document.getElementById("configBtn");
const extensionToggle = document.getElementById("extensionToggle");
const toggleStatus = document.getElementById("toggleStatus");

// Open options page when config button clicked
configBtn.addEventListener("click", () => {
  browser.runtime.openOptionsPage();
});

// Load toggle state on page load
browser.storage.local.get("extensionEnabled").then((result) => {
  const isEnabled = result.extensionEnabled !== false;
  extensionToggle.checked = isEnabled;
  updateToggleStatus(isEnabled);
});

// Handle toggle switch
extensionToggle.addEventListener("change", (e) => {
  const isEnabled = e.target.checked;
  browser.storage.local.set({ extensionEnabled: isEnabled });
  updateToggleStatus(isEnabled);
  
  // Reload active tab to apply changes
  browser.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
    if (tabs[0]) {
      browser.tabs.reload(tabs[0].id);
    }
  });
});

function updateToggleStatus(isEnabled) {
  toggleStatus.textContent = isEnabled ? "Extension enabled" : "Extension disabled";
}