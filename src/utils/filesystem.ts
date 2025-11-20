import { ExcalidrawFile, Project } from "@/types/project";

function sanitizeFileName(name: string) {
    return name.replace(/[^a-z0-9-_\.]/gi, "_");
}

const HANDLE_DB = "excalidraw-handles";
const HANDLE_STORE = "handles";
const HANDLE_KEY = "defaultDir";
const HANDLE_PATH_KEY = "defaultDirPath";

function openHandleDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(HANDLE_DB, 1);
        req.onupgradeneeded = () => {
            const db = req.result;
            if (!db.objectStoreNames.contains(HANDLE_STORE)) {
                db.createObjectStore(HANDLE_STORE);
            }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

export async function setDefaultDirectoryHandle(handle: FileSystemDirectoryHandle) {
    const db = await openHandleDB();
    return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(HANDLE_STORE, "readwrite");
        const store = tx.objectStore(HANDLE_STORE);
        const req = store.put(handle, HANDLE_KEY);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

export async function getDefaultDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
    try {
        const db = await openHandleDB();
        return await new Promise((resolve, reject) => {
            const tx = db.transaction(HANDLE_STORE, "readonly");
            const store = tx.objectStore(HANDLE_STORE);
            const req = store.get(HANDLE_KEY);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => reject(req.error);
        });
    } catch (err) {
        return null;
    }
}

export async function clearDefaultDirectoryHandle(): Promise<void> {
    const db = await openHandleDB();
    return new Promise((resolve, reject) => {
        const tx = db.transaction(HANDLE_STORE, "readwrite");
        const store = tx.objectStore(HANDLE_STORE);
        const req = store.delete(HANDLE_KEY);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

export async function setDefaultDirectoryPath(path: string | null) {
    const db = await openHandleDB();
    return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(HANDLE_STORE, "readwrite");
        const store = tx.objectStore(HANDLE_STORE);
        if (path === null) {
            const req = store.delete(HANDLE_PATH_KEY);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        } else {
            const req = store.put(path, HANDLE_PATH_KEY);
            req.onsuccess = () => resolve();
            req.onerror = () => reject(req.error);
        }
    });
}

export async function getDefaultDirectoryPath(): Promise<string | null> {
    try {
        const db = await openHandleDB();
        return await new Promise((resolve, reject) => {
            const tx = db.transaction(HANDLE_STORE, "readonly");
            const store = tx.objectStore(HANDLE_STORE);
            const req = store.get(HANDLE_PATH_KEY);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => reject(req.error);
        });
    } catch (err) {
        return null;
    }
}

export async function saveExcalidrawFileToDirectory(file: ExcalidrawFile, projectName?: string): Promise<void> {
    const fileName = `${sanitizeFileName(file.name)}.excalidraw`;

    // Try to use saved default directory handle first
    if (typeof (window as any).showDirectoryPicker === "function") {
        try {
            const defaultHandle = await getDefaultDirectoryHandle();
            let dirHandle: FileSystemDirectoryHandle | null = defaultHandle || null;

            if (!dirHandle) {
                // Ask user to choose directory
                // @ts-ignore
                dirHandle = await (window as any).showDirectoryPicker();
            }

            if (!dirHandle) throw new Error("No directory selected");

            let targetDir = dirHandle;
            if (projectName) {
                const projectDirName = sanitizeFileName(projectName);
                targetDir = await dirHandle.getDirectoryHandle(projectDirName, { create: true });
            }
            const fileHandle = await targetDir.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(JSON.stringify(file.content, null, 2));
            await writable.close();
            return;
        } catch (err) {
            // If something goes wrong, fall back to download below
            console.error("Error saving via File System Access API:", err);
        }
    }

    // Fallback: trigger download
    const blob = new Blob([JSON.stringify(file.content, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

export async function exportProjectToDirectory(project: Project): Promise<void> {
    if (typeof (window as any).showDirectoryPicker === "function") {
        try {
            const defaultHandle = await getDefaultDirectoryHandle();
            let dirHandle: FileSystemDirectoryHandle | null = defaultHandle || null;
            if (!dirHandle) {
                // @ts-ignore
                dirHandle = await (window as any).showDirectoryPicker();
            }
            if (!dirHandle) throw new Error("No directory selected");

            const projectDir = await dirHandle.getDirectoryHandle(sanitizeFileName(project.name), { create: true });
            for (const file of project.files) {
                const fileHandle = await projectDir.getFileHandle(`${sanitizeFileName(file.name)}.excalidraw`, { create: true });
                const writable = await fileHandle.createWritable();
                await writable.write(JSON.stringify(file.content, null, 2));
                await writable.close();
            }
            return;
        } catch (err) {
            console.error("Error exporting project:", err);
            throw err;
        }
    }

    // Fallback: create a zip is more involved; fallback to downloading each file
    for (const file of project.files) {
        const blob = new Blob([JSON.stringify(file.content, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${sanitizeFileName(project.name)}-${sanitizeFileName(file.name)}.excalidraw`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }
}
