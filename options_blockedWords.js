const input = document.getElementById("wordInput");
const addBtn = document.getElementById("addBtn");
const wordList = document.getElementById("wordList");

function render(words) {
  wordList.innerHTML = "";
  words.forEach((word, idx) => {
    const li = document.createElement("li");
    li.textContent = word;
    const rm = document.createElement("button");
    rm.textContent = "Remove";
    rm.onclick = () => {
      words.splice(idx, 1);
      browser.storage.local.set({ blockedWords: words });
      render(words);
    };
    li.appendChild(rm);
    wordList.appendChild(li);
  });
}

browser.storage.local.get("blockedWords").then((result) => {
  const words = result.blockedWords || [];
  render(words);
});

addBtn.onclick = () => {
  browser.storage.local.get("blockedWords").then((result) => {
    const words = result.blockedWords || [];
    const newWord = input.value.trim();
    if (newWord && !words.includes(newWord)) {
      words.push(newWord);
      browser.storage.local.set({ blockedWords: words });
      render(words);
      input.value = "";
    }
  });
};