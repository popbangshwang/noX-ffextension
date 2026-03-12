const resetBtn = document.getElementById("resetBtn");

resetBtn.addEventListener("click", () => {
  if (confirm("Are you sure? This will delete all your settings and blocked words/faces.")) {
    browser.storage.local.clear().then(() => {
      alert("All settings have been reset to defaults!");
      location.reload();
    });
  }
});