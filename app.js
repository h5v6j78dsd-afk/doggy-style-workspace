"use strict";

/* =========================================================
   DOGGY STYLE – PHASE C CLEAN (STABIL)
   ========================================================= */

const state = {
  templates: [],
  currentDoc: null
};

/* ===================== UTILS ===================== */

function $(id) {
  return document.getElementById(id);
}

function log(msg, data) {
  console.log("[APP]", msg, data || "");
}

/* ===================== TEMPLATE LOADER ===================== */

const TEMPLATE_INDEX = [
  { id: "hundeannahme", path: "templates/hundeannahme.json" },
  { id: "rechnung", path: "templates/rechnung.json" }
];

async function loadTemplates() {
  state.templates = [];

  for (const entry of TEMPLATE_INDEX) {
    try {
      const res = await fetch(entry.path, { cache: "no-store" });
      if (!res.ok) throw new Error(res.status);
      const json = await res.json();

      if (!json.id || !json.type || !json.sections) {
        throw new Error("Ungültige Template-Struktur");
      }

      state.templates.push(json);
      log("Template geladen:", json.id);
    } catch (e) {
      console.warn("Template ignoriert:", entry.path, e.message);
    }
  }
}

/* ===================== UI ===================== */

function initNavigation() {
  document.querySelectorAll("[data-panel]").forEach(btn => {
    btn.onclick = () => showPanel(btn.dataset.panel);
  });
}

function showPanel(id) {
  document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
  const el = $(id);
  if (el) el.classList.add("active");
}

function renderTemplateSelect() {
  const sel = $("templateSelect");
  sel.innerHTML = "";

  state.templates.forEach(t => {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = t.title;
    sel.appendChild(opt);
  });
}

/* ===================== EDITOR ===================== */

function openEditor(templateId) {
  const tpl = state.templates.find(t => t.id === templateId);
  if (!tpl) return alert("Vorlage nicht gefunden");

  state.currentDoc = JSON.parse(JSON.stringify(tpl));
  renderEditor();
}

function renderEditor() {
  const box = $("editor");
  box.innerHTML = "";

  state.currentDoc.sections.forEach(section => {
    const h = document.createElement("h3");
    h.textContent = section.title;
    box.appendChild(h);

    section.fields.forEach(field => {
      const label = document.createElement("label");
      label.textContent = field.label;

      const input = document.createElement("input");
      input.type = "text";

      box.appendChild(label);
      box.appendChild(input);
    });
  });

  showPanel("editorPanel");
}

/* ===================== EVENTS ===================== */

function initCreateDoc() {
  $("createDocBtn").onclick = () => {
    const val = $("templateSelect").value;
    if (!val) return;
    openEditor(val);
  };
}

/* ===================== BOOT ===================== */

async function boot() {
  await loadTemplates();
  initNavigation();
  initCreateDoc();
  renderTemplateSelect();
  showPanel("home");
}

document.addEventListener("DOMContentLoaded", boot);