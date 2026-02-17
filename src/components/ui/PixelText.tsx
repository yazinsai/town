import type { HTMLAttributes } from "react";

interface PixelTextProps extends HTMLAttributes<HTMLElement> {
  variant?: "h1" | "h2" | "body" | "small";
  color?: string;
  as?: keyof HTMLElementTagNameMap;
}

const variantStyles: Record<string, React.CSSProperties> = {
  h1: { fontSize: "12px", lineHeight: "20px" },
  h2: { fontSize: "10px", lineHeight: "16px" },
  body: { fontSize: "8px", lineHeight: "14px" },
  small: { fontSize: "6px", lineHeight: "10px" },
};

export default function PixelText({
  variant = "body",
  color = "#F4E4C1",
  as,
  style,
  children,
  ...props
}: PixelTextProps) {
  const Tag = (as ||
    (variant === "h1" ? "h1" : variant === "h2" ? "h2" : "p")) as keyof JSX.IntrinsicElements;
  return (
    <Tag
      style={{
        fontFamily: "'Press Start 2P', monospace",
        color,
        margin: 0,
        ...variantStyles[variant],
        ...style,
      }}
      {...props}
    >
      {children}
    </Tag>
  );
}
