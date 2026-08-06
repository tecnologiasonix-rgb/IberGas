// ============================================================
// IberGas — Configuración Firebase
// ============================================================
// Sustituye estos valores por los de tu proyecto en la consola
// de Firebase (Configuración del proyecto → General → Tus apps).
// No pasa nada por tener estas claves en el cliente: la
// seguridad real la dan las Reglas de Firestore/Storage, no
// la ocultación de este objeto.
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js";

const firebaseConfig = {
  apiKey: "REEMPLAZAR_API_KEY",
  authDomain: "REEMPLAZAR.firebaseapp.com",
  projectId: "REEMPLAZAR_PROJECT_ID",
  storageBucket: "REEMPLAZAR.appspot.com",
  messagingSenderId: "REEMPLAZAR_SENDER_ID",
  appId: "REEMPLAZAR_APP_ID"
};

if (firebaseConfig.apiKey.startsWith("REEMPLAZAR")) {
  console.error(
    "[IberGas] Firebase no está configurado todavía. " +
    "Abre js/firebase/config.js y pega las claves reales de tu proyecto " +
    "(Consola de Firebase → Configuración del proyecto → Tus apps)."
  );
}

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);
