import { useState } from "react";
import { ChevronDown, ChevronRight, FolderPlus, Upload, Plus, Edit2, Trash2, FileText, ChevronLeft, Menu, GripVertical } from "lucide-react";
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
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { toast } from "sonner";

interface ProjectManagerProps {
  projects: Project[];
  currentProjectId: string | null;
  currentFileId: string | null;
  onProjectsChange: (projects: Project[]) => void;
  onFileSelect: (projectId: string, fileId: string) => void;
  onCreateFile: (projectId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const ProjectManager = ({
  projects,
  currentProjectId,
  currentFileId,
  onProjectsChange,
  onFileSelect,
  onCreateFile,
  isCollapsed,
  onToggleCollapse,
}: ProjectManagerProps) => {
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectName, setEditingProjectName] = useState("");
  const [deleteProjectId, setDeleteProjectId] = useState<string | null>(null);
  const [editingFileId, setEditingFileId] = useState<string | null>(null);
  const [editingFileName, setEditingFileName] = useState("");
  const [deleteFileInfo, setDeleteFileInfo] = useState<{ projectId: string; fileId: string } | null>(null);
  const [draggedFile, setDraggedFile] = useState<{ projectId: string; fileId: string } | null>(null);

  const handleCreateProject = (parentId?: string) => {
    const baseName = "New Project";
    let newName = baseName;
    let counter = 1;
    
    // Check for duplicate names
    while (projects.some(p => p.name.toLowerCase() === newName.toLowerCase())) {
      newName = `${baseName} ${counter}`;
      counter++;
    }
    
    const newProject: Project = {
      id: generateId(),
      name: newName,
      files: [],
      createdAt: Date.now(),
      isExpanded: true,
      parentId: parentId || null,
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
    
    // Check for duplicate names (excluding current project)
    const isDuplicate = projects.some(
      p => p.id !== projectId && p.name.toLowerCase() === newName.trim().toLowerCase()
    );
    
    if (isDuplicate) {
      toast.error("A project with this name already exists");
      return;
    }
    
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

  const handleRenameFile = (projectId: string, fileId: string, newName: string) => {
    if (!newName.trim()) return;
    const updatedProjects = projects.map((p) => {
      if (p.id === projectId) {
        return {
          ...p,
          files: p.files.map((f) =>
            f.id === fileId ? { ...f, name: newName.trim() } : f
          ),
        };
      }
      return p;
    });
    onProjectsChange(updatedProjects);
    setEditingFileId(null);
    toast.success("File renamed");
  };

  const handleDeleteFile = (projectId: string, fileId: string) => {
    const updatedProjects = projects.map((p) => {
      if (p.id === projectId) {
        return {
          ...p,
          files: p.files.filter((f) => f.id !== fileId),
        };
      }
      return p;
    });
    onProjectsChange(updatedProjects);
    setDeleteFileInfo(null);
    toast.success("File deleted");
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

  const handleDragStart = (projectId: string, fileId: string) => {
    setDraggedFile({ projectId, fileId });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetProjectId: string) => {
    if (!draggedFile) return;
    
    if (draggedFile.projectId === targetProjectId) {
      setDraggedFile(null);
      return;
    }

    const sourceProject = projects.find(p => p.id === draggedFile.projectId);
    const file = sourceProject?.files.find(f => f.id === draggedFile.fileId);
    
    if (!file) {
      setDraggedFile(null);
      return;
    }

    const updatedProjects = projects.map((p) => {
      if (p.id === draggedFile.projectId) {
        return { ...p, files: p.files.filter(f => f.id !== draggedFile.fileId) };
      }
      if (p.id === targetProjectId) {
        return { ...p, files: [...p.files, file] };
      }
      return p;
    });

    onProjectsChange(updatedProjects);
    setDraggedFile(null);
    toast.success("File moved to project");
  };

  const renderProject = (project: Project, depth: number = 0) => {
    const childProjects = projects.filter(p => p.parentId === project.id);
    
    return (
      <div key={project.id} className="mb-2" style={{ marginLeft: `${depth * 16}px` }}>
        <ContextMenu>
          <ContextMenuTrigger>
            <div 
              className="flex items-center gap-1 p-2 rounded hover:bg-accent/50"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(project.id)}
            >
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
            </div>
          </ContextMenuTrigger>
          <ContextMenuContent>
            <ContextMenuItem onClick={() => handleCreateProject(project.id)}>
              <FolderPlus className="h-4 w-4 mr-2" />
              Add Sub-Project
            </ContextMenuItem>
            <ContextMenuItem onClick={() => {
              setEditingProjectId(project.id);
              setEditingProjectName(project.name);
            }}>
              <Edit2 className="h-4 w-4 mr-2" />
              Rename
            </ContextMenuItem>
            <ContextMenuItem 
              onClick={() => setDeleteProjectId(project.id)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </ContextMenuItem>
          </ContextMenuContent>
        </ContextMenu>

        {project.isExpanded && (
          <div className="ml-4 mt-1 space-y-1">
            {project.files.map((file) => (
              <ContextMenu key={file.id}>
                <ContextMenuTrigger>
                  <div
                    draggable
                    onDragStart={() => handleDragStart(project.id, file.id)}
                    className="flex items-center gap-1"
                  >
                    <GripVertical className="h-3 w-3 text-muted-foreground cursor-move" />
                    {editingFileId === file.id ? (
                      <Input
                        value={editingFileName}
                        onChange={(e) => setEditingFileName(e.target.value)}
                        onBlur={() => handleRenameFile(project.id, file.id, editingFileName)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleRenameFile(project.id, file.id, editingFileName);
                          } else if (e.key === "Escape") {
                            setEditingFileId(null);
                          }
                        }}
                        autoFocus
                        className="h-7 flex-1"
                      />
                    ) : (
                      <Button
                        variant="ghost"
                        className={`flex-1 justify-start h-8 text-sm ${
                          currentFileId === file.id
                            ? "bg-primary/10 text-primary font-medium"
                            : ""
                        }`}
                        onClick={() => onFileSelect(project.id, file.id)}
                      >
                        <FileText className="h-3 w-3 mr-2 flex-shrink-0" />
                        <span className="truncate">{file.name}</span>
                        {currentFileId === file.id && (
                          <span className="ml-auto text-xs flex-shrink-0">(Open)</span>
                        )}
                      </Button>
                    )}
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent>
                  <ContextMenuItem onClick={() => {
                    setEditingFileId(file.id);
                    setEditingFileName(file.name);
                  }}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Rename
                  </ContextMenuItem>
                  <ContextMenuItem 
                    onClick={() => setDeleteFileInfo({ projectId: project.id, fileId: file.id })}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
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
            
            {childProjects.map(childProject => renderProject(childProject, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  // Collapsed state - minimal view
  if (isCollapsed) {
    return (
      <div className="w-14 border-r border-border bg-card flex flex-col h-screen items-center py-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="mb-4"
          title="Expand Project Manager"
        >
          <Menu className="h-5 w-5" />
        </Button>
        <div className="flex-1" />
      </div>
    );
  }

  return (
    <div className="w-80 border-r border-border bg-card flex flex-col h-screen">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-foreground">Project Manager</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="h-8 w-8"
            title="Collapse Project Manager"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        </div>
        <Button
          onClick={() => handleCreateProject()}
          className="w-full"
          variant="default"
        >
          <FolderPlus className="w-4 h-4 mr-2" />
          Create New Project
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {projects.filter(p => !p.parentId).map((project) => renderProject(project))}
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

      <AlertDialog open={deleteFileInfo !== null} onOpenChange={() => setDeleteFileInfo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete File</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this file? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteFileInfo && handleDeleteFile(deleteFileInfo.projectId, deleteFileInfo.fileId)}
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
