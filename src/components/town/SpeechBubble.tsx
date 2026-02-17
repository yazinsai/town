interface SpeechBubbleProps {
  type: "question" | "permission";
  onClick: () => void;
}

export default function SpeechBubble({ type, onClick }: SpeechBubbleProps) {
  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className="animate-bounce-slow"
      style={{
        position: "absolute",
        top: "-32px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "#fff",
        border: "2px solid #2C1810",
        padding: "4px 8px",
        fontFamily: "'Press Start 2P', monospace",
        fontSize: "12px",
        color: type === "question" ? "#C97B3A" : "#8B2500",
        cursor: "pointer",
        zIndex: 10,
        whiteSpace: "nowrap",
      }}
    >
      {type === "question" ? "?" : "!"}
      {/* Triangle pointer */}
      <div
        style={{
          position: "absolute",
          bottom: "-6px",
          left: "50%",
          transform: "translateX(-50%)",
          width: 0,
          height: 0,
          borderLeft: "4px solid transparent",
          borderRight: "4px solid transparent",
          borderTop: "6px solid #2C1810",
        }}
      />
    </div>
  );
}
