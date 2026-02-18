import { useState, useCallback, useEffect, useRef } from "react";
import type { ImageAttachment } from "@shared/types";

const ACCEPTED_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

function fileToAttachment(file: File): Promise<ImageAttachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1];
      resolve({ name: file.name, mediaType: file.type, data: base64 });
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function useImageAttachments() {
  const [images, setImages] = useState<ImageAttachment[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCountRef = useRef(0);

  const addImages = useCallback(async (files: FileList | File[]) => {
    const newImages: ImageAttachment[] = [];
    for (const file of Array.from(files)) {
      if (!ACCEPTED_TYPES.includes(file.type)) continue;
      if (file.size > MAX_FILE_SIZE) continue;
      try {
        newImages.push(await fileToAttachment(file));
      } catch {
        // skip failed reads
      }
    }
    if (newImages.length > 0) {
      setImages((prev) => [...prev, ...newImages]);
    }
  }, []);

  const removeImage = useCallback((index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const clearImages = useCallback(() => setImages([]), []);

  const openFilePicker = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Paste handler — call this with a ref to the element you want to enable paste on
  const bindPaste = useCallback(
    (element: HTMLElement | null) => {
      if (!element) return;

      const handlePaste = (e: ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        const imageFiles: File[] = [];
        for (const item of Array.from(items)) {
          if (item.type.startsWith("image/")) {
            const file = item.getAsFile();
            if (file) imageFiles.push(file);
          }
        }

        if (imageFiles.length > 0) {
          e.preventDefault();
          addImages(imageFiles);
        }
      };

      element.addEventListener("paste", handlePaste);
      return () => element.removeEventListener("paste", handlePaste);
    },
    [addImages]
  );

  // Drag handlers for the drop zone
  const dragHandlers = {
    onDragEnter: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCountRef.current++;
      if (dragCountRef.current === 1) setDragging(true);
    },
    onDragLeave: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCountRef.current--;
      if (dragCountRef.current === 0) setDragging(false);
    },
    onDragOver: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCountRef.current = 0;
      setDragging(false);
      if (e.dataTransfer.files.length > 0) {
        addImages(e.dataTransfer.files);
      }
    },
  };

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) addImages(e.target.files);
      e.target.value = "";
    },
    [addImages]
  );

  return {
    images,
    dragging,
    fileInputRef,
    addImages,
    removeImage,
    clearImages,
    openFilePicker,
    bindPaste,
    dragHandlers,
    handleFileInputChange,
  };
}
