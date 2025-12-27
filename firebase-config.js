// Weg 2B (Cloud Sync): trage hier die Firebase-Web-Konfiguration aus der Firebase Console ein.
// Datei bewusst NICHT in app.js, damit du sie leicht austauschen kannst.
//
// Beispiel:
// window.firebaseConfig = {
//   apiKey: "...",
//   authDomain: "...firebaseapp.com",
//   projectId: "...",
//   storageBucket: "...",
//   messagingSenderId: "...",
//   appId: "..."
// };
// window.firebaseOrgId = "doggystyle"; // frei wählbar (z.B. dein Hofname)
// window.firebaseAdminEmails = ["raphael@...", "anschi@..."];

window.firebaseConfig = null; // <- hier eintragen, sonst läuft die App weiterhin lokal/offline.
window.firebaseOrgId = "doggystyle";
window.firebaseAdminEmails = [];
