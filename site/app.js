// Copy buttons: copy the text of the element named in data-copy. No tracking, no network calls.
for (const button of document.querySelectorAll("button[data-copy]")) {
  button.addEventListener("click", async () => {
    const target = document.querySelector(button.dataset.copy);
    if (!target) return;
    try {
      await navigator.clipboard.writeText(target.textContent.trim());
      button.textContent = "Copied";
      button.dataset.state = "done";
    } catch {
      button.textContent = "Select & copy";
    }
    setTimeout(() => {
      button.textContent = "Copy";
      delete button.dataset.state;
    }, 1600);
  });
}
