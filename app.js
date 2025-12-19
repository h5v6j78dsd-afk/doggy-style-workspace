/* =========================
   Doggy Style Workspace
   Signature Pad (PWA safe)
   ========================= */

let sig = null;
let dirty = false;

function initSig() {
  const canvas = document.getElementById("sigPad");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  const resize = () => {
    const width = canvas.parentElement.clientWidth;
    const height = 160;
    const ratio = window.devicePixelRatio || 1;

    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    canvas.width = width * ratio;
    canvas.height = height * ratio;

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
  };

  resize();
  window.addEventListener("resize", resize);

  let drawing = false;
  let last = null;

  const pos = e => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  canvas.onpointerdown = e => {
    e.preventDefault();
    canvas.setPointerCapture(e.pointerId);
    drawing = true;
    last = pos(e);
    dirty = true;
  };

  canvas.onpointermove = e => {
    if (!drawing) return;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last = p;
  };

  canvas.onpointerup = () => { drawing = false; last = null; };
  canvas.onpointercancel = () => { drawing = false; last = null; };

  sig = {
    clear() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      resize();
      dirty = false;
    },
    data() {
      return canvas.toDataURL("image/png");
    }
  };

  const clearBtn = document.getElementById("btnSigClear");
  if (clearBtn) clearBtn.onclick = () => sig.clear();
}

/* Initialisieren wenn Seite geladen ist */
document.addEventListener("DOMContentLoaded", initSig);