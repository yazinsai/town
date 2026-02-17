export default function Sky() {
  return (
    <div
      style={{
        width: "100%",
        height: "40vh",
        background: "linear-gradient(to bottom, #6B8FA3 0%, #8EAAB8 30%, #C9956B 70%, #D4956B 85%, #C97B3A 100%)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Pixel clouds using box-shadow */}
      <div
        style={{
          position: "absolute",
          top: "20%",
          left: "15%",
          width: "8px",
          height: "8px",
          background: "rgba(255,255,255,0.4)",
          boxShadow: `
            8px 0 0 rgba(255,255,255,0.4),
            16px 0 0 rgba(255,255,255,0.4),
            24px 0 0 rgba(255,255,255,0.4),
            0px -8px 0 rgba(255,255,255,0.3),
            8px -8px 0 rgba(255,255,255,0.3),
            16px -8px 0 rgba(255,255,255,0.3)
          `,
        }}
        className="animate-bob"
      />
      <div
        style={{
          position: "absolute",
          top: "12%",
          left: "60%",
          width: "8px",
          height: "8px",
          background: "rgba(255,255,255,0.3)",
          boxShadow: `
            8px 0 0 rgba(255,255,255,0.3),
            16px 0 0 rgba(255,255,255,0.3),
            8px -8px 0 rgba(255,255,255,0.2)
          `,
        }}
        className="animate-bob"
      />
      <div
        style={{
          position: "absolute",
          top: "28%",
          left: "80%",
          width: "8px",
          height: "8px",
          background: "rgba(255,255,255,0.35)",
          boxShadow: `
            8px 0 0 rgba(255,255,255,0.35),
            16px 0 0 rgba(255,255,255,0.35),
            24px 0 0 rgba(255,255,255,0.35),
            32px 0 0 rgba(255,255,255,0.35),
            8px -8px 0 rgba(255,255,255,0.25),
            16px -8px 0 rgba(255,255,255,0.25),
            24px -8px 0 rgba(255,255,255,0.25)
          `,
        }}
        className="animate-bob"
      />
    </div>
  );
}
