// Orric desk: private dashboard. Reads desk/desk.json from the PRIVATE research repo with the owner's read-only key.
// No data is stored on this site. Every value from the feed is inserted with textContent (issue text is untrusted).
"use strict";
const REPO = "danbuildss/breakra-research";
const FEED = `https://api.github.com/repos/${REPO}/contents/desk/desk.json?ref=main`;
const KEY = "orric-desk-key";

const $ = (id) => document.getElementById(id);
const el = (tag, cls, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = String(text);
  return e;
};
const plain = (md) =>
  String(md || "")
    .replace(/\*\*/g, "")
    .replace(/`/g, "");
const store = {
  get() {
    try {
      return sessionStorage.getItem(KEY) || localStorage.getItem(KEY);
    } catch {
      return null;
    }
  },
  set(v, remember) {
    try {
      (remember ? localStorage : sessionStorage).setItem(KEY, v);
    } catch {}
  },
  clear() {
    try {
      sessionStorage.removeItem(KEY);
      localStorage.removeItem(KEY);
    } catch {}
  },
};
const fmtDate = (iso) =>
  new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }) + " UTC";
const chip = (text, kind) => el("span", `chip${kind ? ` ${kind}` : ""}`, text);
const issueLink = (title, body) =>
  `https://github.com/${REPO}/issues/new?labels=desk&title=${encodeURIComponent(title)}&body=${encodeURIComponent(body)}`;

async function copy(text, btn) {
  try {
    await navigator.clipboard.writeText(text);
    const t = btn.textContent;
    btn.textContent = "Copied";
    setTimeout(() => {
      btn.textContent = t;
    }, 1500);
  } catch {
    btn.textContent = "Copy failed";
  }
}

function render(d) {
  $("when").textContent = `Updated ${fmtDate(d.generated)} · next scan ${fmtDate(d.next_scan)}`;
  const st = $("status-chips");
  st.replaceChildren();
  const s = d.shiplog;
  st.append(
    chip(
      s
        ? s.checks === "passed"
          ? "All checks passed"
          : s.checks === "failed"
            ? "Checks failed: read check.md"
            : "Checks not run"
        : "No Shiplog yet",
      s && s.checks === "passed" ? "ok" : s && s.checks === "failed" ? "bad" : "",
    ),
  );
  st.append(chip("Nothing is posted automatically"));

  // Shiplog
  const sc = $("ship-chips");
  sc.replaceChildren();
  if (s) {
    sc.append(chip(`Signal: ${s.signal}`, s.signal === "post" ? "ok" : s.signal === "maybe" ? "warn" : ""));
    const post = $("ship-post");
    post.replaceChildren(el("span", "", s.post || "(no post this week)"));
    if (s.post_length)
      post.append(
        el(
          "span",
          "meta",
          `${s.post_length} / 280 characters · ${s.thread.length ? `thread of ${s.thread.length} available` : "no thread"} · draft from ${s.date}`,
        ),
      );
    const flat = plain(s.recommendation)
      .replace(/\s*\n\s*-?\s*/g, " ")
      .replace(/\bpost\.md\b/g, "the single post")
      .replace(/\b(\w+)\.md\b/g, "$1");
    const verdict =
      /My recommendation:[^.]*\./i.exec(flat)?.[0] ||
      /[^.]*\b(?:hold|skip|post it)\b[^.]*\./i.exec(flat)?.[0] ||
      flat.split(". ")[0];
    $("ship-rec").textContent = `Orric says: ${verdict.replace(/^My recommendation:\s*/i, "").trim()}`;
    $("ship-rec-full").textContent = plain(s.recommendation);
    $("ship-sources").textContent = plain(s.sources);
    const th = $("ship-thread");
    th.replaceChildren(...s.thread.map((p) => el("li", "", p)));
    $("ship-link").href = `https://github.com/${REPO}/tree/main/${s.dir}`;
    $("copy-post").onclick = (e) => copy(s.post || "", e.currentTarget);
  } else {
    $("ship-post").textContent = "No Shiplog draft yet. It appears after the next scheduled scan.";
  }

  // Waiting on you
  const w = d.waiting,
    o = d.opportunities;
  const engage = o ? o.entries.filter((e) => e.recommendation === "Engage").length : 0;
  const items = [
    [s ? 1 : 0, "Decide on the Shiplog", "Post, edit or skip. About 2 minutes."],
    [engage, "Conversations worth a reply", "GitHub issues where Breakra fits."],
    [w.verdicts, "Findings awaiting your verdict", w.verdicts ? "Open findings/pending/." : "All caught up."],
    [w.replies, "Maintainer replies", w.replies ? "See OUTREACH.md." : "Nothing new."],
  ];
  $("waits").replaceChildren(
    ...items.map(([n, t, sub]) => {
      const li = el("li");
      li.append(el("span", `num${n ? " hot" : ""}`, n));
      const b = el("div");
      b.append(el("b", "", t), el("br"), el("span", "muted", sub));
      li.append(b);
      return li;
    }),
  );
  $("health").textContent = w.healthy
    ? "Health: no problems."
    : `Health needs action: ${w.health.map(plain).join(" · ")}`;

  // Opportunities
  const list = $("opp-list");
  list.replaceChildren();
  if (o && o.entries.length) {
    $("opp-meta").textContent =
      `${o.entries.length} shortlisted from ${o.candidates} public GitHub issues · checks ${o.checks} · replies always say you built Breakra`;
    for (const e of o.entries) {
      const row = el("div", "opp");
      const top = el("div", "opp-top");
      const a = el("a", "", e.title);
      a.href = /^https:\/\//.test(String(e.url)) ? e.url : "#";
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      const right = el("div", "chips");
      right.append(
        chip(`Breakra: ${e.can || "?"}`),
        chip(e.recommendation || "?", e.recommendation === "Engage" ? "ok" : ""),
      );
      top.append(a, right);
      row.append(top, el("div", "muted", e.discussing));
      if (e.why) row.append(el("div", "small", `Why: ${e.why}`));
      const d2 = el("details");
      d2.append(el("summary", "", "Suggested reply"), el("blockquote", "", e.reply));
      const btn = el("button", "btn-ghost btn-sm", "Copy reply");
      btn.type = "button";
      btn.onclick = () => copy(e.reply, btn);
      d2.append(btn);
      row.append(d2);
      list.append(row);
    }
  } else {
    $("opp-meta").textContent = "None this week.";
    list.append(el("p", "muted", "No conversations worth a reply. That's fine."));
  }

  // Counter
  const c = d.counter,
    tiles = $("tiles");
  tiles.replaceChildren();
  if (c) {
    $("counter-meta").textContent =
      `Lifetime, as of ${c.as_of} · breakra@${c.pinned_breakra} · the public draft is yours to publish`;
    const L = c.lifetime;
    const t = [
      [L.apis_analyzed, "Public APIs analyzed"],
      [L.comparisons_completed, "Contract comparisons"],
      [L.breakra_issues.confirmed, "Breakra issues confirmed"],
      [L.breakra_issues.fix_merged, "Breakra fixes merged"],
      [
        `${L.external_contributions.accepted} / ${L.external_contributions.submitted}`,
        "Reports accepted / sent",
      ],
    ];
    for (const [n, label] of t) {
      const x = el("div", "tile");
      x.append(el("b", "", n), el("span", "", label));
      tiles.append(x);
    }
    const ad = c.adoption || {};
    const measured = ["developer_trials", "repeat_usage", "paid_x402_calls"].some((k) => ad[k] != null);
    const x = el("div", `tile${measured ? "" : " none"}`);
    x.append(
      el(
        "b",
        "",
        measured
          ? `${ad.developer_trials ?? "–"} / ${ad.repeat_usage ?? "–"} / ${ad.paid_x402_calls ?? "–"}`
          : "Not measured",
      ),
      el("span", "", "Trials · repeat use · paid calls"),
    );
    tiles.append(x);
  }

  // Breakra issues
  const bi = d.breakra_issues,
    total = bi.confirmed + bi.observed + bi.suspected + bi.fixed || 1;
  const bar = $("bar");
  bar.replaceChildren();
  for (const [n, cls] of [
    [bi.fixed, "b4"],
    [bi.confirmed, "b1"],
    [bi.observed, "b2"],
    [bi.suspected, "b3"],
  ]) {
    const i = el("i", cls);
    i.style.width = `${(100 * n) / total}%`;
    bar.append(i);
  }
  bar.setAttribute(
    "aria-label",
    `${bi.fixed} fixed, ${bi.confirmed} confirmed, ${bi.observed} observed, ${bi.suspected} suspected`,
  );
  const lg = $("legend");
  lg.replaceChildren();
  for (const [n, t] of [
    [bi.confirmed, "confirmed"],
    [bi.observed, "observed"],
    [bi.suspected, "suspected"],
    [bi.fixed, "fixed"],
  ]) {
    const s2 = el("span");
    s2.append(el("b", "", n), document.createTextNode(` ${t}`));
    lg.append(s2);
  }
  $("top-issues").replaceChildren(
    ...bi.top.map((i) => el("li", "", `#${i.id}${i.severity ? ` (${i.severity})` : ""}: ${i.title}`)),
  );

  // To-dos: each opens a prefilled issue in the private repo; Orric reads it next week.
  const prompts = {
    voice: [
      "Voice: my X posts",
      "Paste 10-20 of your real posts (text + link), or attach your X archive's tweets.js.\n\n### date · link\ntext\n",
    ],
    updates: [
      "Product update",
      "One line: what shipped, plus a public link if there is one.\n\nDate: \nUpdate: \nLink: ",
    ],
    handles: ["Handle to tag", "Handle: @\nWho it is: \nOfficial site that links to it: "],
    adoption: ["Adoption counting", "Note for the Breakra workspace (trials, repeat use, paid x402 calls)."],
  };
  $("todos").replaceChildren(
    ...d.todos.map((t) => {
      const li = el("li");
      li.append(el("span", `tick${t.done ? " done" : ""}`));
      const b = el("div");
      b.append(el("b", "", t.label), el("br"), el("span", "muted", t.detail));
      const p = prompts[t.id];
      if (p && !t.done) {
        b.append(el("br"));
        const a = el("a", "", "Add it");
        a.href = issueLink(p[0], p[1]);
        a.target = "_blank";
        a.rel = "noopener";
        b.append(a);
      }
      li.append(b);
      return li;
    }),
  );
}

async function load(token) {
  const res = await fetch(FEED, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github.raw+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    cache: "no-store",
  });
  if (res.status === 401) throw new Error("That key isn't valid (or it expired).");
  if (res.status === 404 || res.status === 403)
    throw new Error(
      "That key can't read the research repo. Give it read access to Contents on breakra-research.",
    );
  if (!res.ok) throw new Error(`GitHub said ${res.status}. Try again in a minute.`);
  return res.json();
}

function show(signedIn) {
  $("signin").hidden = signedIn;
  $("desk").hidden = !signedIn;
  $("nav").hidden = !signedIn;
  $("signout").hidden = !signedIn;
}

async function start(token) {
  try {
    const d = await load(token);
    render(d);
    show(true);
    $("load-error").textContent = "";
    return true;
  } catch (e) {
    show(false);
    $("signin-error").textContent = e.message;
    return false;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  $("signin-form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const t = $("token").value.trim();
    if (!t) return;
    if (await start(t)) {
      store.set(t, $("remember").checked);
      $("token").value = "";
    } else store.clear();
  });
  $("signout").addEventListener("click", () => {
    store.clear();
    show(false);
    $("signin-error").textContent = "";
  });
  const saved = store.get();
  if (saved)
    start(saved).then((ok) => {
      if (!ok) store.clear();
    });
  else show(false);
});
