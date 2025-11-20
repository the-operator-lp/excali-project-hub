import { StorageAdapter } from "@/types/storage";
import { AppState } from "@/types/project";
import { getDefaultDirectoryHandle } from "@/utils/filesystem";

const STATE_FILE = "app-state.json";

export class FileSystemAdapter implements StorageAdapter {
    name = "localDirectory";

    async initialize(): Promise<void> {
        // Nothing to do here; directory handle is managed elsewhere
        return Promise.resolve();
    }

    async load(): Promise<AppState | null> {
        try {
            const dirHandle = await getDefaultDirectoryHandle();
            if (!dirHandle) return null;
            const fileHandle = await dirHandle.getFileHandle(STATE_FILE).catch(() => null);
            if (!fileHandle) return null;
            const file = await fileHandle.getFile();
            const text = await file.text();
            const parsed = JSON.parse(text);
            return {
                ...parsed,
                openFiles: parsed.openFiles || [],
                dirtyFiles: new Set(parsed.dirtyFiles || []),
            } as AppState;
        } catch (err) {
            console.error("Error loading state from file system:", err);
            return null;
        }
    }

    async save(state: AppState): Promise<void> {
        try {
            const dirHandle = await getDefaultDirectoryHandle();
            if (!dirHandle) throw new Error("No default directory configured");
            const fileHandle = await dirHandle.getFileHandle(STATE_FILE, { create: true });
            const writable = await fileHandle.createWritable();
            const serializable = { ...state, dirtyFiles: Array.from(state.dirtyFiles || []) };
            await writable.write(JSON.stringify(serializable));
            await writable.close();
        } catch (err) {
            console.error("Error saving state to file system:", err);
            throw err;
        }
    }

    async detectConflicts(): Promise<boolean> {
        return false;
    }

    async resolveConflicts(): Promise<void> {
        return Promise.resolve();
    }
}
