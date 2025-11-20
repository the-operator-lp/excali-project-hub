import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { StorageType } from "@/types/storage";
import { toast } from "sonner";
import { getDefaultDirectoryHandle, setDefaultDirectoryHandle, clearDefaultDirectoryHandle, getDefaultDirectoryPath, setDefaultDirectoryPath } from "@/utils/filesystem";
import { useCallback } from "react";

const STORAGE_TYPE_KEY = "excalidraw-storage-type";

export const Settings = () => {
    const navigate = useNavigate();
    const [storageType, setStorageType] = useState<StorageType>(() => {
        const saved = localStorage.getItem(STORAGE_TYPE_KEY);
        return (saved as StorageType) || "localStorage";
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_TYPE_KEY, storageType);
    }, [storageType]);

    const [defaultDirName, setDefaultDirName] = useState<string | null>(null);
    const [defaultDirPath, setDefaultDirPathState] = useState<string | null>(null);

    const loadDefaultDir = useCallback(async () => {
        try {
            const handle = await getDefaultDirectoryHandle();
            setDefaultDirName(handle ? (handle as any).name || "Selected directory" : null);
            const path = await getDefaultDirectoryPath();
            setDefaultDirPathState(path || null);
        } catch {
            setDefaultDirName(null);
        }
    }, []);

    useEffect(() => {
        loadDefaultDir();
    }, [loadDefaultDir]);

    const handleStorageChange = async (value: string) => {
        const newType = value as StorageType;
        if (newType === "localDirectory") {
            try {
                // Prompt user to choose a directory when selecting this option
                // @ts-ignore
                const handle: FileSystemDirectoryHandle = await (window as any).showDirectoryPicker();
                await setDefaultDirectoryHandle(handle);
                setDefaultDirName((handle as any).name || "Selected directory");
                setStorageType(newType);
                toast.success("Storage changed to Local Directory and default folder set");
                return;
            } catch (err) {
                console.error(err);
                toast.error("Failed to set Local Directory as storage");
                return;
            }
        }

        setStorageType(newType);
        toast.success(`Storage changed to ${newType}`);
    };

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b border-border bg-card px-6 py-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
                </div>
            </header>

            <div className="container max-w-4xl py-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Storage</CardTitle>
                        <CardDescription>Choose where to store your projects and files. Changes will apply to new saves.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <RadioGroup value={storageType} onValueChange={handleStorageChange}>
                            <div className="flex items-center space-x-3 rounded-lg border border-border p-4 hover:bg-accent/50">
                                <RadioGroupItem value="localStorage" id="localStorage" />
                                <Label htmlFor="localStorage" className="flex-1 cursor-pointer">
                                    <div className="font-medium">Browser localStorage</div>
                                    <div className="text-sm text-muted-foreground">Simple storage using browser's localStorage (limit: ~5-10MB)</div>
                                </Label>
                            </div>

                            <div className="flex items-center space-x-3 rounded-lg border border-border p-4 hover:bg-accent/50">
                                <RadioGroupItem value="indexedDB" id="indexedDB" />
                                <Label htmlFor="indexedDB" className="flex-1 cursor-pointer">
                                    <div className="font-medium">Browser IndexedDB</div>
                                    <div className="text-sm text-muted-foreground">Advanced browser storage with larger capacity (limit: ~50MB+)</div>
                                </Label>
                            </div>

                            <div className="flex items-center space-x-3 rounded-lg border border-border p-4 hover:bg-accent/50">
                                <RadioGroupItem value="localDirectory" id="localDirectory" />
                                <Label htmlFor="localDirectory" className="flex-1 cursor-pointer">
                                    <div className="font-medium">Local Directory</div>
                                    <div className="text-sm text-muted-foreground">Save files directly to a folder on your machine (requires browser support)</div>
                                </Label>
                            </div>

                            <div className="flex items-center space-x-3 rounded-lg border border-border p-4 opacity-50">
                                <RadioGroupItem value="dropbox" id="dropbox" disabled />
                                <Label htmlFor="dropbox" className="flex-1">
                                    <div className="font-medium">Dropbox</div>
                                    <div className="text-sm text-muted-foreground">Cloud storage via Dropbox (Coming soon)</div>
                                </Label>
                            </div>

                            <div className="flex items-center space-x-3 rounded-lg border border-border p-4 opacity-50">
                                <RadioGroupItem value="googleDrive" id="googleDrive" disabled />
                                <Label htmlFor="googleDrive" className="flex-1">
                                    <div className="font-medium">Google Drive</div>
                                    <div className="text-sm text-muted-foreground">Cloud storage via Google Drive (Coming soon)</div>
                                </Label>
                            </div>

                            <div className="flex items-center space-x-3 rounded-lg border border-border p-4 opacity-50">
                                <RadioGroupItem value="oneDrive" id="oneDrive" disabled />
                                <Label htmlFor="oneDrive" className="flex-1">
                                    <div className="font-medium">OneDrive</div>
                                    <div className="text-sm text-muted-foreground">Cloud storage via OneDrive (Coming soon)</div>
                                </Label>
                            </div>

                            <div className="flex items-center space-x-3 rounded-lg border border-border p-4 opacity-50">
                                <RadioGroupItem value="webdav" id="webdav" disabled />
                                <Label htmlFor="webdav" className="flex-1">
                                    <div className="font-medium">WebDAV</div>
                                    <div className="text-sm text-muted-foreground">Self-hosted storage via WebDAV (Coming soon)</div>
                                </Label>
                            </div>
                        </RadioGroup>

                        <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
                            <strong>Note:</strong> Auto-save is enabled by default and saves every 5 seconds. Your data is automatically backed up to the selected storage location.
                        </div>

                        {storageType === "localDirectory" && (
                            <div className="rounded-lg border border-border p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-medium">Default directory</div>
                                        <div className="text-xs text-muted-foreground">{defaultDirName || "Not configured"}</div>
                                        <div className="text-xs text-muted-foreground mt-1">{defaultDirPath ? defaultDirPath : null}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            onClick={async () => {
                                                try {
                                                    // @ts-ignore
                                                    const handle: FileSystemDirectoryHandle = await (window as any).showDirectoryPicker();
                                                    await setDefaultDirectoryHandle(handle);
                                                    setDefaultDirName((handle as any).name || "Selected directory");
                                                    // clear any previously set explicit path when choosing a new handle
                                                    await setDefaultDirectoryPath(null);
                                                    setDefaultDirPathState(null);
                                                    toast.success("Default directory saved");
                                                } catch (err) {
                                                    console.error(err);
                                                    toast.error("Failed to set default directory");
                                                }
                                            }}
                                        >
                                            Choose...
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={async () => {
                                                try {
                                                    await clearDefaultDirectoryHandle();
                                                    setDefaultDirName(null);
                                                    await setDefaultDirectoryPath(null);
                                                    setDefaultDirPathState(null);
                                                    toast.success("Default directory cleared");
                                                } catch (err) {
                                                    console.error(err);
                                                    toast.error("Failed to clear default directory");
                                                }
                                            }}
                                        >
                                            Clear
                                        </Button>
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <Label className="text-sm">Absolute path (optional)</Label>
                                    <div className="flex items-center gap-2 mt-2">
                                        <input
                                            type="text"
                                            className="flex-1 rounded-md border border-border px-3 py-2 bg-background text-foreground"
                                            placeholder="/Users/you/Documents/MyProjects/..."
                                            value={defaultDirPath || ""}
                                            onChange={(e) => setDefaultDirPathState(e.target.value)}
                                        />
                                        <Button
                                            onClick={async () => {
                                                try {
                                                    await setDefaultDirectoryPath(defaultDirPath || null);
                                                    toast.success("Path saved");
                                                } catch (err) {
                                                    console.error(err);
                                                    toast.error("Failed to save path");
                                                }
                                            }}
                                        >
                                            Save Path
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            onClick={async () => {
                                                try {
                                                    await setDefaultDirectoryPath(null);
                                                    setDefaultDirPathState(null);
                                                    toast.success("Path cleared");
                                                } catch (err) {
                                                    console.error(err);
                                                    toast.error("Failed to clear path");
                                                }
                                            }}
                                        >
                                            Clear Path
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};
