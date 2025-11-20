import { X, Edit2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { truncate } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";

export interface OpenFile {
    id: string;
    projectId: string;
    name: string;
    isDirty: boolean;
}

interface FileTabsProps {
    openFiles: OpenFile[];
    currentFileId: string | null;
    onFileSelect: (projectId: string, fileId: string) => void;
    onFileClose: (fileId: string) => void;
    onFileRename: (projectId: string, fileId: string, newName: string) => void;
    onFileDuplicate: (projectId: string, fileId: string) => void;
}

export const FileTabs = ({ openFiles, currentFileId, onFileSelect, onFileClose, onFileRename, onFileDuplicate }: FileTabsProps) => {
    const [editingFileId, setEditingFileId] = useState<string | null>(null);
    const [editingFileName, setEditingFileName] = useState("");

    const handleRename = (projectId: string, fileId: string, newName: string) => {
        if (!newName.trim()) return;
        onFileRename(projectId, fileId, newName.trim());
        setEditingFileId(null);
    };

    if (openFiles.length === 0) {
        return null;
    }

    return (
        <div className="border-b border-border bg-card">
            <ScrollArea className="w-full">
                <Tabs value={currentFileId || undefined} className="w-full">
                    <TabsList className="h-10 w-full justify-start rounded-none bg-transparent p-0">
                        {openFiles.map((file) => (
                            <ContextMenu key={file.id}>
                                <ContextMenuTrigger asChild>
                                    <div className="flex items-center border-r border-border">
                                        {editingFileId === file.id ? (
                                            <div className="flex items-center gap-1 px-2">
                                                <Input
                                                    value={editingFileName}
                                                    onChange={(e) => setEditingFileName(e.target.value)}
                                                    onBlur={() => handleRename(file.projectId, file.id, editingFileName)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === "Enter") {
                                                            handleRename(file.projectId, file.id, editingFileName);
                                                        } else if (e.key === "Escape") {
                                                            setEditingFileId(null);
                                                        }
                                                    }}
                                                    autoFocus
                                                    className="h-7 w-32"
                                                />
                                            </div>
                                        ) : (
                                            <>
                                                <TabsTrigger
                                                    value={file.id}
                                                    onClick={() => onFileSelect(file.projectId, file.id)}
                                                    className="rounded-none border-0 data-[state=active]:border-b-2 data-[state=active]:border-primary min-w-0 flex-1 text-left"
                                                >
                                                    <span className="flex-1 min-w-0 truncate block text-left">
                                                        {truncate(file.name, 24)}
                                                        {file.isDirty && <span className="ml-1 text-primary">*</span>}
                                                    </span>
                                                </TabsTrigger>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-none"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onFileClose(file.id);
                                                    }}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </>
                                        )}
                                    </div>
                                </ContextMenuTrigger>
                                <ContextMenuContent>
                                    <ContextMenuItem
                                        onClick={() => {
                                            setEditingFileId(file.id);
                                            setEditingFileName(file.name);
                                        }}
                                    >
                                        <Edit2 className="h-4 w-4 mr-2" />
                                        Rename
                                    </ContextMenuItem>
                                    <ContextMenuItem onClick={() => onFileDuplicate(file.projectId, file.id)}>
                                        <Copy className="h-4 w-4 mr-2" />
                                        Duplicate
                                    </ContextMenuItem>
                                    <ContextMenuItem onClick={() => onFileClose(file.id)}>
                                        <X className="h-4 w-4 mr-2" />
                                        Close
                                    </ContextMenuItem>
                                </ContextMenuContent>
                            </ContextMenu>
                        ))}
                    </TabsList>
                </Tabs>
                <ScrollBar orientation="horizontal" />
            </ScrollArea>
        </div>
    );
};
