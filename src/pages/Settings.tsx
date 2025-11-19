import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { StorageType } from "@/types/storage";
import { toast } from "sonner";

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

  const handleStorageChange = (value: string) => {
    const newType = value as StorageType;
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
            <CardDescription>
              Choose where to store your projects and files. Changes will apply to new saves.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup value={storageType} onValueChange={handleStorageChange}>
              <div className="flex items-center space-x-3 rounded-lg border border-border p-4 hover:bg-accent/50">
                <RadioGroupItem value="localStorage" id="localStorage" />
                <Label htmlFor="localStorage" className="flex-1 cursor-pointer">
                  <div className="font-medium">Browser localStorage</div>
                  <div className="text-sm text-muted-foreground">
                    Simple storage using browser's localStorage (limit: ~5-10MB)
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 rounded-lg border border-border p-4 hover:bg-accent/50">
                <RadioGroupItem value="indexedDB" id="indexedDB" />
                <Label htmlFor="indexedDB" className="flex-1 cursor-pointer">
                  <div className="font-medium">Browser IndexedDB</div>
                  <div className="text-sm text-muted-foreground">
                    Advanced browser storage with larger capacity (limit: ~50MB+)
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 rounded-lg border border-border p-4 opacity-50">
                <RadioGroupItem value="dropbox" id="dropbox" disabled />
                <Label htmlFor="dropbox" className="flex-1">
                  <div className="font-medium">Dropbox</div>
                  <div className="text-sm text-muted-foreground">
                    Cloud storage via Dropbox (Coming soon)
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 rounded-lg border border-border p-4 opacity-50">
                <RadioGroupItem value="googleDrive" id="googleDrive" disabled />
                <Label htmlFor="googleDrive" className="flex-1">
                  <div className="font-medium">Google Drive</div>
                  <div className="text-sm text-muted-foreground">
                    Cloud storage via Google Drive (Coming soon)
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 rounded-lg border border-border p-4 opacity-50">
                <RadioGroupItem value="oneDrive" id="oneDrive" disabled />
                <Label htmlFor="oneDrive" className="flex-1">
                  <div className="font-medium">OneDrive</div>
                  <div className="text-sm text-muted-foreground">
                    Cloud storage via OneDrive (Coming soon)
                  </div>
                </Label>
              </div>

              <div className="flex items-center space-x-3 rounded-lg border border-border p-4 opacity-50">
                <RadioGroupItem value="webdav" id="webdav" disabled />
                <Label htmlFor="webdav" className="flex-1">
                  <div className="font-medium">WebDAV</div>
                  <div className="text-sm text-muted-foreground">
                    Self-hosted storage via WebDAV (Coming soon)
                  </div>
                </Label>
              </div>
            </RadioGroup>

            <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
              <strong>Note:</strong> Auto-save is enabled by default and saves every 5 seconds.
              Your data is automatically backed up to the selected storage location.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
