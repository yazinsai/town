import type { ButtonHTMLAttributes } from "react";

interface PixelButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "danger" | "ghost";
}

const variantStyles: Record<string, React.CSSProperties> = {
  primary: {
    background: "#8B4513",
    color: "#F4E4C1",
    border: "2px solid #5C3317",
    borderBottom: "3px solid #3E2109",
    borderRight: "3px solid #3E2109",
  },
  danger: {
    background: "#8B2500",
    color: "#F4E4C1",
    border: "2px solid #5C1A00",
    borderBottom: "3px solid #3E1200",
    borderRight: "3px solid #3E1200",
  },
  ghost: {
    background: "transparent",
    color: "#D2B48C",
    border: "2px solid #8B4513",
  },
};

export default function PixelButton({
  variant = "primary",
  style,
  children,
  ...props
}: PixelButtonProps) {
  return (
    <button
      style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: "8px",
        padding: "8px 12px",
        cursor: "pointer",
        borderRadius: 0,
        ...variantStyles[variant],
        ...style,
      }}
      onMouseEnter={(e) => {
        if (variant === "primary") {
          e.currentTarget.style.background = "#A0522D";
        } else if (variant === "danger") {
          e.currentTarget.style.background = "#A03000";
        } else {
          e.currentTarget.style.background = "rgba(139,69,19,0.2)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background =
          variantStyles[variant].background as string;
      }}
      {...props}
    >
      {children}
    </button>
  );
}
