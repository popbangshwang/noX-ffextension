browser.storage.local.get("blockedWords").then((result) => {
    const words = result.blockedWords || [];
    if (words.length === 0) return;

    function blockWords(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            for (const word of words) {
                node.textContent = node.textContent.replace(
                    new RegExp(word, "gi"),
                    "████"
                );
            }
        } else {
            for (let child of node.childNodes) {
                blockWords(child);
            }
        }
    }
    blockWords(document.body);
});