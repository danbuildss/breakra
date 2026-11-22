// breakra.dev/status (D-046): renders the latest stored check from the `status` branch. Shows only what the
// data says; with no data it says so. The only cross-origin request on the site (CSP allows it on /status only).
(() => {
  const banner = document.getElementById("st-banner");
  if (!banner) return;
  const SRC = banner.dataset.statusSrc;
  const FULL = 7 * 96; // one week of 15-minute checks
  const $ = (id) => document.getElementById(id);
  const esc = (s) =>
    String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const ago = (iso) => {
    const m = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));
    return m < 1 ? "just now" : m < 60 ? `${m} min ago` : `${Math.round(m / 60)} h ago`;
  };
  const utc = (iso) => `${iso.slice(0, 16).replace("T", " ")} UTC`;
  const days90 = () => {
    const out = [];
    const d = new Date();
    for (let i = 89; i >= 0; i--) out.push(new Date(d.getTime() - i * 86400000).toISOString().slice(0, 10));
    return out;
  };

  function render(doc) {
    const latest = doc.latest;
    const ids = Object.keys(doc.services ?? {});
    if (!latest || ids.length === 0) return empty("No checks recorded yet.");
    const results = latest.results ?? {};
    const okCount = ids.filter((id) => results[id]?.ok).length;
    const stale = Date.now() - Date.parse(latest.t) > 60 * 60000;
    const state = okCount === ids.length ? (stale ? "stale" : "ok") : okCount === 0 ? "down" : "partial";
    const label = {
      ok: "All systems operational",
      partial: `${ids.length - okCount} of ${ids.length} checks failing`,
      down: "All checks failing",
      stale: "Last check is over an hour old",
    }[state];
    banner.dataset.state = state;
    $("st-overall").innerHTML = `<span class="sdot" aria-hidden="true"></span>${esc(label)}`;
    $("st-when").textContent = `Last check ${ago(latest.t)} · ${utc(latest.t)}`;

    const uptime = (id) => {
      let ok = 0;
      let total = 0;
      for (const day of days90().slice(-30)) {
        const v = doc.daily?.[day]?.[id];
        if (v) {
          ok += v[0];
          total += v[1];
        }
      }
      if (!total) return "no data";
      const pct = `${((ok / total) * 100).toFixed(total > ok ? 2 : 1)}%`;
      // Until a week of checks exists, show how many the percentage rests on.
      return total < FULL ? `${pct} · ${total} check${total === 1 ? "" : "s"}` : `${pct} (30 d)`;
    };
    $("st-list").innerHTML = ids
      .map((id) => {
        const r = results[id] ?? { ok: false, detail: "not checked" };
        const st = !r.ok ? "down" : r.slow ? "slow" : "ok";
        const word = { ok: "Operational", slow: "Slow", down: "Down" }[st];
        return `<div class="st-row" data-state="${st}">
          <div><p class="st-name">${esc(doc.services[id])}</p><p class="muted small">${esc(r.detail ?? "")}</p></div>
          <p class="st-word"><span class="sdot" aria-hidden="true"></span>${word}</p>
          <p class="mono muted small st-ms">${r.ms == null ? "–" : `${r.ms} ms`}</p>
          <p class="mono muted small st-up">${esc(uptime(id))}</p>
        </div>`;
      })
      .join("");

    $("st-bars").innerHTML = ids
      .map((id) => {
        const cells = days90()
          .map((day) => {
            const v = doc.daily?.[day]?.[id];
            const cls = !v ? "none" : v[0] === v[1] ? "ok" : v[0] === 0 ? "down" : "partial";
            const tip = v ? `${day}: ${v[0]}/${v[1]} OK` : `${day}: no data`;
            return `<span class="cell ${cls}" title="${tip}"></span>`;
          })
          .join("");
        return `<div class="bar-row"><p class="small">${esc(doc.services[id])}</p><div class="cells" role="img" aria-label="${esc(doc.services[id])}, last 90 days">${cells}</div></div>`;
      })
      .join("");
    $("st-started").textContent = doc.started ?? "–";

    const dl = doc.stats?.npm_downloads_last_week;
    $("st-dl").textContent = typeof dl === "number" ? dl.toLocaleString("en-US") : "not available";
    $("st-ver").textContent = doc.stats?.npm_latest ?? "–";

    $("st-recent").innerHTML = (doc.recent ?? [])
      .slice(0, 12)
      .map(
        (r) =>
          `<li><span class="mono">${esc(utc(r.t))}</span><span class="${r.ok === r.total ? "" : "acc"}">${r.ok}/${r.total} OK</span></li>`,
      )
      .join("");
  }

  function empty(msg) {
    banner.dataset.state = "none";
    $("st-overall").textContent = msg;
    $("st-when").textContent =
      "Monitoring checks every 15 minutes; the first results appear after the first run.";
    $("st-list").innerHTML = "";
    $("st-recent").innerHTML = "";
  }

  async function load() {
    $("st-refresh").disabled = true;
    try {
      const res = await fetch(`${SRC}?t=${Date.now()}`, { cache: "no-store" });
      if (res.status === 404) return empty("No checks recorded yet.");
      if (!res.ok) throw new Error(String(res.status));
      render(await res.json());
    } catch {
      banner.dataset.state = "none";
      $("st-overall").textContent = "Couldn't load the latest check.";
      $("st-when").textContent = "The status data is stored on GitHub; try Refresh in a moment.";
    } finally {
      $("st-refresh").disabled = false;
    }
  }
  $("st-refresh").addEventListener("click", load);
  load();
})();
