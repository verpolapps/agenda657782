// script/db.js
import { db } from "./firebase-config.js";
import {
  ref,
  push,
  set,
  get,
  onValue,
  child,
  runTransaction
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-database.js";

// Cache helpers
export function saveCache(key, data) {
  try { localStorage.setItem(key, JSON.stringify(data)); } catch(e) {}
}
export function loadCache(key) {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch(e) { return []; }
}

// Ambil data kategori snapshot once
export async function getCategoryData(category) {
  const snapshot = await get(child(ref(db), category));
  return snapshot.exists() ? snapshot.val() : {};
}

// Simpan data (push)
export async function saveData(category, data) {
  const newRef = push(ref(db, category));
  await set(newRef, data);
  return newRef.key;
}

// Realtime listener, callback receives object map
export function listenCategory(category, callback) {
  onValue(ref(db, category), (snapshot) => {
    const data = snapshot.exists() ? snapshot.val() : {};
    callback(data);
  }, (err) => {
    console.error("listenCategory error", err);
    callback({});
  });
}

// Atomically increment counter and return next number (as integer)
export async function getNextNumber(category) {
  const counterRef = ref(db, 'counters/' + category);
  const result = await runTransaction(counterRef, (current) => {
    if (current === null) return 1;
    return current + 1;
  });
  if (!result.committed) throw new Error("Gagal mengambil nomor");
  return result.snapshot.val();
}
