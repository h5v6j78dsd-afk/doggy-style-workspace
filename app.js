// === PATCHED app.js (Rechnung Editor Fix) ===
// Ergänzung: Rechnung wird wie Hundeannahme geöffnet

function createDoc(templateId){
  const tpl = templates.find(t=>t.id===templateId);
  if(!tpl){
    alert("Vorlage nicht gefunden");
    return;
  }

  const doc = {
    id: uid(),
    type: tpl.id,
    templateId: tpl.id,
    data: {},
    created: Date.now(),
    updated: Date.now()
  };

  state.docs.push(doc);
  saveState();
  openDoc(doc.id);
}

// WICHTIG: Rechnung NICHT blockieren
function openDoc(id){
  const doc = state.docs.find(d=>d.id===id);
  if(!doc) return;

  currentDoc = doc;
  currentTemplate = templates.find(t=>t.id===doc.templateId);

  renderForm(currentTemplate, doc);
  showPanel("editor");
}
