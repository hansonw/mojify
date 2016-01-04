// A simple class to create a generic key-value store using IndexedDB.
// @flow

const DB_NAME = 'tessdata';
const DB_STORE = 'store';
const DB_VERSION = 1;

export class Database {
  constructor(db) {
    this._db = db;
  }

  getItem(key: string): Promise<string> {
    const tx = this._db.transaction(DB_STORE, 'readonly');
    const store = tx.objectStore(DB_STORE);
    const req = store.get(key);
    return new Promise((resolve, reject) => {
      req.onerror = () => {
        console.log(req.error);
        reject(req.error);
      };
      req.onsuccess = () => {
        resolve(req.result && req.result.id);
      };
    });
  }

  setItem(key: string, val: string): Promise<bool> {
    const tx = this._db.transaction(DB_STORE, 'readwrite');
    const store = tx.objectStore(DB_STORE);
    const req = store.put({id: key, val});
    return new Promise((resolve, reject) => {
      req.onerror = () => {
        console.log(req.error);
        reject(req.error);
      };
      req.onsuccess = () => {
        resolve(req.result);
      };
    });
  }
}

export async function openDatabase() {
  const req = indexedDB.open(DB_NAME, DB_VERSION);
  return new Promise((resolve, reject) => {
    req.onerror = () => reject(req.error);
    req.onupgradeneeded = () => {
      const db = req.result;
      db.createObjectStore(DB_STORE, {keyPath: 'id'});
    };
    req.onsuccess = () => {
      const db = req.result;
      resolve(new Database(db));
    };
  });
}
