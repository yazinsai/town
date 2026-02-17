export default function Road() {
  return (
    <div
      style={{
        width: "100%",
        height: "15vh",
        background: "linear-gradient(to bottom, #C4A86A 0%, #BAA062 20%, #B09858 40%, #A89050 60%, #A08848 80%, #988040 100%)",
        position: "relative",
        borderTop: "3px solid #8B7340",
        overflow: "hidden",
      }}
    >
      {/* Wagon wheel ruts - left track */}
      <div
        style={{
          position: "absolute",
          top: "42%",
          left: 0,
          right: 0,
          height: "2px",
          backgroundImage:
            "repeating-linear-gradient(to right, #9E8855 0px, #9E8855 20px, transparent 20px, transparent 40px)",
        }}
      />
      {/* Right track */}
      <div
        style={{
          position: "absolute",
          top: "58%",
          left: 0,
          right: 0,
          height: "2px",
          backgroundImage:
            "repeating-linear-gradient(to right, #9E8855 0px, #9E8855 20px, transparent 20px, transparent 40px)",
        }}
      />

      {/* Scattered rocks */}
      <div style={{ position: "absolute", left: "12%", top: "25%", width: "4px", height: "4px", background: "#8B7A50", boxShadow: "4px 0 0 #8B7A50" }} />
      <div style={{ position: "absolute", left: "28%", top: "72%", width: "4px", height: "4px", background: "#7A6940" }} />
      <div style={{ position: "absolute", left: "45%", top: "30%", width: "4px", height: "4px", background: "#8B7A50" }} />
      <div style={{ position: "absolute", left: "62%", top: "78%", width: "4px", height: "4px", background: "#7A6940", boxShadow: "4px 0 0 #7A6940" }} />
      <div style={{ position: "absolute", left: "78%", top: "20%", width: "4px", height: "4px", background: "#8B7A50" }} />
      <div style={{ position: "absolute", left: "88%", top: "65%", width: "4px", height: "4px", background: "#7A6940" }} />
      <div style={{ position: "absolute", left: "35%", top: "15%", width: "4px", height: "4px", background: "#7A6940" }} />
      <div style={{ position: "absolute", left: "55%", top: "82%", width: "4px", height: "4px", background: "#8B7A50", boxShadow: "4px 0 0 #7A6940" }} />

      {/* Desert scrub along top edge */}
      <div style={{ position: "absolute", left: "5%", top: "-2px", width: "4px", height: "4px", background: "#6A7A4A", boxShadow: "4px 0 0 #5A6A3A, -4px 4px 0 #6A7A4A, 8px 4px 0 #5A6A3A, 0px -4px 0 #5A6A3A, 4px -4px 0 #6A7A4A" }} />
      <div style={{ position: "absolute", left: "22%", top: "-2px", width: "4px", height: "4px", background: "#5A6A3A", boxShadow: "4px 0 0 #6A7A4A, 0px -4px 0 #6A7A4A, 4px -4px 0 #5A6A3A" }} />
      <div style={{ position: "absolute", left: "48%", top: "-2px", width: "4px", height: "4px", background: "#6A7A4A", boxShadow: "4px 0 0 #5A6A3A, -4px 4px 0 #5A6A3A, 0px -4px 0 #5A6A3A, 4px -4px 0 #6A7A4A, 8px 4px 0 #6A7A4A" }} />
      <div style={{ position: "absolute", left: "70%", top: "-2px", width: "4px", height: "4px", background: "#5A6A3A", boxShadow: "4px 0 0 #6A7A4A, 0px -4px 0 #5A6A3A" }} />
      <div style={{ position: "absolute", left: "90%", top: "-2px", width: "4px", height: "4px", background: "#6A7A4A", boxShadow: "4px 0 0 #5A6A3A, -4px 4px 0 #6A7A4A, 0px -4px 0 #6A7A4A, 4px -4px 0 #5A6A3A" }} />

      {/* Rolling tumbleweed */}
      <div
        className="animate-tumbleweed"
        style={{
          position: "absolute",
          top: "35%",
          left: "-20px",
          width: "4px",
          height: "4px",
          background: "#8B7345",
          boxShadow: `
            4px 0 0 #7A6235, -4px 0 0 #7A6235,
            0 4px 0 #7A6235, 0 -4px 0 #7A6235,
            4px -4px 0 #8B7345, -4px -4px 0 #8B7345,
            4px 4px 0 #8B7345, -4px 4px 0 #8B7345,
            8px 0 0 #8B7345, -8px 0 0 #8B7345,
            0 8px 0 #8B7345, 0 -8px 0 #8B7345
          `,
        }}
      />
    </div>
  );
}
