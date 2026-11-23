// One user's review history: reviewed prices in order, hover for the game.
// The red dot is the last review, the one a model would have to predict.
//
// Model: { "users": [{ "d": [dates], "t": [titles], "p": [prices] }, ...] }
//    or: { "url": "user_timelines.json" }  (same list, fetched; used by the {anywidget} directive in the book)

const W = 700;
const H = 240;
const CAP = 80;

const y = (p) => H - 20 - (Math.log1p(Math.min(p, CAP)) / Math.log1p(CAP)) * (H - 40);

async function render({ model, el }) {
  const url = model.get("url");
  const users = url ? await (await fetch(new URL(url, import.meta.url))).json() : model.get("users");
  const btn = document.createElement("button");
  const info = document.createElement("span");
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", W);
  svg.setAttribute("height", H);
  btn.textContent = "random user";
  el.classList.add("tex2jax_ignore", "mathjax_ignore"); // keep "$" as text in the HTML export
  el.append(btn, " ", info, svg);

  btn.onclick = () => {
    const u = users[Math.floor(Math.random() * users.length)];
    const n = u.p.length;
    const x = (i) => 40 + (i * (W - 60)) / (n - 1);
    const ticks = [0, 10, 30, CAP].map(
      (t) => `<text x="0" y="${y(t) + 4}" font-size="10" fill="#888">$${t}${t === CAP ? "+" : ""}</text>`);
    const dots = u.p.map((p, i) => {
      const last = i === n - 1;
      return `<circle cx="${x(i)}" cy="${y(p)}" r="${last ? 7 : 4}" fill="${last ? "#e45756" : "#4c78a8"}">
        <title>${u.d[i]} · ${u.t[i]} · $${p}</title></circle>`;
    });
    svg.innerHTML = ticks.join("") + dots.join("");
    const mean = u.p.slice(0, -1).reduce((a, b) => a + b) / (n - 1);
    info.textContent = `${n} reviews · next: $${u.p[n - 1]} · history mean: $${mean.toFixed(2)}`;
  };
  btn.onclick();
}

export default { render };
