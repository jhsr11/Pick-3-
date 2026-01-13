// KS Pick 3 Grid System
// Derived lines:
//   Mirror  = +5
//   Flip↓   = +3
//   Flip↑   = -3
// Touching combos: 8-direction (diagonals), NO reuse of cells

function shiftDigit(d, k) {
  return (d + k + 10) % 10;
}

function validate3(n) {
  const s = String(n).trim();
  if (!/^\d{3}$/.test(s)) throw new Error("Input must be exactly 3 digits (000–999).");
  return { str: s, digits: s.split("").map(ch => parseInt(ch, 10)) };
}

// Mirror = +5
function mirrorNumber(nStr) {
  const { digits } = validate3(nStr);
  return digits.map(d => shiftDigit(d, 5)).join("");
}

// Flip below = +3
function flipBelow(nStr) {
  const { digits } = validate3(nStr);
  return digits.map(d => shiftDigit(d, 3)).join("");
}

// Flip above = -3
function flipAbove(nStr) {
  const { digits } = validate3(nStr);
  return digits.map(d => shiftDigit(d, -3)).join("");
}

function buildGrid(a, b, c) {
  return [a.split(""), b.split(""), c.split("")];
}

const NEIGHBORS_8 = [
  [-1,-1], [-1,0], [-1,1],
  [ 0,-1],         [ 0,1],
  [ 1,-1], [ 1,0], [ 1,1],
];

function inBounds(r, c) {
  return r >= 0 && r < 3 && c >= 0 && c < 3;
}

function touchingCombos3(grid) {
  const combos = new Set();

  for (let r0 = 0; r0 < 3; r0++) {
    for (let c0 = 0; c0 < 3; c0++) {

      for (const [dr1, dc1] of NEIGHBORS_8) {
        const r1 = r0 + dr1, c1 = c0 + dc1;
        if (!inBounds(r1, c1)) continue;

        for (const [dr2, dc2] of NEIGHBORS_8) {
          const r2 = r1 + dr2, c2 = c1 + dc2;
          if (!inBounds(r2, c2)) continue;

          // no reuse
          if ((r2 === r0 && c2 === c0) || (r2 === r1 && c2 === c1)) continue;

          combos.add(grid[r0][c0] + grid[r1][c1] + grid[r2][c2]);
        }
      }

    }
  }

  return Array.from(combos).sort((a, b) => Number(a) - Number(b));
}

function runSystem(nStr) {
  const { str } = validate3(nStr);
  const m = mirrorNumber(str);
  const fb = flipBelow(str);
  const fa = flipAbove(str);

  const grid = buildGrid(m, fb, fa);
  const combos = touchingCombos3(grid);

  return {
    input: str,
    mirror: m,
    flipBelow: fb,
    flipAbove: fa,
    grid,
    combos,
    count: combos.length,
  };
}

function makeReport(r) {
  const g1 = r.grid[0].join(" ");
  const g2 = r.grid[1].join(" ");
  const g3 = r.grid[2].join(" ");

  return [
    `Input: ${r.input}`,
    `Mirror: ${r.mirror}`,
    `Flip↓:  ${r.flipBelow}`,
    `Flip↑:  ${r.flipAbove}`,
    ``,
    `Grid:`,
    g1,
    g2,
    g3,
    ``,
    `Combos count: ${r.count}`,
    `Combos:`,
    r.combos.join(" ")
  ].join("\n");
}

// ===== UI =====
const $ = (id) => document.getElementById(id);

function setStatus(msg, ok=true) {
  const el = $("status");
  el.textContent = msg;
  el.className = "status " + (ok ? "ok" : "bad");
}

function renderGrid(grid) {
  const g = $("grid");
  g.innerHTML = "";
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const div = document.createElement("div");
      div.className = "cell";
      div.textContent = grid[r][c];
      g.appendChild(div);
    }
  }
}

function renderResult(r) {
  $("outCard").style.display = "block";
  $("derived").textContent = `Mirror: ${r.mirror}   Flip↓: ${r.flipBelow}   Flip↑: ${r.flipAbove}`;
  renderGrid(r.grid);
  $("count").textContent = String(r.count);
  $("combos").value = r.combos.join(" ");

  $("copyCombosBtn").disabled = false;
  $("copyReportBtn").disabled = false;
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

$("runBtn").addEventListener("click", () => {
  try {
    const raw = $("inp").value.trim();
    const r = runSystem(raw);
    window.__LAST = r; // store last run for copy report
    renderResult(r);
    setStatus(`OK. Generated ${r.count} combos from ${r.input}.`);
  } catch (e) {
    $("outCard").style.display = "none";
    $("copyCombosBtn").disabled = true;
    $("copyReportBtn").disabled = true;
    setStatus(e.message || String(e), false);
  }
});

$("copyCombosBtn").addEventListener("click", async () => {
  const text = $("combos").value;
  const ok = await copyText(text);
  if (ok) setStatus("Copied combos to clipboard.");
  else {
    $("combos").focus();
    $("combos").select();
    setStatus("Clipboard blocked. Select-all fallback: press and hold → Copy.", false);
  }
});

$("copyReportBtn").addEventListener("click", async () => {
  if (!window.__LAST) return;
  const report = makeReport(window.__LAST);
  const ok = await copyText(report);
  if (ok) setStatus("Copied full report to clipboard.");
  else {
    $("combos").focus();
    $("combos").select();
    setStatus("Clipboard blocked. Fallback: copy the combos field manually.", false);
  }
});

$("clearBtn").addEventListener("click", () => {
  $("inp").value = "";
  $("outCard").style.display = "none";
  $("copyCombosBtn").disabled = true;
  $("copyReportBtn").disabled = true;
  $("status").textContent = "";
  window.__LAST = null;
});

// Enter key runs
$("inp").addEventListener("keydown", (e) => {
  if (e.key === "Enter") $("runBtn").click();
});

// Offline service worker
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(() => {});
  });
                                 }
