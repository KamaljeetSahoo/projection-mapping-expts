const DB_NAME = 'projmap';
const DB_VERSION = 1;
const STORE_NAME = 'projects';

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx(mode, fn) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const t = db.transaction(STORE_NAME, mode);
    const store = t.objectStore(STORE_NAME);
    const result = fn(store);
    t.oncomplete = () => resolve(result.result !== undefined ? result.result : undefined);
    t.onerror = () => reject(t.error);
  }));
}

const DEFAULT_ID = 'default';

export async function saveProject(shapes) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE_NAME, 'readwrite');
    const store = t.objectStore(STORE_NAME);
    store.put({
      id: DEFAULT_ID,
      shapes,
      metadata: { updatedAt: Date.now() },
    });
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}

export async function loadProject() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const t = db.transaction(STORE_NAME, 'readonly');
    const store = t.objectStore(STORE_NAME);
    const req = store.get(DEFAULT_ID);
    t.oncomplete = () => resolve(req.result ? req.result.shapes : []);
    t.onerror = () => reject(t.error);
  });
}
