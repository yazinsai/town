import type { TimeTheme } from "../../hooks/useTimeOfDay";

interface SkyProps {
  theme: TimeTheme;
}

function PixelSun({ theme }: { theme: TimeTheme }) {
  const { color, bottom, left } = theme.sun;

  // Night = crescent moon
  if (theme.period === "night") {
    return (
      <div
        style={{
          position: "absolute",
          bottom,
          left,
          width: "8px",
          height: "8px",
          background: color,
          boxShadow: `
            8px 0 0 ${color}, 16px 0 0 ${color},
            -8px -8px 0 ${color}, 0px -8px 0 ${color},
            -8px -16px 0 ${color}, 0px -16px 0 ${color},
            -8px -24px 0 ${color}, 0px -24px 0 ${color}, 8px -24px 0 ${color},
            0px -32px 0 ${color}, 8px -32px 0 ${color}, 16px -32px 0 ${color}
          `,
        }}
      />
    );
  }

  // Day = smaller, brighter sun higher up
  if (theme.period === "day") {
    return (
      <div
        style={{
          position: "absolute",
          bottom,
          left,
          width: "8px",
          height: "8px",
          background: color,
          boxShadow: `
            8px 0 0 ${color}, 16px 0 0 ${color},
            0px -8px 0 ${color}, 8px -8px 0 #FFFFF0, 16px -8px 0 ${color},
            0px -16px 0 ${color}, 8px -16px 0 #FFFFF0, 16px -16px 0 ${color},
            0px -24px 0 ${color}, 8px -24px 0 ${color}, 16px -24px 0 ${color}
          `,
        }}
      />
    );
  }

  // Morning = rising sun, left side
  if (theme.period === "morning") {
    return (
      <div
        style={{
          position: "absolute",
          bottom,
          left,
          width: "8px",
          height: "8px",
          background: color,
          boxShadow: `
            8px 0 0 ${color}, 16px 0 0 ${color}, 24px 0 0 ${color},
            0px -8px 0 ${color}, 8px -8px 0 #FFF0C0, 16px -8px 0 #FFF0C0, 24px -8px 0 ${color},
            0px -16px 0 ${color}, 8px -16px 0 #FFF8D8, 16px -16px 0 #FFF8D8, 24px -16px 0 ${color},
            0px -24px 0 ${color}, 8px -24px 0 #FFF0C0, 16px -24px 0 #FFF0C0, 24px -24px 0 ${color},
            8px -32px 0 ${color}, 16px -32px 0 ${color}
          `,
        }}
      />
    );
  }

  // Sunset (default) = original large setting sun
  return (
    <div
      style={{
        position: "absolute",
        bottom,
        left,
        width: "8px",
        height: "8px",
        background: color,
        boxShadow: `
          8px 0 0 ${color}, 16px 0 0 #FFE890, 24px 0 0 #FFE890, 32px 0 0 ${color},
          -8px -8px 0 ${color}, 0px -8px 0 #FFE890, 8px -8px 0 #FFF0A8, 16px -8px 0 #FFFAB8, 24px -8px 0 #FFF0A8, 32px -8px 0 #FFE890, 40px -8px 0 ${color},
          -8px -16px 0 #FFE070, 0px -16px 0 #FFF0A8, 8px -16px 0 #FFFAB8, 16px -16px 0 #FFFFC8, 24px -16px 0 #FFFAB8, 32px -16px 0 #FFF0A8, 40px -16px 0 #FFE070,
          -8px -24px 0 ${color}, 0px -24px 0 #FFE890, 8px -24px 0 #FFF0A8, 16px -24px 0 #FFFAB8, 24px -24px 0 #FFF0A8, 32px -24px 0 #FFE890, 40px -24px 0 ${color},
          0px -32px 0 ${color}, 8px -32px 0 #FFE070, 16px -32px 0 #FFE890, 24px -32px 0 #FFE070, 32px -32px 0 ${color},
          8px -40px 0 #FFD060, 16px -40px 0 ${color}, 24px -40px 0 #FFD060
        `,
      }}
    />
  );
}

export default function Sky({ theme }: SkyProps) {
  const starBaseOpacity = theme.stars.opacity;

  return (
    <div
      style={{
        width: "100%",
        height: "40vh",
        background: theme.sky.gradient,
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Stars - visibility controlled by theme */}
      {starBaseOpacity > 0 && (
        <>
          <div className="animate-star-twinkle" style={{ position: "absolute", top: "4%", left: "7%", width: "2px", height: "2px", background: `rgba(255,255,255,${0.6 * starBaseOpacity})` }} />
          <div className="animate-star-twinkle" style={{ position: "absolute", top: "8%", left: "18%", width: "2px", height: "2px", background: `rgba(255,255,255,${0.5 * starBaseOpacity})`, animationDelay: "-1.6s" }} />
          <div className="animate-star-twinkle" style={{ position: "absolute", top: "2%", left: "32%", width: "2px", height: "2px", background: `rgba(255,255,255,${0.7 * starBaseOpacity})`, animationDelay: "-0.8s" }} />
          <div className="animate-star-twinkle" style={{ position: "absolute", top: "12%", left: "42%", width: "2px", height: "2px", background: `rgba(255,255,255,${0.4 * starBaseOpacity})`, animationDelay: "-2.4s" }} />
          <div className="animate-star-twinkle" style={{ position: "absolute", top: "6%", left: "55%", width: "2px", height: "2px", background: `rgba(255,255,255,${0.5 * starBaseOpacity})`, animationDelay: "-3.2s" }} />
          <div className="animate-star-twinkle" style={{ position: "absolute", top: "3%", left: "68%", width: "2px", height: "2px", background: `rgba(255,255,255,${0.6 * starBaseOpacity})`, animationDelay: "-1.2s" }} />
          <div className="animate-star-twinkle" style={{ position: "absolute", top: "10%", left: "78%", width: "2px", height: "2px", background: `rgba(255,255,255,${0.4 * starBaseOpacity})`, animationDelay: "-0.4s" }} />
          <div className="animate-star-twinkle" style={{ position: "absolute", top: "5%", left: "90%", width: "2px", height: "2px", background: `rgba(255,255,255,${0.5 * starBaseOpacity})`, animationDelay: "-2.0s" }} />
          <div className="animate-star-twinkle" style={{ position: "absolute", top: "15%", left: "25%", width: "2px", height: "2px", background: `rgba(255,255,255,${0.3 * starBaseOpacity})`, animationDelay: "-2.8s" }} />
          <div className="animate-star-twinkle" style={{ position: "absolute", top: "7%", left: "48%", width: "2px", height: "2px", background: `rgba(255,255,255,${0.5 * starBaseOpacity})`, animationDelay: "-3.6s" }} />
          <div className="animate-star-twinkle" style={{ position: "absolute", top: "1%", left: "85%", width: "2px", height: "2px", background: `rgba(255,255,255,${0.6 * starBaseOpacity})`, animationDelay: "-1.0s" }} />
          <div className="animate-star-twinkle" style={{ position: "absolute", top: "14%", left: "62%", width: "2px", height: "2px", background: `rgba(255,255,255,${0.3 * starBaseOpacity})`, animationDelay: "-0.6s" }} />
          {/* Extra stars for night */}
          {theme.period === "night" && (
            <>
              <div className="animate-star-twinkle" style={{ position: "absolute", top: "20%", left: "12%", width: "2px", height: "2px", background: "rgba(255,255,255,0.5)", animationDelay: "-0.3s" }} />
              <div className="animate-star-twinkle" style={{ position: "absolute", top: "25%", left: "38%", width: "2px", height: "2px", background: "rgba(255,255,255,0.4)", animationDelay: "-1.8s" }} />
              <div className="animate-star-twinkle" style={{ position: "absolute", top: "30%", left: "72%", width: "2px", height: "2px", background: "rgba(255,255,255,0.6)", animationDelay: "-2.5s" }} />
              <div className="animate-star-twinkle" style={{ position: "absolute", top: "35%", left: "52%", width: "2px", height: "2px", background: "rgba(255,255,255,0.3)", animationDelay: "-3.1s" }} />
              <div className="animate-star-twinkle" style={{ position: "absolute", top: "22%", left: "82%", width: "2px", height: "2px", background: "rgba(255,255,255,0.5)", animationDelay: "-0.9s" }} />
              <div className="animate-star-twinkle" style={{ position: "absolute", top: "18%", left: "58%", width: "2px", height: "2px", background: "rgba(255,255,255,0.7)", animationDelay: "-2.2s" }} />
            </>
          )}
        </>
      )}

      {/* Sun/moon atmospheric glow */}
      <div
        style={{
          position: "absolute",
          bottom: "-30%",
          left: theme.period === "morning" ? "5%" : theme.period === "day" ? "35%" : theme.period === "night" ? "15%" : "62%",
          width: "35%",
          height: "80%",
          background: `radial-gradient(ellipse, ${theme.sun.glowColor} 0%, ${theme.sky.sunGlow} 40%, transparent 65%)`,
          pointerEvents: "none",
        }}
      />

      {/* Sun or Moon */}
      <PixelSun theme={theme} />

      {/* Cloud 1 - large warm, lower left */}
      <div
        className="animate-bob"
        style={{
          position: "absolute",
          top: "52%",
          left: "8%",
          width: "8px",
          height: "8px",
          background: theme.clouds.warm,
          boxShadow: `
            8px 0 0 ${theme.clouds.warm}, 16px 0 0 ${theme.clouds.warm},
            24px 0 0 ${theme.clouds.warm}, 32px 0 0 ${theme.clouds.warm},
            40px 0 0 ${theme.clouds.warm},
            0px -8px 0 ${theme.clouds.warm}, 8px -8px 0 ${theme.clouds.warm},
            16px -8px 0 ${theme.clouds.warm}, 24px -8px 0 ${theme.clouds.warm},
            32px -8px 0 ${theme.clouds.warm},
            8px -16px 0 ${theme.clouds.warm}, 16px -16px 0 ${theme.clouds.warm}
          `,
        }}
      />

      {/* Cloud 2 - cool, upper area */}
      <div
        className="animate-bob"
        style={{
          position: "absolute",
          top: "15%",
          left: "35%",
          width: "8px",
          height: "8px",
          background: theme.clouds.cool,
          boxShadow: `
            8px 0 0 ${theme.clouds.cool}, 16px 0 0 ${theme.clouds.cool},
            24px 0 0 ${theme.clouds.cool},
            8px -8px 0 ${theme.clouds.cool}, 16px -8px 0 ${theme.clouds.cool}
          `,
          animationDelay: "-0.7s",
        }}
      />

      {/* Cloud 3 - large backlit */}
      <div
        className="animate-bob"
        style={{
          position: "absolute",
          top: "42%",
          left: "48%",
          width: "8px",
          height: "8px",
          background: theme.clouds.backlit,
          boxShadow: `
            8px 0 0 ${theme.clouds.backlit}, 16px 0 0 ${theme.clouds.backlit},
            24px 0 0 ${theme.clouds.backlit}, 32px 0 0 ${theme.clouds.backlit},
            40px 0 0 ${theme.clouds.backlit}, 48px 0 0 ${theme.clouds.backlit},
            0px -8px 0 ${theme.clouds.backlit}, 8px -8px 0 ${theme.clouds.backlit},
            16px -8px 0 ${theme.clouds.backlit}, 24px -8px 0 ${theme.clouds.backlit},
            32px -8px 0 ${theme.clouds.backlit}, 40px -8px 0 ${theme.clouds.backlit},
            8px -16px 0 ${theme.clouds.backlit}, 16px -16px 0 ${theme.clouds.backlit},
            24px -16px 0 ${theme.clouds.backlit}, 32px -16px 0 ${theme.clouds.backlit}
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
          background: theme.clouds.cool,
          boxShadow: `8px 0 0 ${theme.clouds.cool}, 16px 0 0 ${theme.clouds.cool}`,
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
          background: theme.clouds.warm,
          boxShadow: `
            8px 0 0 ${theme.clouds.warm}, 16px 0 0 ${theme.clouds.warm},
            24px 0 0 ${theme.clouds.warm},
            0px -8px 0 ${theme.clouds.warm}, 8px -8px 0 ${theme.clouds.warm},
            16px -8px 0 ${theme.clouds.warm}
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
          background: theme.birds,
          boxShadow: `-4px -4px 0 ${theme.birds}, 4px -4px 0 ${theme.birds}, -8px -8px 0 ${theme.birds}, 8px -8px 0 ${theme.birds}`,
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
          background: theme.birds,
          boxShadow: `-4px -4px 0 ${theme.birds}, 4px -4px 0 ${theme.birds}`,
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
          background: theme.birds,
          boxShadow: `-4px -4px 0 ${theme.birds}, 4px -4px 0 ${theme.birds}`,
          animationDelay: "-12s",
        }}
      />

      {/* Mesa silhouettes along the horizon */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "0%",
          width: "22%",
          height: "35%",
          background: theme.mesa.colors[0],
          clipPath: `polygon(
            0% 100%, 0% 70%, 8% 70%, 8% 50%, 15% 50%,
            15% 32%, 22% 32%, 78% 32%, 85% 32%, 85% 50%,
            92% 50%, 92% 70%, 100% 70%, 100% 100%
          )`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "18%",
          width: "10%",
          height: "45%",
          background: theme.mesa.colors[1],
          clipPath: `polygon(
            0% 100%, 0% 60%, 15% 60%, 15% 35%, 28% 35%,
            28% 12%, 72% 12%, 72% 35%, 85% 35%, 85% 60%,
            100% 60%, 100% 100%
          )`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "30%",
          width: "32%",
          height: "28%",
          background: theme.mesa.colors[2],
          clipPath: `polygon(
            0% 100%, 0% 65%, 5% 65%, 5% 45%, 10% 45%,
            10% 30%, 35% 30%, 35% 20%, 55% 20%, 55% 30%,
            80% 30%, 80% 45%, 88% 45%, 88% 65%, 95% 65%,
            100% 80%, 100% 100%
          )`,
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "58%",
          width: "10%",
          height: "22%",
          background: theme.mesa.colors[3],
          clipPath: `polygon(
            0% 100%, 0% 55%, 15% 55%, 15% 25%,
            85% 25%, 85% 55%, 100% 55%, 100% 100%
          )`,
        }}
      />

      {/* Cactus silhouettes */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "25%",
          width: "4px",
          height: "4px",
          background: theme.cactus,
          boxShadow: `
            0 -4px 0 ${theme.cactus}, 0 -8px 0 ${theme.cactus}, 0 -12px 0 ${theme.cactus},
            0 -16px 0 ${theme.cactus}, 0 -20px 0 ${theme.cactus}, 0 -24px 0 ${theme.cactus},
            -4px -16px 0 ${theme.cactus}, -8px -16px 0 ${theme.cactus},
            -8px -20px 0 ${theme.cactus}, -8px -24px 0 ${theme.cactus},
            4px -8px 0 ${theme.cactus}, 8px -8px 0 ${theme.cactus}, 8px -12px 0 ${theme.cactus}
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
          background: theme.cactus,
          boxShadow: `
            0 -4px 0 ${theme.cactus}, 0 -8px 0 ${theme.cactus}, 0 -12px 0 ${theme.cactus},
            0 -16px 0 ${theme.cactus}, 0 -20px 0 ${theme.cactus},
            -4px -12px 0 ${theme.cactus}, -8px -12px 0 ${theme.cactus}, -8px -16px 0 ${theme.cactus},
            4px -8px 0 ${theme.cactus}, 8px -8px 0 ${theme.cactus},
            8px -12px 0 ${theme.cactus}, 8px -16px 0 ${theme.cactus}
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
          background: theme.cactus,
          boxShadow: `
            0 -4px 0 ${theme.cactus}, 0 -8px 0 ${theme.cactus}, 0 -12px 0 ${theme.cactus},
            0 -16px 0 ${theme.cactus}, -4px -8px 0 ${theme.cactus}, 4px -12px 0 ${theme.cactus}
          `,
        }}
      />
    </div>
  );
}
