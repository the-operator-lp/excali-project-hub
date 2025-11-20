import { StorageAdapter } from "@/types/storage";
import { AppState } from "@/types/project";

const DB_NAME = "excalidraw-app";
const DB_VERSION = 1;
const STORE_NAME = "appState";

export class IndexedDBAdapter implements StorageAdapter {
    name = "indexedDB";
    private db: IDBDatabase | null = null;

    async initialize(): Promise<void> {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };

            request.onupgradeneeded = (event) => {
                const db = (event.target as IDBOpenDBRequest).result;
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    db.createObjectStore(STORE_NAME);
                }
            };
        });
    }

    async load(): Promise<AppState | null> {
        if (!this.db) await this.initialize();

        return new Promise((resolve, reject) => {
            if (!this.db) return reject(new Error("Database not initialized"));

            const transaction = this.db.transaction([STORE_NAME], "readonly");
            const store = transaction.objectStore(STORE_NAME);
            const request = store.get("state");

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const result = request.result || null;
                if (result) {
                    resolve({
                        ...result,
                        openFiles: result.openFiles || [],
                        dirtyFiles: new Set(result.dirtyFiles || []),
                    } as AppState);
                } else {
                    resolve(null);
                }
            };
        });
    }

    async save(state: AppState): Promise<void> {
        if (!this.db) await this.initialize();

        return new Promise((resolve, reject) => {
            if (!this.db) return reject(new Error("Database not initialized"));

            const transaction = this.db.transaction([STORE_NAME], "readwrite");
            const store = transaction.objectStore(STORE_NAME);
            const serializable = {
                ...state,
                dirtyFiles: Array.from(state.dirtyFiles || []),
            };
            const request = store.put(serializable, "state");

            request.onerror = () => reject(request.error);
            request.onsuccess = () => resolve();
        });
    }

    async detectConflicts(): Promise<boolean> {
        // IndexedDB doesn't have external conflicts
        return false;
    }

    async resolveConflicts(): Promise<void> {
        // No conflicts to resolve
        return Promise.resolve();
    }
}
