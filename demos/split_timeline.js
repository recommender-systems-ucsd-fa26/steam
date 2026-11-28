// Two views of the evaluation protocol.
//   "split":   reviews per week, coloured by train / validation / test
//   "visible": a few users' 2017 reviews; hover one to see what the model may use to predict it
//
// Model: { "url": "split_timeline.json", "view": "split" | "visible" } with JSON keys
//   start (first week), weeks [reviews per week], cuts [validation start, test start], zoom (first day of the
//   "visible" view), users [{ "d": [dates], "t": [titles], "p": [prices] }]

const W = 700;
const L = 56;
const R = 10;
const LANE = 28;
const DAY = 864e5;
const COLOR = { train: "#4c78a8", val: "#f58518", test: "#54a24b" };
const NAME = { train: "train", val: "validation", test: "test" };
const RED = "#e45756";

const date = (ms, opts) => new Date(ms).toLocaleDateString("en-US", { timeZone: "UTC", ...opts });

function splitView(data, split, [t1, t2]) {
  const Y0 = 66;
  const Y1 = 160;
  const start = Date.parse(data.start);
  const end = start + data.weeks.length * 7 * DAY;
  const x = (ms) => L + ((ms - start) / (end - start)) * (W - L - R);
  const top = [...data.weeks].sort((a, b) => a - b)[Math.floor(data.weeks.length * 0.985)];
  const bw = (W - L - R) / data.weeks.length;
  const bars = data.weeks.map((n, i) => {
    const ms = start + i * 7 * DAY;
    const h = Math.min(n / top, 1) * (Y1 - Y0);
    return `<rect data-w="${i}" x="${x(ms)}" y="${Y0}" width="${bw + 0.3}" height="${Y1 - Y0}" fill="transparent"/>
      <rect data-w="${i}" x="${x(ms)}" y="${Y1 - h}" width="${bw + 0.3}" height="${h}" fill="${COLOR[split(ms)]}"/>`;
  });
  const years = [2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018].map((y) =>
    `<text x="${x(Date.UTC(y, 0, 1))}" y="${Y1 + 14}" font-size="10" fill="#888" text-anchor="middle">${y}</text>`);
  const before = (ms) => `, before ${date(ms, { day: "numeric", month: "short", year: "numeric" })}`;
  const labels = [[end, "test", "newest 10%"], [t2, "val", `next 10%${before(t2)}`], [t1, "train", `oldest 80% of reviews${before(t1)}`]]
    .map(([ms, s, text], k) =>
      `<line x1="${x(ms)}" x2="${x(ms)}" y1="${20 + k * 16}" y2="${Y1}" stroke="${COLOR[s]}" stroke-dasharray="3 3"/>
       <text x="${x(ms) - 5}" y="${16 + k * 16}" font-size="11" fill="${COLOR[s]}" text-anchor="end" font-weight="600">${NAME[s]}: ${text}</text>`);
  const axis = `<text x="${L}" y="${Y0 - 6}" font-size="10" fill="#888">reviews per week</text>`;
  return { height: Y1 + 20, html: bars.join("") + years.join("") + labels.join("") + axis };
}

function visibleView(data, split, [t1, t2], target) {
  const zoom = Date.parse(data.zoom);
  const end = Date.parse(data.start) + data.weeks.length * 7 * DAY;
  const x = (ms) => L + ((ms - zoom) / (end - zoom)) * (W - L - R);
  const users = data.users.map((u) => u.d.map(Date.parse));
  const day = users[target.u][target.i];
  const bottom = 40 + users.length * LANE;
  const bands = [[zoom, t1, "train"], [t1, t2, "val"], [t2, end, "test"]].map(([a, b, s]) =>
    `<rect x="${x(a)}" y="0" width="${x(b) - x(a)}" height="${bottom}" fill="${COLOR[s]}" opacity="0.13"/>
     <text x="${(x(a) + x(b)) / 2}" y="14" font-size="11" fill="${COLOR[s]}" text-anchor="middle" font-weight="600">${NAME[s]}</text>`);
  const months = [0, 3, 6, 9, 12].map((m) => {
    const ms = Date.UTC(2017, m, 1);
    return `<text x="${x(ms)}" y="${bottom + 14}" font-size="10" fill="#888" text-anchor="middle">${date(ms, { month: "short", year: "numeric" })}</text>`;
  });
  const cut = `<rect x="${x(day)}" y="20" width="${W - R - x(day)}" height="${bottom - 20}" fill="#8883"/>
    <line x1="${x(day)}" x2="${x(day)}" y1="20" y2="${bottom}" stroke="${RED}" stroke-dasharray="4 3"/>
    <text x="${x(day) - 6}" y="32" font-size="10" fill="#888" text-anchor="end">model sees</text>
    ${W - R - x(day) > 44 ? `<text x="${x(day) + 6}" y="32" font-size="10" fill="#888">hidden</text>` : ""}`;
  const lanes = users.map((ms, r) => {
    const y = 40 + r * LANE + LANE / 2;
    const dots = ms.map((d, j) => {
      const me = r === target.u && j === target.i;
      const seen = d < day;
      return `<circle data-u="${r}" data-i="${j}" cx="${x(d)}" cy="${y}" r="${me ? 7 : 4.5}"
        fill="${me ? RED : seen ? COLOR[split(d)] : "none"}" stroke="${me || seen ? "transparent" : "#888"}"
        stroke-width="${me || seen ? 10 : 1.5}" pointer-events="all" style="cursor:pointer"/>`;
    });
    return `<text x="4" y="${y + 4}" font-size="11" fill="#888">user ${r + 1}</text>
      <line x1="${L}" x2="${W - R}" y1="${y}" y2="${y}" stroke="#8883"/>${dots.join("")}`;
  });
  return { height: bottom + 20, html: bands.join("") + months.join("") + cut + lanes.join("") };
}

async function render({ model, el }) {
  const data = await (await fetch(new URL(model.get("url"), import.meta.url))).json();
  const cuts = data.cuts.map(Date.parse);
  const split = (ms) => (ms < cuts[0] ? "train" : ms < cuts[1] ? "val" : "test");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.style.cssText = `width:100%;max-width:${W}px;height:auto;display:block`;
  el.style.margin = "20px 0 28px";
  const draw = ({ height, html }) => {
    svg.setAttribute("viewBox", `0 0 ${W} ${height}`);
    svg.innerHTML = html;
  };

  if (model.get("view") !== "visible") {
    const tip = document.createElement("div");
    tip.style.cssText = "position:absolute;display:none;pointer-events:none;white-space:nowrap;"
      + "background:#222;color:#fff;font-size:12px;padding:4px 8px;border-radius:4px";
    el.style.position = "relative";
    el.append(svg, tip);
    draw(splitView(data, split, cuts));
    const start = Date.parse(data.start);
    const total = data.weeks.reduce((a, b) => a + b, 0);
    const before = data.weeks.map(((s) => (n) => (s += n))(0));
    svg.addEventListener("pointermove", (e) => {
      const i = e.target.dataset?.w;
      if (i === undefined) {
        tip.style.display = "none";
        return;
      }
      const ms = start + Number(i) * 7 * DAY;
      tip.innerHTML = `<b>week of ${date(ms, { day: "numeric", month: "short", year: "numeric" })}</b><br>`
        + `${data.weeks[i].toLocaleString()} reviews (${NAME[split(ms)]})<br>${((100 * before[i]) / total).toFixed(1)}% of all reviews so far`;
      tip.style.display = "block";
      const box = el.getBoundingClientRect();
      const left = e.clientX - box.left;
      tip.style.left = `${left > box.width / 2 ? left - 12 - tip.offsetWidth : left + 12}px`;
      tip.style.top = `${e.clientY - box.top - 64}px`;
    });
    svg.addEventListener("pointerleave", () => { tip.style.display = "none"; });
    return;
  }

  const legend = document.createElement("div");
  legend.style.cssText = "font-size:12px;opacity:0.85;margin-bottom:6px";
  legend.innerHTML = `<span style="display:inline-block;width:10px;height:10px;background:${RED};border-radius:50%"></span> review being predicted &nbsp; `
    + `<span style="display:inline-block;width:8px;height:8px;border:1.5px solid #888;border-radius:50%"></span> hidden from the model &nbsp; `
    + `<span style="opacity:0.7">(hover a review)</span>`;
  el.append(legend, svg);
  let target = { u: 0, i: data.users[0].d.length - 1 };
  draw(visibleView(data, split, cuts, target));
  svg.addEventListener("pointerover", (e) => {
    const { u, i } = e.target.dataset ?? {};
    if (u === undefined || Number(i) === 0) return;
    target = { u: Number(u), i: Number(i) };
    draw(visibleView(data, split, cuts, target));
  });
}

export default { render };
