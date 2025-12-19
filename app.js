function initSig(){
  const canvas = document.getElementById("sigPad");
  const ctx = canvas.getContext("2d");

  function resize(){
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;

    canvas.width  = rect.width  * ratio;
    canvas.height = rect.height * ratio;

    ctx.setTransform(ratio,0,0,ratio,0,0);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = "#111";

    ctx.fillStyle = "#fff";
    ctx.fillRect(0,0,rect.width,rect.height);
  }

  resize();
  window.addEventListener("resize", resize);

  let drawing = false;
  let last = null;

  const pos = e => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  canvas.onpointerdown = e => {
    canvas.setPointerCapture(e.pointerId);
    drawing = true;
    last = pos(e);
    dirty = true;
  };

  canvas.onpointermove = e => {
    if(!drawing) return;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last = p;
  };

  canvas.onpointerup =
  canvas.onpointercancel = () => {
    drawing = false;
    last = null;
  };

  sig = {
    clear(){
      resize();
      dirty = true;
    },
    data(){
      return canvas.toDataURL("image/png");
    },
    from(url){
      const img = new Image();
      img.onload = () => {
        resize();
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      };
      img.src = url;
    }
  };

  document.getElementById("btnSigClear").onclick = () => sig.clear();
}