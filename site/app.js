// Small progressive enhancements. No tracking, no network calls; the page works without this file.
const root = document.documentElement;

// Theme: dark by default; the choice is remembered on this device only.
try {
  const saved = localStorage.getItem("theme");
  if (saved === "light" || saved === "dark") root.dataset.theme = saved;
} catch {}
document.addEventListener("DOMContentLoaded", () => {
  for (const button of document.querySelectorAll("[data-theme-toggle]")) {
    button.addEventListener("click", () => {
      const next = root.dataset.theme === "light" ? "dark" : "light";
      root.dataset.theme = next;
      try {
        localStorage.setItem("theme", next);
      } catch {}
    });
  }

  // Copy buttons: copy the text of the element named in data-copy (minus an optional prompt prefix).
  for (const button of document.querySelectorAll("button[data-copy]")) {
    button.addEventListener("click", async () => {
      const target = document.querySelector(button.dataset.copy);
      if (!target) return;
      let text = target.textContent.trim();
      const strip = button.dataset.strip;
      if (strip && text.startsWith(strip)) text = text.slice(strip.length);
      try {
        await navigator.clipboard.writeText(text);
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

  // Menus: one open at a time; close on outside click, Escape or following a link.
  const menus = [...document.querySelectorAll("details.menu, details.mobile-nav")];
  const closeAll = (except) => {
    for (const m of menus) if (m !== except) m.open = false;
  };
  for (const m of menus) {
    m.addEventListener("toggle", () => m.open && closeAll(m));
    for (const a of m.querySelectorAll("a")) a.addEventListener("click", () => (m.open = false));
  }
  document.addEventListener("click", (e) => {
    if (!menus.some((m) => m.contains(e.target))) closeAll();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const open = menus.find((m) => m.open);
    if (open) {
      open.open = false;
      open.querySelector("summary").focus();
    }
  });

  // "See it work" tabs (WAI-ARIA tabs: click, arrow keys, Home/End).
  for (const box of document.querySelectorAll("[data-tabs]")) {
    const tabs = [...box.querySelectorAll('[role="tab"]')];
    const select = (tab) => {
      for (const t of tabs) {
        const on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
      }
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => select(tab));
      tab.addEventListener("keydown", (e) => {
        const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
        if (to === undefined) return;
        e.preventDefault();
        const next = tabs[(to + tabs.length) % tabs.length];
        select(next);
        next.focus();
      });
    });
  }
});
