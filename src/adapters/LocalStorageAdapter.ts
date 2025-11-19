import { StorageAdapter } from "@/types/storage";
import { AppState } from "@/types/project";

const STORAGE_KEY = "excalidraw-projects";

export class LocalStorageAdapter implements StorageAdapter {
  name = "localStorage";

  async initialize(): Promise<void> {
    // localStorage is always available in the browser
    return Promise.resolve();
  }

  async load(): Promise<AppState | null> {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error("Error loading state from localStorage:", error);
    }
    return null;
  }

  async save(state: AppState): Promise<void> {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Error saving state to localStorage:", error);
      throw error;
    }
  }

  async detectConflicts(): Promise<boolean> {
    // localStorage doesn't have external conflicts
    return false;
  }

  async resolveConflicts(): Promise<void> {
    // No conflicts to resolve
    return Promise.resolve();
  }
}
