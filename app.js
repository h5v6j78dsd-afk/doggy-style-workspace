/* =========================================================
   DOGGY STYLE WORKSPACE – PHASE C (STABIL)
   Ziel: App darf NIE einfrieren
   ========================================================= */

"use strict";

/* ===================== BASIS ===================== */

const LS_KEY = "doggy_style_workspace_state_v1";

const state = {
  templates: [],
  docs: [],
  dogs: [],
  customers: []
};

/* ===================== HILFSFUNKTIONEN ===================== */

function $(sel) {
  return document.querySelector(sel);
}

function $all(sel) {
  return document.querySelectorAll(sel);
}

function safe(fn, fallback = null) {
  try {
    return fn();
  } catch (e) {
    console.warn("Safe-Fallback:", e);
    return fallback;
  }
}

/* ===================== STORAGE ===================== */

function loadState() {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return;
  try {
    const parsed = JSON.parse(raw);
    Object.assign(state, parsed);
  } catch (e) {
    console.warn("State konnte nicht geladen werden:", e);
  }
}

function saveState() {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("State konnte nicht gespeichert werden:", e);
  }
}

/* ===================== TEMPLATE LOADER (SICHER) ===================== */

async function loadTemplateSafe(path) {
  try {
    const res = await fetch(path, { cache: "no-store" });
    if (!res.ok) throw new Error(res.status);
    const json = await res.json();
    if (!json || !json.type) throw new Error("Ungültiges Template");
    return json;
  } catch (e) {
    console.warn("Template übersprungen:", path, e.message);
    return null;
  }
}

async function loadTemplates() {
  state.templates = [];

  const BASE_PATH = window.location.pathname.replace(/\/[^/]*$/, "/");

const files = [
  BASE_PATH + "hundeannahme.json",
  BASE_PATH + "rechnung.json"
];
  for (const f of files) {
    const tpl = await loadTemplateSafe(f);
    if (tpl) state.templates.push(tpl);
  }

  /* Fallback: Hundeannahme immer verfügbar */
  if (!state.templates.find(t => t.type === "hundeannahme")) {
    state.templates.push({
      type: "hundeannahme",
      title: "Hundeannahme (Fallback)",
      fields: []
    });
  }
}

/* ===================== NAVIGATION ===================== */

function initNavigation() {
  $all("[data-panel]").forEach(btn => {
    btn.addEventListener("click", () => {
      const target = btn.getAttribute("data-panel");
      showPanel(target);
    });
  });
}

function showPanel(id) {
  $all(".panel").forEach(p => p.classList.remove("is-active"));
  const el = document.getElementById(id);
  if (el) el.classList.add("is-active");
}

/* ===================== HOME ===================== */

function renderHome() {
  safe(() => {
    $("#occupancy").innerHTML = `
      <div>Urlaubsbetreuung: 0 / 10 Hunde</div>
      <div>Tagesbetreuung: 0 / 12 Hunde</div>
    `;
  });

  safe(() => {
    $("#todayStatus").textContent = "Noch keine Hunde eingecheckt.";
  });

  renderTemplateSelect();
  renderRecentDocs();
}

/* ===================== TEMPLATE SELECT ===================== */

function renderTemplateSelect() {
  const sel = $("#templateSelect");
  if (!sel) return;

  sel.innerHTML = "";

  state.templates.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t.type;
    opt.textContent = t.title || t.type;
    sel.appendChild(opt);
  });

  if (!state.templates.length) {
    const opt = document.createElement("option");
    opt.textContent = "Keine Optionen";
    sel.appendChild(opt);
  }
}

/* ===================== DOKUMENTE ===================== */

function renderRecentDocs() {
  const box = $("#recentDocs");
  if (!box) return;

  if (!state.docs.length) {
    box.innerHTML = "<em>Noch keine Dokumente.</em>";
    return;
  }

  box.innerHTML = "";
  state.docs.slice(-5).reverse().forEach(d => {
    const div = document.createElement("div");
    div.className = "doc-row";
    div.innerHTML = `
      <strong>${d.type}</strong>
      <button>Öffnen</button>
    `;
    box.appendChild(div);
  });
}

/* ===================== NEUES DOKUMENT ===================== */

function initCreateDoc() {
  const btn = $("#createDocBtn");
  if (!btn) return;

  btn.addEventListener("click", () => {
    const sel = $("#templateSelect");
    if (!sel || !sel.value) return alert("Keine Vorlage gewählt");

    const type = sel.value;
    openEditor(type);
  });
}

function openEditor(type) {
  alert(`Editor geöffnet: ${type}\n(Phase C – Editor bewusst minimal)`);
}

/* ===================== BOOT ===================== */

async function boot() {
  loadState();
  await loadTemplates();
  initNavigation();
  initCreateDoc();
  renderHome();
  showPanel("home");
}

/* ===================== START ===================== */

document.addEventListener("DOMContentLoaded", boot);