const whitelistTextarea = document.getElementById("whitelistedUrls");
const saveWhitelistBtn = document.getElementById("saveWhitelist");

// Load whitelist on page load
browser.storage.local.get("whitelistedUrls").then((result) => {
  const whitelist = result.whitelistedUrls || [];
  whitelistTextarea.value = whitelist.join("\n");
});

// Save whitelist when button clicked
saveWhitelistBtn.addEventListener("click", () => {
  const whitelist = whitelistTextarea.value
    .split("\n")
    .map(url => url.trim())
    .filter(url => url.length > 0); // Remove empty lines
  
  browser.storage.local.set({ whitelistedUrls: whitelist }).then(() => {
    alert("Whitelist saved!");
  });
});