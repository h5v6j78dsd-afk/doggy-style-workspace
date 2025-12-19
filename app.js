function initSig() {
  const canvas = document.getElementById("sigPad");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();

    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  let drawing = false;

  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  }

  function start(e) {
    e.preventDefault();
    drawing = true;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function move(e) {
    if (!drawing) return;
    e.preventDefault();
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  }

  function end(e) {
    if (!drawing) return;
    e.preventDefault();
    drawing = false;
    ctx.closePath();
  }

  canvas.addEventListener("mousedown", start);
  canvas.addEventListener("mousemove", move);
  canvas.addEventListener("mouseup", end);
  canvas.addEventListener("mouseleave", end);

  canvas.addEventListener("touchstart", start, { passive: false });
  canvas.addEventListener("touchmove", move, { passive: false });
  canvas.addEventListener("touchend", end);
}
  const canvas = document.getElementById("sigPad");
  const ctx = canvas.getContext("2d");

  // Feste, saubere Größe (iPhone / PWA sicher)
  const cssWidth  = canvas.parentElement.clientWidth;
  const cssHeight = 160; // <- WICHTIG: feste Höhe

  const ratio = Math.max(window.devicePixelRatio || 1, 1);

  canvas.style.width  = cssWidth + "px";
  canvas.style.height = cssHeight + "px";

  canvas.width  = cssWidth  * ratio;
  canvas.height = cssHeight * ratio;

  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  // Hintergrund
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, cssWidth, cssHeight);

  ctx.strokeStyle = "#111";
  ctx.lineWidth = 2.5;
  ctx.lineCap = "round";

  let drawing = false;
  let last = null;

  const pos = e => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
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

  canvas.onpointerup = () => {
    drawing = false;
    last = null;
  };

  canvas.onpointercancel = () => {
    drawing = false;
    last = null;
  };

  sig = {
    clear(){
      ctx.clearRect(0,0,cssWidth,cssHeight);
      ctx.fillStyle="#ffffff";
      ctx.fillRect(0,0,cssWidth,cssHeight);
      dirty = true;
    },
    data(){
      return canvas.toDataURL("image/png");
    },
    from(url){
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0,0,cssWidth,cssHeight);
        ctx.fillStyle="#ffffff";
        ctx.fillRect(0,0,cssWidth,cssHeight);
        ctx.drawImage(img, 0, 0, cssWidth, cssHeight);
      };
      img.src = url;
    }
  };

  document.getElementById("btnSigClear").onclick = () => sig.clear();
}