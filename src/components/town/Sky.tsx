export default function Sky() {
  return (
    <div
      style={{
        width: "100%",
        height: "40vh",
        background: `
          radial-gradient(ellipse at 75% 92%, rgba(255,210,100,0.3) 0%, transparent 50%),
          linear-gradient(to bottom,
            #0E1926 0%,
            #1B3248 10%,
            #2E5570 22%,
            #5A8899 35%,
            #8EAAB8 45%,
            #C49468 60%,
            #D89850 72%,
            #E8A848 82%,
            #F0B855 90%,
            #D48540 100%
          )
        `,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Stars twinkling in the dark upper sky */}
      <div className="animate-star-twinkle" style={{ position: "absolute", top: "4%", left: "7%", width: "2px", height: "2px", background: "rgba(255,255,255,0.6)" }} />
      <div className="animate-star-twinkle" style={{ position: "absolute", top: "8%", left: "18%", width: "2px", height: "2px", background: "rgba(255,255,255,0.5)", animationDelay: "-1.6s" }} />
      <div className="animate-star-twinkle" style={{ position: "absolute", top: "2%", left: "32%", width: "2px", height: "2px", background: "rgba(255,255,255,0.7)", animationDelay: "-0.8s" }} />
      <div className="animate-star-twinkle" style={{ position: "absolute", top: "12%", left: "42%", width: "2px", height: "2px", background: "rgba(255,255,255,0.4)", animationDelay: "-2.4s" }} />
      <div className="animate-star-twinkle" style={{ position: "absolute", top: "6%", left: "55%", width: "2px", height: "2px", background: "rgba(255,255,255,0.5)", animationDelay: "-3.2s" }} />
      <div className="animate-star-twinkle" style={{ position: "absolute", top: "3%", left: "68%", width: "2px", height: "2px", background: "rgba(255,255,255,0.6)", animationDelay: "-1.2s" }} />
      <div className="animate-star-twinkle" style={{ position: "absolute", top: "10%", left: "78%", width: "2px", height: "2px", background: "rgba(255,255,255,0.4)", animationDelay: "-0.4s" }} />
      <div className="animate-star-twinkle" style={{ position: "absolute", top: "5%", left: "90%", width: "2px", height: "2px", background: "rgba(255,255,255,0.5)", animationDelay: "-2.0s" }} />
      <div className="animate-star-twinkle" style={{ position: "absolute", top: "15%", left: "25%", width: "2px", height: "2px", background: "rgba(255,255,255,0.3)", animationDelay: "-2.8s" }} />
      <div className="animate-star-twinkle" style={{ position: "absolute", top: "7%", left: "48%", width: "2px", height: "2px", background: "rgba(255,255,255,0.5)", animationDelay: "-3.6s" }} />
      <div className="animate-star-twinkle" style={{ position: "absolute", top: "1%", left: "85%", width: "2px", height: "2px", background: "rgba(255,255,255,0.6)", animationDelay: "-1.0s" }} />
      <div className="animate-star-twinkle" style={{ position: "absolute", top: "14%", left: "62%", width: "2px", height: "2px", background: "rgba(255,255,255,0.3)", animationDelay: "-0.6s" }} />

      {/* Sun atmospheric glow */}
      <div
        style={{
          position: "absolute",
          bottom: "-30%",
          left: "62%",
          width: "35%",
          height: "80%",
          background: "radial-gradient(ellipse, rgba(255,210,100,0.25) 0%, rgba(255,170,60,0.1) 40%, transparent 65%)",
          pointerEvents: "none",
        }}
      />

      {/* Pixel sun - setting near horizon */}
      <div
        style={{
          position: "absolute",
          bottom: "5%",
          left: "72%",
          width: "8px",
          height: "8px",
          background: "#FFD870",
          boxShadow: `
            8px 0 0 #FFD870, 16px 0 0 #FFE890, 24px 0 0 #FFE890, 32px 0 0 #FFD870,
            -8px -8px 0 #FFD870, 0px -8px 0 #FFE890, 8px -8px 0 #FFF0A8, 16px -8px 0 #FFFAB8, 24px -8px 0 #FFF0A8, 32px -8px 0 #FFE890, 40px -8px 0 #FFD870,
            -8px -16px 0 #FFE070, 0px -16px 0 #FFF0A8, 8px -16px 0 #FFFAB8, 16px -16px 0 #FFFFC8, 24px -16px 0 #FFFAB8, 32px -16px 0 #FFF0A8, 40px -16px 0 #FFE070,
            -8px -24px 0 #FFD870, 0px -24px 0 #FFE890, 8px -24px 0 #FFF0A8, 16px -24px 0 #FFFAB8, 24px -24px 0 #FFF0A8, 32px -24px 0 #FFE890, 40px -24px 0 #FFD870,
            0px -32px 0 #FFD870, 8px -32px 0 #FFE070, 16px -32px 0 #FFE890, 24px -32px 0 #FFE070, 32px -32px 0 #FFD870,
            8px -40px 0 #FFD060, 16px -40px 0 #FFD870, 24px -40px 0 #FFD060
          `,
        }}
      />

      {/* Cloud 1 - large warm, lower left */}
      <div
        className="animate-bob"
        style={{
          position: "absolute",
          top: "52%",
          left: "8%",
          width: "8px",
          height: "8px",
          background: "rgba(255,210,170,0.3)",
          boxShadow: `
            8px 0 0 rgba(255,210,170,0.35), 16px 0 0 rgba(255,210,170,0.4),
            24px 0 0 rgba(255,210,170,0.4), 32px 0 0 rgba(255,210,170,0.35),
            40px 0 0 rgba(255,210,170,0.3),
            0px -8px 0 rgba(255,210,170,0.25), 8px -8px 0 rgba(255,210,170,0.3),
            16px -8px 0 rgba(255,210,170,0.35), 24px -8px 0 rgba(255,210,170,0.3),
            32px -8px 0 rgba(255,210,170,0.25),
            8px -16px 0 rgba(255,210,170,0.2), 16px -16px 0 rgba(255,210,170,0.25)
          `,
        }}
      />

      {/* Cloud 2 - cool blue, upper area */}
      <div
        className="animate-bob"
        style={{
          position: "absolute",
          top: "15%",
          left: "35%",
          width: "8px",
          height: "8px",
          background: "rgba(180,210,240,0.3)",
          boxShadow: `
            8px 0 0 rgba(180,210,240,0.3), 16px 0 0 rgba(180,210,240,0.35),
            24px 0 0 rgba(180,210,240,0.3),
            8px -8px 0 rgba(180,210,240,0.25), 16px -8px 0 rgba(180,210,240,0.25)
          `,
          animationDelay: "-0.7s",
        }}
      />

      {/* Cloud 3 - large backlit near sun */}
      <div
        className="animate-bob"
        style={{
          position: "absolute",
          top: "42%",
          left: "48%",
          width: "8px",
          height: "8px",
          background: "rgba(255,185,120,0.25)",
          boxShadow: `
            8px 0 0 rgba(255,185,120,0.3), 16px 0 0 rgba(255,195,130,0.35),
            24px 0 0 rgba(255,205,140,0.4), 32px 0 0 rgba(255,195,130,0.35),
            40px 0 0 rgba(255,185,120,0.3), 48px 0 0 rgba(255,185,120,0.25),
            0px -8px 0 rgba(255,185,120,0.2), 8px -8px 0 rgba(255,195,130,0.3),
            16px -8px 0 rgba(255,205,140,0.35), 24px -8px 0 rgba(255,215,150,0.4),
            32px -8px 0 rgba(255,205,140,0.35), 40px -8px 0 rgba(255,185,120,0.25),
            8px -16px 0 rgba(255,195,130,0.2), 16px -16px 0 rgba(255,205,140,0.25),
            24px -16px 0 rgba(255,205,140,0.25), 32px -16px 0 rgba(255,195,130,0.2)
          `,
          animationDelay: "-1.2s",
        }}
      />

      {/* Cloud 4 - small wispy, high right */}
      <div
        className="animate-bob"
        style={{
          position: "absolute",
          top: "10%",
          left: "75%",
          width: "8px",
          height: "8px",
          background: "rgba(200,220,245,0.25)",
          boxShadow: "8px 0 0 rgba(200,220,245,0.3), 16px 0 0 rgba(200,220,245,0.25)",
          animationDelay: "-1.8s",
        }}
      />

      {/* Cloud 5 - warm, far right */}
      <div
        className="animate-bob"
        style={{
          position: "absolute",
          top: "58%",
          left: "88%",
          width: "8px",
          height: "8px",
          background: "rgba(255,195,140,0.3)",
          boxShadow: `
            8px 0 0 rgba(255,195,140,0.35), 16px 0 0 rgba(255,195,140,0.35),
            24px 0 0 rgba(255,195,140,0.3),
            0px -8px 0 rgba(255,195,140,0.25), 8px -8px 0 rgba(255,195,140,0.3),
            16px -8px 0 rgba(255,195,140,0.25)
          `,
          animationDelay: "-0.4s",
        }}
      />

      {/* Birds flying across the sky */}
      <div
        className="animate-bird-fly"
        style={{
          position: "absolute",
          top: "22%",
          left: "105%",
          width: "4px",
          height: "4px",
          background: "rgba(20,15,10,0.5)",
          boxShadow: "-4px -4px 0 rgba(20,15,10,0.5), 4px -4px 0 rgba(20,15,10,0.5), -8px -8px 0 rgba(20,15,10,0.4), 8px -8px 0 rgba(20,15,10,0.4)",
        }}
      />
      <div
        className="animate-bird-fly"
        style={{
          position: "absolute",
          top: "28%",
          left: "105%",
          width: "4px",
          height: "4px",
          background: "rgba(20,15,10,0.4)",
          boxShadow: "-4px -4px 0 rgba(20,15,10,0.4), 4px -4px 0 rgba(20,15,10,0.4)",
          animationDelay: "-6s",
        }}
      />
      <div
        className="animate-bird-fly"
        style={{
          position: "absolute",
          top: "18%",
          left: "105%",
          width: "4px",
          height: "4px",
          background: "rgba(20,15,10,0.3)",
          boxShadow: "-4px -4px 0 rgba(20,15,10,0.3), 4px -4px 0 rgba(20,15,10,0.3)",
          animationDelay: "-12s",
        }}
      />

      {/* Mesa silhouettes along the horizon */}
      {/* Mesa 1 - wide flat-topped butte, left */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "0%",
          width: "22%",
          height: "35%",
          background: "#2A1A0E",
          clipPath: `polygon(
            0% 100%, 0% 70%, 8% 70%, 8% 50%, 15% 50%,
            15% 32%, 22% 32%, 78% 32%, 85% 32%, 85% 50%,
            92% 50%, 92% 70%, 100% 70%, 100% 100%
          )`,
        }}
      />

      {/* Mesa 2 - tall narrow spire */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "18%",
          width: "10%",
          height: "45%",
          background: "#221408",
          clipPath: `polygon(
            0% 100%, 0% 60%, 15% 60%, 15% 35%, 28% 35%,
            28% 12%, 72% 12%, 72% 35%, 85% 35%, 85% 60%,
            100% 60%, 100% 100%
          )`,
        }}
      />

      {/* Mesa 3 - wide distant range */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "30%",
          width: "32%",
          height: "28%",
          background: "#2E1C0F",
          clipPath: `polygon(
            0% 100%, 0% 65%, 5% 65%, 5% 45%, 10% 45%,
            10% 30%, 35% 30%, 35% 20%, 55% 20%, 55% 30%,
            80% 30%, 80% 45%, 88% 45%, 88% 65%, 95% 65%,
            100% 80%, 100% 100%
          )`,
        }}
      />

      {/* Mesa 4 - small distant butte */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "58%",
          width: "10%",
          height: "22%",
          background: "#331E10",
          clipPath: `polygon(
            0% 100%, 0% 55%, 15% 55%, 15% 25%,
            85% 25%, 85% 55%, 100% 55%, 100% 100%
          )`,
        }}
      />

      {/* Cactus silhouettes near mesas */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "25%",
          width: "4px",
          height: "4px",
          background: "#1E1208",
          boxShadow: `
            0 -4px 0 #1E1208, 0 -8px 0 #1E1208, 0 -12px 0 #1E1208,
            0 -16px 0 #1E1208, 0 -20px 0 #1E1208, 0 -24px 0 #1E1208,
            -4px -16px 0 #1E1208, -8px -16px 0 #1E1208,
            -8px -20px 0 #1E1208, -8px -24px 0 #1E1208,
            4px -8px 0 #1E1208, 8px -8px 0 #1E1208, 8px -12px 0 #1E1208
          `,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "88%",
          width: "4px",
          height: "4px",
          background: "#1E1208",
          boxShadow: `
            0 -4px 0 #1E1208, 0 -8px 0 #1E1208, 0 -12px 0 #1E1208,
            0 -16px 0 #1E1208, 0 -20px 0 #1E1208,
            -4px -12px 0 #1E1208, -8px -12px 0 #1E1208, -8px -16px 0 #1E1208,
            4px -8px 0 #1E1208, 8px -8px 0 #1E1208,
            8px -12px 0 #1E1208, 8px -16px 0 #1E1208
          `,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "65%",
          width: "4px",
          height: "4px",
          background: "#1E1208",
          boxShadow: `
            0 -4px 0 #1E1208, 0 -8px 0 #1E1208, 0 -12px 0 #1E1208,
            0 -16px 0 #1E1208, -4px -8px 0 #1E1208, 4px -12px 0 #1E1208
          `,
        }}
      />
    </div>
  );
}
