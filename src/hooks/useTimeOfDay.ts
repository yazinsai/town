import { useState, useEffect } from "react";

export type TimeOfDay = "morning" | "day" | "sunset" | "night";

function getTimeOfDay(hour: number): TimeOfDay {
  if (hour >= 6 && hour < 11) return "morning";
  if (hour >= 11 && hour < 17) return "day";
  if (hour >= 17 && hour < 20) return "sunset";
  return "night";
}

export interface TimeTheme {
  period: TimeOfDay;
  sky: {
    gradient: string;
    sunGlow: string;
  };
  sun: {
    color: string;
    glowColor: string;
    bottom: string;
    left: string;
  };
  stars: {
    opacity: number;
  };
  mesa: {
    colors: [string, string, string, string];
  };
  cactus: string;
  ground: {
    gradient: string;
    borderTop: string;
  };
  road: {
    gradient: string;
    borderTop: string;
    ruts: string;
    rocks: [string, string];
    scrub: [string, string];
    tumbleweed: [string, string];
  };
  clouds: {
    warm: string;
    cool: string;
    backlit: string;
  };
  birds: string;
  sceneBg: string;
}

const themes: Record<TimeOfDay, TimeTheme> = {
  morning: {
    period: "morning",
    sky: {
      gradient: `
        radial-gradient(ellipse at 20% 85%, rgba(255,200,140,0.35) 0%, transparent 50%),
        linear-gradient(to bottom,
          #4A6FA5 0%,
          #6B8FC5 10%,
          #8BADD5 22%,
          #A8C4E0 35%,
          #C4D8EA 45%,
          #E8C8A8 60%,
          #F0C890 72%,
          #F5D498 82%,
          #F8DCA0 90%,
          #E8B870 100%
        )
      `,
      sunGlow: "rgba(255,220,150,0.2)",
    },
    sun: {
      color: "#FFE090",
      glowColor: "rgba(255,220,150,0.25)",
      bottom: "8%",
      left: "15%",
    },
    stars: { opacity: 0 },
    mesa: { colors: ["#3A2A1E", "#322218", "#3E2C1F", "#432E20"] },
    cactus: "#2E2218",
    ground: {
      gradient: "linear-gradient(to bottom, #E8B870 0%, #D8B068 15%, #D0A860 35%, #C8A058 60%, #C4A060 85%, #C0986A 100%)",
      borderTop: "#A89050",
    },
    road: {
      gradient: "linear-gradient(to bottom, #C0986A 0%, #B89062 20%, #B08858 40%, #A88050 60%, #A07848 80%, #987040 100%)",
      borderTop: "#A08848",
      ruts: "#A89060",
      rocks: ["#9B8A60", "#8A7950"],
      scrub: ["#7A8A5A", "#6A7A4A"],
      tumbleweed: ["#9B8355", "#8A7245"],
    },
    clouds: {
      warm: "rgba(255,230,200,0.35)",
      cool: "rgba(200,220,245,0.35)",
      backlit: "rgba(255,210,160,0.3)",
    },
    birds: "rgba(40,35,30,0.4)",
    sceneBg: "#3A2818",
  },

  day: {
    period: "day",
    sky: {
      gradient: `
        radial-gradient(ellipse at 50% 10%, rgba(255,255,220,0.15) 0%, transparent 40%),
        linear-gradient(to bottom,
          #1E5090 0%,
          #2868A8 10%,
          #3880B8 22%,
          #5098C8 35%,
          #70B0D5 45%,
          #90C5E0 60%,
          #B0D5E8 72%,
          #C8E0EE 82%,
          #D8E8F2 90%,
          #E0E8E8 100%
        )
      `,
      sunGlow: "rgba(255,255,200,0.15)",
    },
    sun: {
      color: "#FFF8D0",
      glowColor: "rgba(255,255,220,0.2)",
      bottom: "70%",
      left: "45%",
    },
    stars: { opacity: 0 },
    mesa: { colors: ["#5A4030", "#4A3428", "#5E4432", "#624836"] },
    cactus: "#3E3020",
    ground: {
      gradient: "linear-gradient(to bottom, #D8C878 0%, #D0C070 15%, #C8B868 35%, #C4B460 60%, #C0B060 85%, #BCAC68 100%)",
      borderTop: "#A89850",
    },
    road: {
      gradient: "linear-gradient(to bottom, #BCAC68 0%, #B4A460 20%, #AC9C58 40%, #A89850 60%, #A09048 80%, #988840 100%)",
      borderTop: "#A89850",
      ruts: "#A89855",
      rocks: ["#9B8A58", "#8A7948"],
      scrub: ["#7A9050", "#6A8040"],
      tumbleweed: ["#9B8350", "#8A7240"],
    },
    clouds: {
      warm: "rgba(255,255,255,0.4)",
      cool: "rgba(255,255,255,0.45)",
      backlit: "rgba(255,255,255,0.35)",
    },
    birds: "rgba(30,25,20,0.5)",
    sceneBg: "#2C2018",
  },

  sunset: {
    period: "sunset",
    sky: {
      gradient: `
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
      sunGlow: "rgba(255,210,100,0.25)",
    },
    sun: {
      color: "#FFD870",
      glowColor: "rgba(255,210,100,0.25)",
      bottom: "5%",
      left: "72%",
    },
    stars: { opacity: 1 },
    mesa: { colors: ["#2A1A0E", "#221408", "#2E1C0F", "#331E10"] },
    cactus: "#1E1208",
    ground: {
      gradient: "linear-gradient(to bottom, #D48540 0%, #C88E50 15%, #BE9458 35%, #B89B5E 60%, #C4A265 85%, #C4A86A 100%)",
      borderTop: "#8B7340",
    },
    road: {
      gradient: "linear-gradient(to bottom, #C4A86A 0%, #BAA062 20%, #B09858 40%, #A89050 60%, #A08848 80%, #988040 100%)",
      borderTop: "#8B7340",
      ruts: "#9E8855",
      rocks: ["#8B7A50", "#7A6940"],
      scrub: ["#6A7A4A", "#5A6A3A"],
      tumbleweed: ["#8B7345", "#7A6235"],
    },
    clouds: {
      warm: "rgba(255,210,170,0.3)",
      cool: "rgba(180,210,240,0.3)",
      backlit: "rgba(255,185,120,0.25)",
    },
    birds: "rgba(20,15,10,0.5)",
    sceneBg: "#2C1810",
  },

  night: {
    period: "night",
    sky: {
      gradient: `
        radial-gradient(ellipse at 30% 25%, rgba(140,160,200,0.08) 0%, transparent 40%),
        linear-gradient(to bottom,
          #06080E 0%,
          #0A1020 10%,
          #0E1830 22%,
          #142040 35%,
          #1A2850 45%,
          #1E3058 60%,
          #223560 72%,
          #283A65 82%,
          #2E4068 90%,
          #1A2840 100%
        )
      `,
      sunGlow: "rgba(140,160,200,0.06)",
    },
    sun: {
      color: "#D0D8E8",
      glowColor: "rgba(180,200,230,0.15)",
      bottom: "55%",
      left: "25%",
    },
    stars: { opacity: 1 },
    mesa: { colors: ["#0E0A06", "#0C0804", "#100C08", "#120E0A"] },
    cactus: "#0A0804",
    ground: {
      gradient: "linear-gradient(to bottom, #1A2840 0%, #28303A 15%, #2A2E35 35%, #262A30 60%, #222830 85%, #1E2428 100%)",
      borderTop: "#384050",
    },
    road: {
      gradient: "linear-gradient(to bottom, #1E2428 0%, #1C2226 20%, #1A2024 40%, #181E22 60%, #161C20 80%, #141A1E 100%)",
      borderTop: "#384050",
      ruts: "#283038",
      rocks: ["#2A3038", "#222830"],
      scrub: ["#1A2818", "#142014"],
      tumbleweed: ["#2A2820", "#222018"],
    },
    clouds: {
      warm: "rgba(80,90,110,0.2)",
      cool: "rgba(80,100,130,0.2)",
      backlit: "rgba(70,80,100,0.15)",
    },
    birds: "rgba(10,10,10,0.3)",
    sceneBg: "#06080E",
  },
};

export function useTimeOfDay(): TimeTheme {
  const [theme, setTheme] = useState<TimeTheme>(() => {
    const hour = new Date().getHours();
    return themes[getTimeOfDay(hour)];
  });

  useEffect(() => {
    const check = () => {
      const hour = new Date().getHours();
      const period = getTimeOfDay(hour);
      setTheme((prev) => (prev.period === period ? prev : themes[period]));
    };

    // Check every minute
    const interval = setInterval(check, 60_000);
    return () => clearInterval(interval);
  }, []);

  return theme;
}
