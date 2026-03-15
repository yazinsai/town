interface CaretakerSpriteProps {
  active?: boolean;
}

export default function CaretakerSprite({ active = false }: CaretakerSpriteProps) {
  return (
    <div
      className={active ? "animate-caretaker-active" : "animate-caretaker-idle"}
      style={{
        width: "16px",
        height: "24px",
        position: "relative",
        imageRendering: "pixelated",
      }}
    >
      {/* Hat */}
      <div style={{
        position: "absolute", top: 0, left: "2px",
        width: "12px", height: "4px", background: "#5C3317",
      }} />
      <div style={{
        position: "absolute", top: "2px", left: 0,
        width: "16px", height: "2px", background: "#5C3317",
      }} />
      {/* Head */}
      <div style={{
        position: "absolute", top: "4px", left: "4px",
        width: "8px", height: "6px", background: "#D4A574",
      }} />
      {/* Eyes */}
      <div style={{
        position: "absolute", top: "6px", left: "5px",
        width: "2px", height: "2px", background: "#2A1A0A",
      }} />
      <div style={{
        position: "absolute", top: "6px", left: "9px",
        width: "2px", height: "2px", background: "#2A1A0A",
      }} />
      {/* Body (vest) */}
      <div style={{
        position: "absolute", top: "10px", left: "3px",
        width: "10px", height: "8px", background: "#8B4513",
      }} />
      {/* Badge/star on vest */}
      <div style={{
        position: "absolute", top: "12px", left: "5px",
        width: "2px", height: "2px", background: "#FFD700",
      }} />
      {/* Legs */}
      <div style={{
        position: "absolute", top: "18px", left: "4px",
        width: "3px", height: "6px", background: "#4A3728",
      }} />
      <div style={{
        position: "absolute", top: "18px", left: "9px",
        width: "3px", height: "6px", background: "#4A3728",
      }} />
    </div>
  );
}
