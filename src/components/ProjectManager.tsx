import { useState } from "react";
import { ChevronDown, ChevronRight, FolderPlus, Upload, Plus, Edit2, Trash2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Project, ExcalidrawFile } from "@/types/project";
import { generateId } from "@/utils/storage";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

interface ProjectManagerProps {
  projects: Project[];
  currentProjectId: string | null;
  currentFileId: string | null;
  onProjectsChange: (projects: Project[]) => void;
  onFileSelect: (projectId: string, fileId: string) => void;
  onCreateFile: (projectId: string) => void;
}

export const ProjectManager = ({
  projects,
  currentProjectId,
  currentFileId,
  onProjectsChange,
  onFileSelect,
  onCreateFile,
}: ProjectManagerProps) => {
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState("");
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);

  const handleCreateProject = () => {
    const newProject: Project = {
      id: generateId(),
      name: "New Project",
      files: [],
      createdAt: Date.now(),
      isExpanded: true,
    };
    onProjectsChange([...projects, newProject]);
    toast.success("Project created");
  };

  const handleToggleProject = (projectId: string) => {
    const updatedProjects = projects.map((p) =>
      p.id === projectId ? { ...p, isExpanded: !p.isExpanded } : p
    );
    onProjectsChange(updatedProjects);
  };

  const handleRenameProject = (projectId: string, newName: string) => {
    if (!newName.trim()) return;
    const updatedProjects = projects.map((p) =>
      p.id === projectId ? { ...p, name: newName.trim() } : p
    );
    onProjectsChange(updatedProjects);
    setEditingProjectId(null);
    toast.success("Project renamed");
  };

  const handleDeleteProject = (projectId: string) => {
    const updatedProjects = projects.filter((p) => p.id !== projectId);
    onProjectsChange(updatedProjects);
    setDeleteProjectId(null);
    toast.success("Project deleted");
  };

  const handleUploadFile = async (projectId: string) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".excalidraw,.json";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const content = JSON.parse(text);
        
        const newFile: ExcalidrawFile = {
          id: generateId(),
          name: file.name.replace(/\.(excalidraw|json)$/, ""),
          content,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        const updatedProjects = projects.map((p) =>
          p.id === projectId ? { ...p, files: [...p.files, newFile] } : p
        );
        onProjectsChange(updatedProjects);
        toast.success("File uploaded successfully");
      } catch (error) {
        toast.error("Failed to upload file. Please ensure it's a valid Excalidraw file.");
      }
    };
    input.click();
  };

  return (
    <div className="w-80 border-r border-border bg-card flex flex-col h-screen">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-semibold text-foreground mb-3">Project Manager</h2>
        <Button
          onClick={handleCreateProject}
          className="w-full"
          variant="default"
        >
          <FolderPlus className="w-4 h-4 mr-2" />
          Create New Project
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {projects.map((project) => (
            <div key={project.id} className="mb-2">
              <div className="flex items-center gap-1 p-2 rounded hover:bg-accent/50 group">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => handleToggleProject(project.id)}
                >
                  {project.isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>

                {editingProjectId === project.id ? (
                  <Input
                    value={editingProjectName}
                    onChange={(e) => setEditingProjectName(e.target.value)}
                    onBlur={() => handleRenameProject(project.id, editingProjectName)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleRenameProject(project.id, editingProjectName);
                      } else if (e.key === "Escape") {
                        setEditingProjectId(null);
                      }
                    }}
                    autoFocus
                    className="h-7 flex-1"
                  />
                ) : (
                  <span className="flex-1 text-sm font-medium truncate">
                    {project.name}
                  </span>
                )}

                <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => {
                      setEditingProjectId(project.id);
                      setEditingProjectName(project.name);
                    }}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    onClick={() => setDeleteProjectId(project.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {project.isExpanded && (
                <div className="ml-4 mt-1 space-y-1">
                  {project.files.map((file) => (
                    <Button
                      key={file.id}
                      variant="ghost"
                      className={`w-full justify-start h-8 text-sm ${
                        currentFileId === file.id
                          ? "bg-primary/10 text-primary font-medium"
                          : ""
                      }`}
                      onClick={() => onFileSelect(project.id, file.id)}
                    >
                      <FileText className="h-3 w-3 mr-2" />
                      <span className="truncate">{file.name}</span>
                      {currentFileId === file.id && (
                        <span className="ml-auto text-xs">(Open)</span>
                      )}
                    </Button>
                  ))}

                  <div className="flex gap-1 mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-xs"
                      onClick={() => onCreateFile(project.id)}
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      New File
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-8 text-xs"
                      onClick={() => handleUploadFile(project.id)}
                    >
                      <Upload className="h-3 w-3 mr-1" />
                      Upload
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <AlertDialog open={deleteProjectId !== null} onOpenChange={() => setDeleteProjectId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Project</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this project? This will permanently delete all files within it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteProjectId && handleDeleteProject(deleteProjectId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
