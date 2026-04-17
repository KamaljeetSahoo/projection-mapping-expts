const DB = 'projmap';
const STORE = 'projects';
const KEY = 'go-default';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function saveState(shapes) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE, 'readwrite');
    t.objectStore(STORE).put({ id: KEY, shapes, updatedAt: Date.now() });
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}

export async function loadState() {
  try {
    const db = await openDB();
    return await new Promise((resolve, reject) => {
      const t = db.transaction(STORE, 'readonly');
      const req = t.objectStore(STORE).get(KEY);
      t.oncomplete = () => resolve(req.result?.shapes ?? []);
      t.onerror = () => reject(t.error);
    });
  } catch {
    return [];
  }
}
