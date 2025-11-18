import { useState, useEffect } from "react";
import { ProjectManager } from "@/components/ProjectManager";
import { ExcalidrawCanvas } from "@/components/ExcalidrawCanvas";
import { Project, ExcalidrawFile, AppState } from "@/types/project";
import { loadState, saveState, generateId } from "@/utils/storage";
import { toast } from "sonner";

const Index = () => {
  const [appState, setAppState] = useState<AppState>(() => loadState());

  useEffect(() => {
    saveState(appState);
  }, [appState]);

  const currentProject = appState.projects.find((p) => p.id === appState.currentProjectId);
  const currentFile = currentProject?.files.find((f) => f.id === appState.currentFileId) || null;

  const handleProjectsChange = (projects: Project[]) => {
    setAppState((prev) => ({ ...prev, projects }));
  };

  const handleFileSelect = (projectId: string, fileId: string) => {
    setAppState((prev) => ({
      ...prev,
      currentProjectId: projectId,
      currentFileId: fileId,
    }));
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

    setAppState((prev) => ({ ...prev, projects: updatedProjects }));
  };

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <ProjectManager
        projects={appState.projects}
        currentProjectId={appState.currentProjectId}
        currentFileId={appState.currentFileId}
        onProjectsChange={handleProjectsChange}
        onFileSelect={handleFileSelect}
        onCreateFile={handleCreateFile}
      />
      <ExcalidrawCanvas currentFile={currentFile} onContentChange={handleContentChange} />
    </div>
  );
};

export default Index;
