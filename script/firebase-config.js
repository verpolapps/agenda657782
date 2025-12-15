// script/firebase-config.js
// Ganti nilai firebaseConfig di bawah dengan konfigurasi proyek Firebase anda.
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAlClmln65KXF1wMLHLuCWELBkd3DrfwpY",
  authDomain: "agenda-surat-f0410.firebaseapp.com",
  databaseURL: "https://agenda-surat-f0410-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "agenda-surat-f0410",
  storageBucket: "agenda-surat-f0410.firebasestorage.app",
  messagingSenderId: "1076924927200",
  appId: "1:1076924927200:web:543a6523c6c02c896f9485"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
