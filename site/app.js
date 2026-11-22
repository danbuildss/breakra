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

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Tabs (WAI-ARIA: click, arrow keys, Home/End). The "See it work" demo also autoplays until touched.
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
    let stopAuto = () => {};
    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => {
        stopAuto();
        select(tab);
      });
      tab.addEventListener("keydown", (e) => {
        const to = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key];
        if (to === undefined) return;
        e.preventDefault();
        stopAuto();
        const next = tabs[(to + tabs.length) % tabs.length];
        select(next);
        next.focus();
      });
    });
    if (box.classList.contains("demo") && !reduce && "IntersectionObserver" in window) {
      const bar = document.createElement("span");
      bar.className = "demo-progress";
      bar.setAttribute("aria-hidden", "true");
      box.querySelector('[role="tablist"]').appendChild(bar);
      const STEP = 4200;
      let timer = null;
      let visible = false;
      let stopped = false;
      const current = () => tabs.findIndex((t) => t.getAttribute("aria-selected") === "true");
      const animateBar = () => {
        const t = tabs[current()];
        bar.style.transition = "none";
        bar.style.left = `${t.offsetLeft}px`;
        bar.style.width = "0px";
        void bar.offsetWidth;
        bar.style.transition = `width ${STEP}ms linear`;
        bar.style.width = `${t.offsetWidth}px`;
      };
      const tick = () => {
        select(tabs[(current() + 1) % tabs.length]);
        animateBar();
      };
      const run = () => {
        if (stopped || !visible || timer) return;
        animateBar();
        timer = setInterval(tick, STEP);
      };
      const pause = () => {
        clearInterval(timer);
        timer = null;
        bar.style.transition = "none";
        bar.style.width = "0px";
      };
      stopAuto = () => {
        stopped = true;
        pause();
      };
      box.addEventListener("pointerenter", stopAuto);
      box.addEventListener("focusin", stopAuto);
      new IntersectionObserver(
        ([entry]) => {
          visible = entry.isIntersecting;
          visible ? run() : pause();
        },
        { threshold: 0.4 },
      ).observe(box);
    }
  }

  // Scroll reveals: marked grids on the homepage, plus section content on every page.
  const revealables = new Set(document.querySelectorAll("[data-reveal]"));
  for (const el of document.querySelectorAll("main section.wrap:not(.hero):not(.page-hero) > :not(.label)")) {
    if (!el.closest("[data-reveal]") && !el.querySelector("[data-reveal]")) {
      el.setAttribute("data-reveal", "");
      revealables.add(el);
    }
  }
  const countUp = (el) => {
    const target = el.textContent;
    const nums = target.match(/\d+/g);
    if (!nums || reduce) return;
    const t0 = performance.now();
    const D = 900;
    const frame = (now) => {
      const p = Math.min(1, (now - t0) / D);
      const e = 1 - (1 - p) ** 3;
      let i = 0;
      el.textContent = target.replace(/\d+/g, () => String(Math.round(Number(nums[i++]) * e)));
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = target;
    };
    requestAnimationFrame(frame);
  };
  if (reduce || !("IntersectionObserver" in window)) {
    for (const el of revealables) el.classList.add("in");
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("in");
          for (const stat of entry.target.querySelectorAll(".stat")) countUp(stat);
          io.unobserve(entry.target);
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" },
    );
    for (const el of revealables) io.observe(el);
  }
});
