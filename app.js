/* =========================
   Doggy Style Workspace
   ========================= */

let sig = null;

/* -------- Navigation -------- */
document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));

    btn.classList.add("active");
    document.getElementById(btn.dataset.tab).classList.add("active");
  });
});

/* -------- Vorlagen laden -------- */
async function loadTemplates() {
  const select = document.getElementById("templateSelect");
  select.innerHTML = "";

  try {
    const res = await fetch("templates/hundeannahme.json");
    const tpl = await res.json();

    const opt = document.createElement("option");
    opt.value = "hundeannahme";
    opt.textContent = tpl.title || "Hundeannahme";
    select.appendChild(opt);

  } catch (e) {
    const opt = document.createElement("option");
    opt.textContent = "Keine Optionen";
    select.appendChild(opt);
  }
}

/* -------- Signatur -------- */
function initSig() {
  const canvas = document.getElementById("sigPad");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  const resize = () => {
    const w = canvas.parentElement.clientWidth;
    const h = 160;
    const r = window.devicePixelRatio || 1;

    canvas.width = w * r;
    canvas.height = h * r;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";

    ctx.setTransform(r,0,0,r,0,0);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0,0,w,h);
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
  };

  resize();
  window.addEventListener("resize", resize);

  let draw = false;
  let last = null;

  const pos = e => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  canvas.onpointerdown = e => {
    draw = true;
    last = pos(e);
  };

  canvas.onpointermove = e => {
    if (!draw) return;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last = p;
  };

  canvas.onpointerup = () => draw = false;
}

/* -------- Init -------- */
document.addEventListener("DOMContentLoaded", () => {
  loadTemplates();
  initSig();
});