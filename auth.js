// Login-Seite (stabil auf iPad/PWA): keine Overlays, keine globalen Touch-Hacks.
(function(){
  function $(id){ return document.getElementById(id); }
  function setMsg(t){ const el=$('authMsg'); if(el) el.textContent = t||''; }

  function firebaseReady(){
    return (window.firebase && window.firebase.initializeApp && window.firebaseConfig);
  }

  async function init(){
    if(!firebaseReady()){
      setMsg('Firebase nicht konfiguriert. Prüfe firebase-config.js');
      return;
    }
    try{
      // Initialisieren (idempotent)
      try{ window.firebase.app(); }catch(_){ window.firebase.initializeApp(window.firebaseConfig); }
      const auth = window.firebase.auth();

      // Login bei jedem Öffnen erzwingen: Session sofort verwerfen
      try{ await auth.signOut(); }catch(_){}

      // Button-Handler
      const btnLogin = $('btnLogin');
      const btnRegister = $('btnRegister');

      const doLogin = async ()=>{
        const email = ($('loginEmail').value||'').trim();
        const pass  = ($('loginPass').value||'').trim();
        if(!email || !pass){ setMsg('Bitte E‑Mail und Passwort eingeben.'); return; }
        setMsg('Anmelden …');
        try{
          await auth.signInWithEmailAndPassword(email, pass);
          location.href = 'app.html';
        }catch(e){
          setMsg('Anmelden fehlgeschlagen: ' + (e.code || e.message || e));
        }
      };

      const doRegister = async ()=>{
        const email = ($('loginEmail').value||'').trim();
        const pass  = ($('loginPass').value||'').trim();
        if(!email || !pass){ setMsg('Bitte E‑Mail und Passwort eingeben.'); return; }
        setMsg('Registrieren …');
        try{
          await auth.createUserWithEmailAndPassword(email, pass);
          location.href = 'app.html';
        }catch(e){
          setMsg('Registrierung fehlgeschlagen: ' + (e.code || e.message || e));
        }
      };

      btnLogin.addEventListener('click', (e)=>{ e.preventDefault(); doLogin(); });
      btnRegister.addEventListener('click', (e)=>{ e.preventDefault(); doRegister(); });

      // Enter-Taste
      $('loginPass').addEventListener('keydown', (e)=>{ if(e.key==='Enter') doLogin(); });

      setMsg('');
    }catch(err){
      setMsg('Fehler beim Initialisieren: ' + (err.message || err));
    }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();