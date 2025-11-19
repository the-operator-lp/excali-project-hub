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
  parentId?: string | null;
  children?: Project[];
}

export interface AppState {
  projects: Project[];
  currentProjectId: string | null;
  currentFileId: string | null;
  openFiles: Array<{ fileId: string; projectId: string }>; // Track open files for tabs
  dirtyFiles: Set<string>; // Track files with unsaved changes
}
