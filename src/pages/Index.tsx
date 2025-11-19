import { useState, useEffect } from "react";
import { ProjectManager } from "@/components/ProjectManager";
import { ExcalidrawCanvas } from "@/components/ExcalidrawCanvas";
import { FileTabs, OpenFile } from "@/components/FileTabs";
import { Project, ExcalidrawFile, AppState } from "@/types/project";
import { loadState, saveState, generateId } from "@/utils/storage";
import { LocalStorageAdapter } from "@/adapters/LocalStorageAdapter";
import { IndexedDBAdapter } from "@/adapters/IndexedDBAdapter";
import { StorageAdapter, StorageType } from "@/types/storage";
import { Button } from "@/components/ui/button";
import { Settings as SettingsIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { toast } from "sonner";

const STORAGE_TYPE_KEY = "excalidraw-storage-type";

const Index = () => {
  const navigate = useNavigate();
  const [appState, setAppState] = useState<AppState>(() => loadState());
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [storageAdapter, setStorageAdapter] = useState<StorageAdapter>(() => {
    const storageType = (localStorage.getItem(STORAGE_TYPE_KEY) || "localStorage") as StorageType;
    return storageType === "indexedDB" ? new IndexedDBAdapter() : new LocalStorageAdapter();
  });

  // Auto-save using storage adapter
  useEffect(() => {
    const saveAsync = async () => {
      try {
        await storageAdapter.save(appState);
      } catch (error) {
        console.error("Failed to save state:", error);
        toast.error("Failed to save changes");
      }
    };
    saveAsync();
  }, [appState, storageAdapter]);

  // Load from storage adapter on mount
  useEffect(() => {
    const loadAsync = async () => {
      try {
        await storageAdapter.initialize();
        const loaded = await storageAdapter.load();
        if (loaded) {
          setAppState(loaded);
        }
      } catch (error) {
        console.error("Failed to load state:", error);
      }
    };
    loadAsync();
  }, []);

  // Listen for storage type changes
  useEffect(() => {
    const handleStorageChange = async () => {
      const storageType = (localStorage.getItem(STORAGE_TYPE_KEY) || "localStorage") as StorageType;
      const newAdapter = storageType === "indexedDB" ? new IndexedDBAdapter() : new LocalStorageAdapter();
      setStorageAdapter(newAdapter);
      
      try {
        await newAdapter.initialize();
        const loaded = await newAdapter.load();
        if (loaded) {
          setAppState(loaded);
        }
      } catch (error) {
        console.error("Failed to switch storage:", error);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const currentProject = appState.projects.find((p) => p.id === appState.currentProjectId);
  const currentFile = currentProject?.files.find((f) => f.id === appState.currentFileId) || null;

  // Build open files list for tabs
  const openFiles: OpenFile[] = appState.openFiles.map(({ fileId, projectId }) => {
    const project = appState.projects.find((p) => p.id === projectId);
    const file = project?.files.find((f) => f.id === fileId);
    return {
      id: fileId,
      projectId,
      name: file?.name || "Untitled",
      isDirty: appState.dirtyFiles.has(fileId),
    };
  }).filter((f): f is OpenFile => f.name !== "Untitled");

  const handleProjectsChange = (projects: Project[]) => {
    setAppState((prev) => ({ ...prev, projects }));
  };

  const handleFileSelect = (projectId: string, fileId: string) => {
    setAppState((prev) => {
      // Add to open files if not already open
      const isOpen = prev.openFiles.some((f) => f.fileId === fileId);
      const newOpenFiles = isOpen
        ? prev.openFiles
        : [...prev.openFiles, { fileId, projectId }];

      return {
        ...prev,
        currentProjectId: projectId,
        currentFileId: fileId,
        openFiles: newOpenFiles,
      };
    });
  };

  const handleFileClose = (fileId: string) => {
    setAppState((prev) => {
      const newOpenFiles = prev.openFiles.filter((f) => f.fileId !== fileId);
      const newDirtyFiles = new Set(prev.dirtyFiles);
      newDirtyFiles.delete(fileId);

      // If closing current file, switch to another open file or null
      let newCurrentFileId = prev.currentFileId;
      if (prev.currentFileId === fileId) {
        newCurrentFileId = newOpenFiles.length > 0 ? newOpenFiles[0].fileId : null;
      }

      return {
        ...prev,
        openFiles: newOpenFiles,
        currentFileId: newCurrentFileId,
        dirtyFiles: newDirtyFiles,
      };
    });
    toast.success("File closed");
  };

  const handleFileRename = (projectId: string, fileId: string, newName: string) => {
    const updatedProjects = appState.projects.map((p) => {
      if (p.id === projectId) {
        return {
          ...p,
          files: p.files.map((f) =>
            f.id === fileId ? { ...f, name: newName } : f
          ),
        };
      }
      return p;
    });
    setAppState((prev) => ({ ...prev, projects: updatedProjects }));
    toast.success("File renamed");
  };

  const handleFileDuplicate = (projectId: string, fileId: string) => {
    const project = appState.projects.find((p) => p.id === projectId);
    const file = project?.files.find((f) => f.id === fileId);
    
    if (!file) return;

    const newFile: ExcalidrawFile = {
      ...file,
      id: generateId(),
      name: `${file.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updatedProjects = appState.projects.map((p) =>
      p.id === projectId ? { ...p, files: [...p.files, newFile] } : p
    );

    setAppState({
      ...appState,
      projects: updatedProjects,
      currentProjectId: projectId,
      currentFileId: newFile.id,
      openFiles: [...appState.openFiles, { fileId: newFile.id, projectId }],
    });

    toast.success("File duplicated");
  };

  const handleCreateFile = (projectId: string) => {
    const newFile: ExcalidrawFile = {
      id: generateId(),
      name: `Drawing ${Date.now()}`,
      content: {
        elements: [],
        appState: {
          viewBackgroundColor: "#ffffff",
        },
        files: {},
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updatedProjects = appState.projects.map((p) =>
      p.id === projectId ? { ...p, files: [...p.files, newFile] } : p
    );

    setAppState({
      ...appState,
      projects: updatedProjects,
      currentProjectId: projectId,
      currentFileId: newFile.id,
      openFiles: [...appState.openFiles, { fileId: newFile.id, projectId }],
    });

    toast.success("New file created");
  };

  const handleContentChange = (content: any) => {
    if (!appState.currentFileId || !appState.currentProjectId) return;

    const updatedProjects = appState.projects.map((project) =>
      project.id === appState.currentProjectId
        ? {
            ...project,
            files: project.files.map((file) =>
              file.id === appState.currentFileId
                ? { ...file, content, updatedAt: Date.now() }
                : file
            ),
          }
        : project
    );

    const newDirtyFiles = new Set(appState.dirtyFiles);
    newDirtyFiles.add(appState.currentFileId);

    setAppState((prev) => ({ 
      ...prev, 
      projects: updatedProjects,
      dirtyFiles: newDirtyFiles,
    }));

    // Clear dirty flag after a short delay (simulating save)
    setTimeout(() => {
      setAppState((prev) => {
        const newDirty = new Set(prev.dirtyFiles);
        newDirty.delete(appState.currentFileId!);
        return { ...prev, dirtyFiles: newDirty };
      });
    }, 5000);
  };

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNewTab: () => {
      if (appState.currentProjectId) {
        handleCreateFile(appState.currentProjectId);
      }
    },
    onCloseTab: () => {
      if (appState.currentFileId) {
        handleFileClose(appState.currentFileId);
      }
    },
    onNextTab: () => {
      const currentIndex = openFiles.findIndex((f) => f.id === appState.currentFileId);
      if (currentIndex >= 0 && currentIndex < openFiles.length - 1) {
        const nextFile = openFiles[currentIndex + 1];
        handleFileSelect(nextFile.projectId, nextFile.id);
      }
    },
    onPrevTab: () => {
      const currentIndex = openFiles.findIndex((f) => f.id === appState.currentFileId);
      if (currentIndex > 0) {
        const prevFile = openFiles[currentIndex - 1];
        handleFileSelect(prevFile.projectId, prevFile.id);
      }
    },
    onSave: () => {
      toast.success("Auto-save is enabled - your work is automatically saved");
    },
  });

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden">
      <header className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <h1 className="text-lg font-semibold text-foreground">Excalidraw Project Manager</h1>
        <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
          <SettingsIcon className="h-5 w-5" />
        </Button>
      </header>

      <FileTabs
        openFiles={openFiles}
        currentFileId={appState.currentFileId}
        onFileSelect={handleFileSelect}
        onFileClose={handleFileClose}
        onFileRename={handleFileRename}
        onFileDuplicate={handleFileDuplicate}
      />

      <div className="flex flex-1 overflow-hidden">
        <ProjectManager
          projects={appState.projects}
          currentProjectId={appState.currentProjectId}
          currentFileId={appState.currentFileId}
          onProjectsChange={handleProjectsChange}
          onFileSelect={handleFileSelect}
          onCreateFile={handleCreateFile}
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />
        <ExcalidrawCanvas currentFile={currentFile} onContentChange={handleContentChange} />
      </div>
    </div>
  );
};

export default Index;
