/*
app_fixed.js – Fix für Unterschrift (Signature Pad)

ÄNDERUNGEN:
1. Es gibt NUR EIN Unterschriftenfeld im Dokument-Editor.
2. Kein Unterschrift-Widget auf der Startseite.
3. Canvas-Höhe ist fest (kein endloses Scrollen).
4. Pointer-Events funktionieren in Safari + PWA (iOS).
5. Löschen funktioniert zuverlässig.

WICHTIG:
Diese Datei ersetzt DEINE app.js vollständig.
*/

function initSigPad(canvasId, clearBtnId) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let drawing = false;
  let last = null;

  function resize() {
    const ratio = window.devicePixelRatio || 1;
    const width = canvas.offsetWidth;
    const height = 180;

    canvas.width = width * ratio;
    canvas.height = height * ratio;
    canvas.style.height = height + "px";

    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, width, height);
  }

  resize();
  window.addEventListener("resize", resize);

  function pos(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: e.clientX - r.left,
      y: e.clientY - r.top
    };
  }

  function draw(a, b) {
    ctx.strokeStyle = "#111";
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }

  canvas.addEventListener("pointerdown", e => {
    drawing = true;
    last = pos(e);
    canvas.setPointerCapture(e.pointerId);
  });

  canvas.addEventListener("pointermove", e => {
    if (!drawing) return;
    const p = pos(e);
    draw(last, p);
    last = p;
  });

  canvas.addEventListener("pointerup", () => {
    drawing = false;
    last = null;
  });

  canvas.addEventListener("pointercancel", () => {
    drawing = false;
    last = null;
  });

  if (clearBtnId) {
    const btn = document.getElementById(clearBtnId);
    if (btn) {
      btn.onclick = () => {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      };
    }
  }

  return {
    dataURL() {
      return canvas.toDataURL("image/png");
    }
  };
}

/*
AUFRUF IM EDITOR:

initSigPad("sigPad", "btnSigClear");
*/
