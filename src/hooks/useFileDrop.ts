import { useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";

export function useFileDrop(onFileDrop: (path: string) => void) {
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    const unlistenDrop = listen<{ paths: string[] }>(
      "tauri://drag-drop",
      (event) => {
        setIsDragging(false);
        const paths = event.payload.paths;
        if (paths.length > 0) {
          onFileDrop(paths[0]);
        }
      }
    );

    const unlistenOver = listen("tauri://drag-over", () => {
      setIsDragging(true);
    });

    const unlistenLeave = listen("tauri://drag-leave", () => {
      setIsDragging(false);
    });

    return () => {
      unlistenDrop.then((f) => f());
      unlistenOver.then((f) => f());
      unlistenLeave.then((f) => f());
    };
  }, [onFileDrop]);

  return { isDragging };
}
