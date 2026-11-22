document.documentElement.classList.add("js");

// Vercel Web Analytics
window.va =
  window.va ||
  function () {
    // biome-ignore lint/complexity/noArguments: Required by Vercel Analytics SDK
    // biome-ignore lint/suspicious/noAssignInExpressions: Required by Vercel Analytics SDK
    (window.vaq = window.vaq || []).push(arguments);
  };
