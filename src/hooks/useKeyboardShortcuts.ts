import { useEffect } from "react";

interface KeyboardShortcutHandlers {
  onNewTab?: () => void;
  onCloseTab?: () => void;
  onNextTab?: () => void;
  onPrevTab?: () => void;
  onSave?: () => void;
}

export const useKeyboardShortcuts = (handlers: KeyboardShortcutHandlers) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf("MAC") >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      // Ctrl/Cmd + T: New tab
      if (modifier && e.key === "t" && handlers.onNewTab) {
        e.preventDefault();
        handlers.onNewTab();
      }

      // Ctrl/Cmd + W: Close tab
      if (modifier && e.key === "w" && handlers.onCloseTab) {
        e.preventDefault();
        handlers.onCloseTab();
      }

      // Ctrl/Cmd + Tab: Next tab
      if (modifier && e.key === "Tab" && !e.shiftKey && handlers.onNextTab) {
        e.preventDefault();
        handlers.onNextTab();
      }

      // Ctrl/Cmd + Shift + Tab: Previous tab
      if (modifier && e.key === "Tab" && e.shiftKey && handlers.onPrevTab) {
        e.preventDefault();
        handlers.onPrevTab();
      }

      // Ctrl/Cmd + S: Save
      if (modifier && e.key === "s" && handlers.onSave) {
        e.preventDefault();
        handlers.onSave();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlers]);
};
