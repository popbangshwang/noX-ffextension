browser.storage.local.get("blockedWords").then((result) => {
  const words = result.blockedWords || [];
  if (words.length === 0) return;

  // Blur images whose alt attribute contains a blocked word
  const images = document.querySelectorAll("img");
  images.forEach((img) => {
    for (const word of words) {
      if (img.alt && new RegExp(word, "i").test(img.alt)) {
        img.style.filter = "blur(20px)";
      }
    }
  });

  // Blur text nodes and their parent/sibling elements as before
  function blockWords(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      for (const word of words) {
        if (new RegExp(word, "i").test(node.textContent)) {
          node.parentNode.style.filter = "blur(20px)";
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