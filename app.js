const LS_KEY = "ds_test_state";

const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));

let state = JSON.parse(localStorage.getItem(LS_KEY)) || {
  dogs: [],
  docs: []
};

function save(){
  localStorage.setItem(LS_KEY, JSON.stringify(state));
}

/* NAV */
$$(".tab").forEach(btn=>{
  btn.onclick=()=>{
    $$(".tab").forEach(b=>b.classList.remove("is-active"));
    btn.classList.add("is-active");
    $$(".panel").forEach(p=>p.classList.remove("is-active"));
    document.getElementById(btn.dataset.tab).classList.add("is-active");
  };
});

/* START */
$("#templateSelect").innerHTML = `
  <option value="test">Test-Dokument</option>
`;

$("#btnNewDoc").onclick = ()=>{
  const doc = {
    id: Date.now(),
    title: "Test-Dokument " + state.docs.length
  };
  state.docs.push(doc);
  save();
  renderDocs();
  alert("Dokument angelegt");
};

/* DOGS */
$("#btnAddDog").onclick = ()=>{
  const name = prompt("Hundename?");
  if(!name) return;
  state.dogs.push({ name });
  save();
  renderDogs();
};

function renderDogs(){
  const list = $("#dogList");
  list.innerHTML = "";
  state.dogs.forEach(d=>{
    const div = document.createElement("div");
    div.className="item";
    div.textContent = d.name;
    list.appendChild(div);
  });
}

/* DOCS */
function renderDocs(){
  const list = $("#docList");
  list.innerHTML = "";
  state.docs.forEach(d=>{
    const div = document.createElement("div");
    div.className="item";
    div.textContent = d.title;
    list.appendChild(div);
  });
}

/* INIT */
renderDogs();
renderDocs();