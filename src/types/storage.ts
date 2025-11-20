import { AppState } from "./project";

export interface StorageAdapter {
    name: string;

    /**
     * Initialize the storage adapter
     */
    initialize(): Promise<void>;

    /**
     * Load the application state
     */
    load(): Promise<AppState | null>;

    /**
     * Save the application state
     */
    save(state: AppState): Promise<void>;

    /**
     * Check if there are any conflicts with external changes
     */
    detectConflicts?(): Promise<boolean>;

    /**
     * Resolve conflicts with external changes
     */
    resolveConflicts?(): Promise<void>;
}

export type StorageType = "localStorage" | "indexedDB" | "localDirectory" | "dropbox" | "googleDrive" | "oneDrive" | "webdav";

export interface StorageConfig {
    type: StorageType;
    adapter: StorageAdapter;
}
