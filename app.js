function initSig(){
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