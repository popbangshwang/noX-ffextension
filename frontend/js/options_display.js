const blurAmountInput = document.getElementById("blurAmount");
const blurValueDisplay = document.getElementById("blurValue");

// Load blur amount on page load
browser.storage.local.get("blurAmount").then((result) => {
    const blurAmount = result.blurAmount || 20;
    blurAmountInput.value = blurAmount;
    blurValueDisplay.textContent = blurAmount;
});

// Update display and save when slider changes
blurAmountInput.addEventListener("input", (e) => {
    const blurAmount = e.target.value;
    blurValueDisplay.textContent = blurAmount;

    browser.storage.local.set({ blurAmount: parseInt(blurAmount) });
});