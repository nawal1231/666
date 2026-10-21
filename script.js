// 1) Paste your Cloudflare Worker URL here after you deploy worker.js
const API = "PASTE_WORKER_URL_HERE";

// 2) Edit your updates here (newest first). Images: hero.jpg, moon.jpg, dusk.jpg
const UPDATES = [
  {ver:"v1.2", date:"2026-10-18", title:"Moonlit Grove (sample text)", img:"moon.jpg", alt:"Purple cherry trees under a rising moon",
   notes:["Replace this with your real update notes.","Add as many lines as you need."]},
  {ver:"v1.1", date:"2026-09-02", title:"Dusk Shaders (sample text)", img:"dusk.jpg", alt:"Dark cherry grove at dusk",
   notes:["New shader look for the grove.","Another sample change."]},
  {ver:"v1.0", date:"2026-07-31", title:"Server Launch (sample text)", img:"hero.jpg", alt:"Upside-down view of blue-purple tree canopies at night",
   notes:["The world opens.","Another sample change."]}
];

const $ = id => document.getElementById(id);
const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; e.textContent = text; return e; };

$("timeline").innerHTML = UPDATES.map(u => `<article class="card"><img src="${u.img}" alt="${u.alt}" loading="lazy"><div class="body"><p class="meta"><b>${u.ver}</b>${u.date}</p><h3>${u.title}</h3><ul>${u.notes.map(n => `<li>${n}</li>`).join("")}</ul></div></article>`).join("");

// Graveyard
const ready = !API.startsWith("PASTE"), form = $("form"), status = $("status"), yard = $("yard");
const SAMPLE = [{name:"Steve", msg:"Fell into lava. Worth it.", ts:Date.now()}, {name:"Unknown Player", msg:"Never trust a creeper.", ts:Date.now()}];

function devId() {
  let id = null;
  try { id = localStorage.getItem("mc_dev"); } catch {}
  id = id || (document.cookie.match(/mc_dev=([\w-]+)/) || [])[1] || crypto.randomUUID();
  try { localStorage.setItem("mc_dev", id); } catch {}
  document.cookie = `mc_dev=${id};max-age=31536000;path=/;SameSite=Lax`;
  return id;
}
function render(list) {
  yard.replaceChildren(...list.map(p => {
    const t = el("div", "tomb");
    t.append(el("p", "rip", "R.I.P."), el("h3", "", p.name), el("p", "said", p.msg), el("time", "", new Date(p.ts).toLocaleDateString()));
    return t;
  }));
}
function load() {
  if (!ready) return render(SAMPLE);
  fetch(API).then(r => r.json()).then(render).catch(() => yard.textContent = "Could not load tombstones. Try again later.");
}
function lock() { form.replaceChildren(el("p", "", "Your tombstone is placed. One message per device.")); }

$("msg").oninput = e => $("count").textContent = `${e.target.value.length} / 120`;
form.onsubmit = async e => {
  e.preventDefault();
  if (!ready) { status.textContent = "Graveyard is not connected yet."; return; }
  status.textContent = "Placing tombstone...";
  try {
    const r = await fetch(API, {method:"POST", headers:{"Content-Type":"application/json"},
      body: JSON.stringify({name:$("name").value, msg:$("msg").value, device:devId()})});
    if (r.ok || r.status === 409) { try { localStorage.setItem("mc_posted", "1"); } catch {} lock(); load(); }
    else status.textContent = "Could not place the tombstone. Check your message and try again.";
  } catch { status.textContent = "No connection. Try again."; }
};
try { if (localStorage.getItem("mc_posted") === "1") lock(); } catch {}
load();

// Parallax + petals
const reduce = matchMedia("(prefers-reduced-motion:reduce)").matches;
if (!reduce) addEventListener("scroll", () => $("heroBg").style.transform = `translateY(${scrollY * .3}px)`, {passive:true});
const cv = $("petals"), cx = cv.getContext("2d"); let W, H;
const fit = () => { W = cv.width = innerWidth; H = cv.height = innerHeight; }; fit(); addEventListener("resize", fit);
if (!reduce) {
  const cols = ["#f7a8c8", "#f7a8c8", "#fbd0e2", "#7c4dff"];
  const P = Array.from({length:40}, () => ({x:Math.random()*W, y:Math.random()*H, s:(3+Math.random()*5)|0, v:.4+Math.random()*.9, o:Math.random()*6, c:cols[(Math.random()*4)|0]}));
  (function loop(t) {
    cx.clearRect(0, 0, W, H);
    for (const p of P) { p.y += p.v; p.x += Math.sin(t/900 + p.o)*.6; if (p.y > H) { p.y = -10; p.x = Math.random()*W; } cx.fillStyle = p.c; cx.fillRect(p.x|0, p.y|0, p.s, p.s); }
    requestAnimationFrame(loop);
  })(0);
}

// Offline handling: reloading while offline makes the service worker show offline.html
addEventListener("offline", () => setTimeout(() => location.reload(), 300));
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");
