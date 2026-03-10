browser.storage.local.get("blockedWords").then((result) => {
  const words = result.blockedWords || [];
  if (words.length === 0) return;

  function blockWords(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      for (const word of words) {
        if (new RegExp(word, "i").test(node.textContent)) {
          // Blur the parent element
          node.parentNode.style.filter = "blur(5px)";
        }
      }
    } else {
      for (let child of node.childNodes) {
        blockWords(child);
      }
    }
  }

  blockWords(document.body);
});