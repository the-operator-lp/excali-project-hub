export interface ExcalidrawFile {
  id: string;
  name: string;
  content: any; // Excalidraw scene data
  createdAt: number;
  updatedAt: number;
}

export interface Project {
  id: string;
  name: string;
  files: ExcalidrawFile[];
  createdAt: number;
  isExpanded?: boolean;
}

export interface AppState {
  projects: Project[];
  currentProjectId: string | null;
  currentFileId: string | null;
}
