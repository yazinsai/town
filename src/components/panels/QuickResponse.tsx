import { useState, useEffect, useRef } from "react";
import type { Agent } from "@shared/types";
import { respondToAgent } from "../../lib/api";
import { useImageAttachments } from "../../hooks/useImageAttachments";
import { ImageThumbnails, AttachButton, HiddenFileInput } from "../ui/ImageAttachments";
import PixelButton from "../ui/PixelButton";
import PixelInput from "../ui/PixelInput";
import PixelText from "../ui/PixelText";

interface QuickResponseProps {
  agent: Agent;
  onClose: () => void;
}

export default function QuickResponse({ agent, onClose }: QuickResponseProps) {
  const [freeformText, setFreeformText] = useState("");
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isQuestion = agent.state === "waiting_input" && agent.pendingQuestion;
  const isPermission = agent.state === "waiting_permission" && agent.pendingPermission;

  const {
    images, fileInputRef,
    removeImage, clearImages, openFilePicker, bindPaste,
    handleFileInputChange,
  } = useImageAttachments();

  useEffect(() => {
    return bindPaste(inputRef.current);
  }, [bindPaste]);

  async function handleAnswer() {
    if (!isQuestion) return;
    setSubmitting(true);
    try {
      const answers: Record<string, string> = { ...selectedAnswers };
      if (agent.pendingQuestion) {
        for (const q of agent.pendingQuestion.questions) {
          if (!answers[q.question] && freeformText) {
            answers[q.question] = freeformText;
          }
        }
      }
      await respondToAgent(agent.id, { type: "answer", answers });
      onClose();
    } catch (err) {
      console.error("Failed to respond:", err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handlePermission(approved: boolean) {
    setSubmitting(true);
    try {
      await respondToAgent(agent.id, { type: "permission", approved });
      onClose();
    } catch (err) {
      console.error("Failed to respond:", err);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleMessage() {
    if (!freeformText.trim()) return;
    setSubmitting(true);
    try {
      await respondToAgent(agent.id, {
        type: "message",
        message: freeformText,
        images: images.length > 0 ? images : undefined,
      });
      clearImages();
      onClose();
    } catch (err) {
      console.error("Failed to respond:", err);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="animate-slide-up"
      style={{
        position: "fixed", bottom: 0, left: 0, right: 0,
        background: "#2C1810", border: "3px solid #8B4513", borderBottom: "none",
        padding: "16px", zIndex: 100, maxHeight: "70vh", overflowY: "auto",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <PixelText variant="h2">{isPermission ? "PERMISSION" : "QUESTION"}</PixelText>
        <PixelButton variant="ghost" onClick={onClose}>X</PixelButton>
      </div>

      {/* Permission request */}
      {isPermission && agent.pendingPermission && (
        <div>
          <PixelText variant="body" color="#D2B48C" style={{ marginBottom: "8px" }}>
            Tool: {agent.pendingPermission.toolName}
          </PixelText>
          <div style={{ background: "#1A0F0A", border: "1px solid #5C3317", padding: "8px", marginBottom: "12px", maxHeight: "120px", overflowY: "auto" }}>
            <PixelText variant="small" color="#A0826A">
              {typeof agent.pendingPermission.input === "string"
                ? agent.pendingPermission.input
                : JSON.stringify(agent.pendingPermission.input, null, 2)}
            </PixelText>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <PixelButton onClick={() => handlePermission(true)} disabled={submitting}>APPROVE</PixelButton>
            <PixelButton variant="danger" onClick={() => handlePermission(false)} disabled={submitting}>DENY</PixelButton>
          </div>
        </div>
      )}

      {/* Questions */}
      {isQuestion && agent.pendingQuestion && (
        <div>
          {agent.pendingQuestion.questions.map((q, qi) => (
            <div key={qi} style={{ marginBottom: "12px" }}>
              {q.header && (
                <PixelText variant="body" color="#E8C55A" style={{ marginBottom: "4px" }}>{q.header}</PixelText>
              )}
              <PixelText variant="body" color="#D2B48C" style={{ marginBottom: "8px" }}>{q.question}</PixelText>
              {q.options.length > 0 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "8px" }}>
                  {q.options.map((opt, oi) => (
                    <div
                      key={oi}
                      onClick={() => setSelectedAnswers((prev) => ({ ...prev, [q.question]: opt.label }))}
                      style={{
                        padding: "6px 8px",
                        background: selectedAnswers[q.question] === opt.label ? "rgba(232,197,90,0.2)" : "rgba(139,69,19,0.15)",
                        border: `2px solid ${selectedAnswers[q.question] === opt.label ? "#E8C55A" : "#5C3317"}`,
                        cursor: "pointer",
                      }}
                    >
                      <PixelText variant="small" color="#F4E4C1">{opt.label}</PixelText>
                      {opt.description && (
                        <PixelText variant="small" color="#A0826A" style={{ marginTop: "2px" }}>{opt.description}</PixelText>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div style={{ marginBottom: "12px" }}>
            <PixelInput
              value={freeformText}
              onChange={(e) => setFreeformText(e.target.value)}
              placeholder="Type an answer..."
              onKeyDown={(e) => e.key === "Enter" && handleAnswer()}
            />
          </div>
          <PixelButton onClick={handleAnswer} disabled={submitting}>
            {submitting ? "SENDING..." : "SEND"}
          </PixelButton>
        </div>
      )}

      {/* Fallback — message with image support */}
      {!isQuestion && !isPermission && (
        <div>
          <PixelText variant="body" color="#D2B48C" style={{ marginBottom: "8px" }}>
            Send a message to this agent:
          </PixelText>
          {images.length > 0 && (
            <ImageThumbnails images={images} onRemove={removeImage} />
          )}
          <div style={{ position: "relative", marginBottom: "8px" }}>
            <PixelInput
              ref={inputRef}
              value={freeformText}
              onChange={(e) => setFreeformText(e.target.value)}
              placeholder="Type a message..."
              onKeyDown={(e) => e.key === "Enter" && handleMessage()}
              style={{ paddingRight: "28px" }}
            />
            <div style={{ position: "absolute", right: "2px", top: "50%", transform: "translateY(-50%)" }}>
              <AttachButton onClick={openFilePicker} hasImages={images.length > 0} />
            </div>
          </div>
          <PixelButton onClick={handleMessage} disabled={submitting}>SEND</PixelButton>
          <HiddenFileInput inputRef={fileInputRef} onChange={handleFileInputChange} />
        </div>
      )}
    </div>
  );
}
