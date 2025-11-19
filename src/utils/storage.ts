import { AppState, Project, ExcalidrawFile } from "@/types/project";

const STORAGE_KEY = "excalidraw-projects";

export const loadState = (): AppState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Convert dirtyFiles array back to Set
      return {
        ...parsed,
        openFiles: parsed.openFiles || [],
        dirtyFiles: new Set(parsed.dirtyFiles || []),
      };
    }
  } catch (error) {
    console.error("Error loading state:", error);
  }
  
  // Default state with a sample project
  return {
    projects: [
      {
        id: "default-project",
        name: "My First Project",
        files: [],
        createdAt: Date.now(),
        isExpanded: true,
      },
    ],
    currentProjectId: "default-project",
    currentFileId: null,
    openFiles: [],
    dirtyFiles: new Set(),
  };
};

export const saveState = (state: AppState): void => {
  try {
    // Convert Set to Array for JSON serialization
    const serializableState = {
      ...state,
      dirtyFiles: Array.from(state.dirtyFiles),
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(serializableState));
  } catch (error) {
    console.error("Error saving state:", error);
  }
};

export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
