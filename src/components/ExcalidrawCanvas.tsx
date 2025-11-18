import { useEffect, useRef } from "react";
import { Excalidraw } from "@excalidraw/excalidraw";
import { ExcalidrawFile } from "@/types/project";

interface ExcalidrawCanvasProps {
  currentFile: ExcalidrawFile | null;
  onContentChange: (content: any) => void;
}

export const ExcalidrawCanvas = ({ currentFile, onContentChange }: ExcalidrawCanvasProps) => {
  const excalidrawRef = useRef<any>(null);

  useEffect(() => {
    if (currentFile && excalidrawRef.current) {
      try {
        const api = excalidrawRef.current;
        if (currentFile.content) {
          api.updateScene(currentFile.content);
        } else {
          api.resetScene();
        }
      } catch (error) {
        console.error("Error loading file:", error);
      }
    }
  }, [currentFile?.id]);

  useEffect(() => {
    if (!currentFile || !excalidrawRef.current) return;

    const interval = setInterval(() => {
      const api = excalidrawRef.current;
      if (api) {
        const elements = api.getSceneElements();
        const appState = api.getAppState();
        const files = api.getFiles();
        
        onContentChange({
          elements,
          appState: {
            viewBackgroundColor: appState.viewBackgroundColor,
            currentItemStrokeColor: appState.currentItemStrokeColor,
            currentItemBackgroundColor: appState.currentItemBackgroundColor,
            currentItemFillStyle: appState.currentItemFillStyle,
            currentItemStrokeWidth: appState.currentItemStrokeWidth,
            currentItemRoughness: appState.currentItemRoughness,
            currentItemOpacity: appState.currentItemOpacity,
          },
          files,
        });
      }
    }, 5000); // Auto-save every 5 seconds

    return () => clearInterval(interval);
  }, [currentFile?.id, onContentChange]);

  return (
    <div className="flex-1 h-screen">
      {!currentFile ? (
        <div className="flex items-center justify-center h-full bg-muted/20">
          <div className="text-center space-y-2">
            <h3 className="text-xl font-semibold text-foreground">No File Open</h3>
            <p className="text-muted-foreground">
              Create a new file or open an existing one from the Project Manager
            </p>
          </div>
        </div>
      ) : (
        <Excalidraw
          excalidrawAPI={(api) => (excalidrawRef.current = api)}
          initialData={currentFile.content}
          onChange={(elements, appState, files) => {
            // Real-time change handler (optional, since we have auto-save)
          }}
        />
      )}
    </div>
  );
};
