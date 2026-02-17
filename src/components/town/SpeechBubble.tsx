export type BubbleType = "question" | "permission" | "completed" | "error";

interface SpeechBubbleProps {
  type: BubbleType;
  onClick: () => void;
}

const bubbleConfig: Record<BubbleType, { icon: string; color: string; animation: string }> = {
  question: { icon: "?", color: "#C97B3A", animation: "animate-bounce-slow" },
  permission: { icon: "!", color: "#8B2500", animation: "animate-bounce-slow" },
  completed: { icon: "OK", color: "#2E7D32", animation: "animate-pulse-gentle" },
  error: { icon: "X", color: "#C62828", animation: "animate-pulse-gentle" },
};

export default function SpeechBubble({ type, onClick }: SpeechBubbleProps) {
  const { icon, color, animation } = bubbleConfig[type];

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={animation}
      style={{
        position: "relative",
        background: "#fff",
        border: "2px solid #2C1810",
        padding: "2px 5px",
        fontFamily: "'Press Start 2P', monospace",
        fontSize: "8px",
        color,
        cursor: "pointer",
        zIndex: 10,
        whiteSpace: "nowrap",
        lineHeight: "1.2",
      }}
    >
      {icon}
      {/* Triangle pointer - points left toward building */}
      <div
        style={{
          position: "absolute",
          left: "-6px",
          top: "50%",
          transform: "translateY(-50%)",
          width: 0,
          height: 0,
          borderTop: "4px solid transparent",
          borderBottom: "4px solid transparent",
          borderRight: "6px solid #2C1810",
        }}
      />
    </div>
  );
}
