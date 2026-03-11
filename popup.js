const configBtn = document.getElementById("configBtn");
configBtn.onclick = () => {
  browser.runtime.openOptionsPage();
};