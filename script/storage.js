
// script/storage.js
import { app } from "./firebase-config.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-storage.js";

const storage = getStorage(app);

// Upload file ke Firebase Storage
export async function uploadFile(category, file) {
  if (!file) return null;
  const filePath = `agenda/${category}/${Date.now()}-${file.name}`;
  const fileRef = ref(storage, filePath);
  await uploadBytes(fileRef, file);
  const url = await getDownloadURL(fileRef);
  return url;
}
