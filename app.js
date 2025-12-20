/* =========================================================
   SIGNATUR – MASTER-STABIL (Safari + PWA)
   ========================================================= */

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("sigPad");
  const btnClear = document.getElementById("btnSigClear");

  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  let drawing = false;
  let hasSignature = false;

  // High-DPI Fix
  function resizeCanvas() {
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";
  }
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  /* ===== Scroll-Lock für iOS ===== */
  let scrollY = 0;
  function lockScroll() {
    scrollY = window.scrollY;
    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = "100%";
  }

  function unlockScroll() {
    document.body.style.position = "";
    document.body.style.top = "";
    window.scrollTo(0, scrollY);
  }

  /* ===== Zeichnen ===== */
  function getPos(e) {
    const rect = canvas.getBoundingClientRect();
    const touch = e.touches ? e.touches[0] : e;
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top
    };
  }

  function startDraw(e) {
    e.preventDefault();
    lockScroll();
    drawing = true;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function draw(e) {
    if (!drawing) return;
    e.preventDefault();
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    hasSignature = true;
  }

  function endDraw(e) {
    if (!drawing) return;
    e.preventDefault();
    drawing = false;
    ctx.closePath();
    unlockScroll();
  }

  /* ===== Events ===== */
  canvas.addEventListener("mousedown", startDraw);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", endDraw);
  canvas.addEventListener("mouseleave", endDraw);

  canvas.addEventListener("touchstart", startDraw, { passive: false });
  canvas.addEventListener("touchmove", draw, { passive: false });
  canvas.addEventListener("touchend", endDraw);
  canvas.addEventListener("touchcancel", endDraw);

  /* ===== Löschen ===== */
  if (btnClear) {
    btnClear.addEventListener("click", () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      hasSignature = false;
    });
  }

  /* ===== Für Pflichtfeld-Prüfung ===== */
  window.signatureIsPresent = () => hasSignature;
});