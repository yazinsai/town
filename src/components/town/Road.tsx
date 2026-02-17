export default function Road() {
  return (
    <div
      style={{
        width: "100%",
        height: "15vh",
        background: "linear-gradient(to bottom, #C4A86A, #B89B5E, #A88B4E)",
        position: "relative",
        borderTop: "3px solid #8B7340",
      }}
    >
      {/* Subtle road texture — dashes */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: 0,
          right: 0,
          height: "2px",
          backgroundImage:
            "repeating-linear-gradient(to right, #9E8855 0px, #9E8855 20px, transparent 20px, transparent 40px)",
        }}
      />
    </div>
  );
}
