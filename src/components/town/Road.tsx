import type { TimeTheme } from "../../hooks/useTimeOfDay";

interface RoadProps {
  theme: TimeTheme;
}

export default function Road({ theme }: RoadProps) {
  const r = theme.road;

  return (
    <div
      style={{
        width: "100%",
        height: "15vh",
        background: r.gradient,
        position: "relative",
        borderTop: `3px solid ${r.borderTop}`,
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
          backgroundImage: `repeating-linear-gradient(to right, ${r.ruts} 0px, ${r.ruts} 20px, transparent 20px, transparent 40px)`,
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
          backgroundImage: `repeating-linear-gradient(to right, ${r.ruts} 0px, ${r.ruts} 20px, transparent 20px, transparent 40px)`,
        }}
      />

      {/* Scattered rocks */}
      <div style={{ position: "absolute", left: "12%", top: "25%", width: "4px", height: "4px", background: r.rocks[0], boxShadow: `4px 0 0 ${r.rocks[0]}` }} />
      <div style={{ position: "absolute", left: "28%", top: "72%", width: "4px", height: "4px", background: r.rocks[1] }} />
      <div style={{ position: "absolute", left: "45%", top: "30%", width: "4px", height: "4px", background: r.rocks[0] }} />
      <div style={{ position: "absolute", left: "62%", top: "78%", width: "4px", height: "4px", background: r.rocks[1], boxShadow: `4px 0 0 ${r.rocks[1]}` }} />
      <div style={{ position: "absolute", left: "78%", top: "20%", width: "4px", height: "4px", background: r.rocks[0] }} />
      <div style={{ position: "absolute", left: "88%", top: "65%", width: "4px", height: "4px", background: r.rocks[1] }} />
      <div style={{ position: "absolute", left: "35%", top: "15%", width: "4px", height: "4px", background: r.rocks[1] }} />
      <div style={{ position: "absolute", left: "55%", top: "82%", width: "4px", height: "4px", background: r.rocks[0], boxShadow: `4px 0 0 ${r.rocks[1]}` }} />

      {/* Desert scrub along top edge */}
      <div style={{ position: "absolute", left: "5%", top: "-2px", width: "4px", height: "4px", background: r.scrub[0], boxShadow: `4px 0 0 ${r.scrub[1]}, -4px 4px 0 ${r.scrub[0]}, 8px 4px 0 ${r.scrub[1]}, 0px -4px 0 ${r.scrub[1]}, 4px -4px 0 ${r.scrub[0]}` }} />
      <div style={{ position: "absolute", left: "22%", top: "-2px", width: "4px", height: "4px", background: r.scrub[1], boxShadow: `4px 0 0 ${r.scrub[0]}, 0px -4px 0 ${r.scrub[0]}, 4px -4px 0 ${r.scrub[1]}` }} />
      <div style={{ position: "absolute", left: "48%", top: "-2px", width: "4px", height: "4px", background: r.scrub[0], boxShadow: `4px 0 0 ${r.scrub[1]}, -4px 4px 0 ${r.scrub[1]}, 0px -4px 0 ${r.scrub[1]}, 4px -4px 0 ${r.scrub[0]}, 8px 4px 0 ${r.scrub[0]}` }} />
      <div style={{ position: "absolute", left: "70%", top: "-2px", width: "4px", height: "4px", background: r.scrub[1], boxShadow: `4px 0 0 ${r.scrub[0]}, 0px -4px 0 ${r.scrub[1]}` }} />
      <div style={{ position: "absolute", left: "90%", top: "-2px", width: "4px", height: "4px", background: r.scrub[0], boxShadow: `4px 0 0 ${r.scrub[1]}, -4px 4px 0 ${r.scrub[0]}, 0px -4px 0 ${r.scrub[0]}, 4px -4px 0 ${r.scrub[1]}` }} />

      {/* Rolling tumbleweed */}
      <div
        className="animate-tumbleweed"
        style={{
          position: "absolute",
          top: "35%",
          left: "-20px",
          width: "4px",
          height: "4px",
          background: r.tumbleweed[0],
          boxShadow: `
            4px 0 0 ${r.tumbleweed[1]}, -4px 0 0 ${r.tumbleweed[1]},
            0 4px 0 ${r.tumbleweed[1]}, 0 -4px 0 ${r.tumbleweed[1]},
            4px -4px 0 ${r.tumbleweed[0]}, -4px -4px 0 ${r.tumbleweed[0]},
            4px 4px 0 ${r.tumbleweed[0]}, -4px 4px 0 ${r.tumbleweed[0]},
            8px 0 0 ${r.tumbleweed[0]}, -8px 0 0 ${r.tumbleweed[0]},
            0 8px 0 ${r.tumbleweed[0]}, 0 -8px 0 ${r.tumbleweed[0]}
          `,
        }}
      />
    </div>
  );
}
