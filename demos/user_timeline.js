// One user's review history: reviewed prices in order, hover for the game.
// The red dot is the last review, the one a model would have to predict.
//
// Model: { "users": [{ "user_id": id, "d": [dates], "t": [titles], "p": [prices] }, ...] }
//    or: { "url": "user_timelines.json" }  (same list, fetched; used by the {anywidget} directive in the book)
// Optional: { "start": user_id }  (user shown first; otherwise random)

const W = 700;
const H = 260;
const CAP = 80;
const BLUE = "#4c78a8";
const RED = "#e45756";

const y = (p) => H - 40 - (Math.log1p(Math.min(p, CAP)) / Math.log1p(CAP)) * (H - 60);
const dot = (color) => `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${color}"></span>`;

async function render({ model, el }) {
  const url = model.get("url");
  const users = url ? await (await fetch(new URL(url, import.meta.url))).json() : model.get("users");
  const start = users.find((u) => u.user_id === model.get("start"));

  const btn = document.createElement("button");
  const info = document.createElement("span");
  const legend = document.createElement("div");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", W);
  svg.setAttribute("height", H);
  btn.textContent = "random user";
  legend.style.cssText = "font-size:12px;opacity:0.8;margin-top:6px";
  legend.innerHTML = `${dot(BLUE)} earlier reviews (what the model sees) &nbsp; ${dot(RED)} next review (what we predict)`;
  const tip = document.createElement("div");
  tip.style.cssText = "position:absolute;display:none;pointer-events:none;white-space:nowrap;"
    + "background:#222;color:#fff;font-size:12px;padding:4px 8px;border-radius:4px";
  el.style.position = "relative";
  el.classList.add("tex2jax_ignore", "mathjax_ignore"); // keep "$" as text in the HTML export
  el.append(btn, " ", info, legend, svg, tip);
  let current = null;

  const draw = (u) => {
    current = u;
    tip.style.display = "none";
    const n = u.p.length;
    const x = (i) => 40 + (i * (W - 60)) / (n - 1);
    const ticks = [0, 10, 30, CAP].map(
      (t) => `<text x="0" y="${y(t) + 4}" font-size="10" fill="#888">$${t}${t === CAP ? "+" : ""}</text>`);
    const dots = u.p.map((p, i) => {
      const last = i === n - 1;
      return `<circle data-i="${i}" cx="${x(i)}" cy="${y(p)}" r="${last ? 7 : 4}" fill="${last ? RED : BLUE}"
        stroke="transparent" stroke-width="12" style="cursor:pointer"/>`;
    });
    const axis = `<text x="${W - 20}" y="${H - 8}" font-size="11" fill="#888" text-anchor="end">review order →</text>`;
    svg.innerHTML = ticks.join("") + dots.join("") + axis;
    const mean = u.p.slice(0, -1).reduce((a, b) => a + b) / (n - 1);
    info.textContent = `${n} reviews, next $${u.p[n - 1]}, history mean $${mean.toFixed(2)}`;
  };

  svg.addEventListener("pointerover", (e) => {
    const i = e.target.dataset?.i;
    if (i === undefined) return;
    const cx = Number(e.target.getAttribute("cx"));
    const cy = Number(e.target.getAttribute("cy"));
    tip.innerHTML = `<b>${current.t[i]}</b><br>${current.d[i]}, $${current.p[i]}`;
    tip.style.display = "block";
    const box = svg.getBoundingClientRect();
    const origin = el.getBoundingClientRect();
    const left = cx > W / 2 ? cx - 12 - tip.offsetWidth : cx + 12;
    tip.style.left = `${box.left - origin.left + left}px`;
    tip.style.top = `${box.top - origin.top + cy - 52}px`;
  });
  svg.addEventListener("pointerout", (e) => {
    if (e.target.dataset?.i !== undefined) tip.style.display = "none";
  });

  btn.onclick = () => draw(users[Math.floor(Math.random() * users.length)]);
  start ? draw(start) : btn.onclick();
}

export default { render };
