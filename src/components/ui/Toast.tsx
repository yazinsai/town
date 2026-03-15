import { useState, useEffect, useCallback } from "react";
import PixelText from "./PixelText";
import type { WSEvent } from "@shared/types";

interface ToastMessage {
  id: string;
  text: string;
  type: "info" | "warning";
}

export function useToasts(lastEvent: WSEvent | null) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    if (!lastEvent) return;

    if (lastEvent.type === "caretaker:responded") {
      const toast: ToastMessage = {
        id: `${Date.now()}`,
        text: `Caretaker: ${lastEvent.summary}`,
        type: "info",
      };
      setToasts((prev) => [...prev, toast]);
    }

    if (lastEvent.type === "caretaker:escalated") {
      const toast: ToastMessage = {
        id: `${Date.now()}`,
        text: `Caretaker escalated: ${lastEvent.reason}`,
        type: "warning",
      };
      setToasts((prev) => [...prev, toast]);
    }
  }, [lastEvent]);

  // Auto-remove toasts after 5 seconds
  useEffect(() => {
    if (toasts.length === 0) return;
    const timer = setTimeout(() => {
      setToasts((prev) => prev.slice(1));
    }, 5000);
    return () => clearTimeout(timer);
  }, [toasts]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return { toasts, dismiss };
}

export function ToastContainer({ toasts, onDismiss }: { toasts: ToastMessage[]; onDismiss: (id: string) => void }) {
  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: "fixed",
      top: "32px",
      left: "50%",
      transform: "translateX(-50%)",
      zIndex: 200,
      display: "flex",
      flexDirection: "column",
      gap: "6px",
      maxWidth: "90vw",
    }}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          onClick={() => onDismiss(toast.id)}
          className="animate-slide-up"
          style={{
            background: toast.type === "warning" ? "#5C3317" : "#2C1810",
            border: `2px solid ${toast.type === "warning" ? "#FF9800" : "#8B4513"}`,
            padding: "8px 12px",
            cursor: "pointer",
            maxWidth: "400px",
          }}
        >
          <PixelText variant="small" color={toast.type === "warning" ? "#FF9800" : "#D2B48C"}>
            {toast.text}
          </PixelText>
        </div>
      ))}
    </div>
  );
}
