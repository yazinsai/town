import type { InputHTMLAttributes } from "react";

interface PixelInputProps extends InputHTMLAttributes<HTMLInputElement> {}

export default function PixelInput({ style, ...props }: PixelInputProps) {
  return (
    <input
      style={{
        fontFamily: "'Press Start 2P', monospace",
        fontSize: "8px",
        padding: "8px 10px",
        background: "#F4E4C1",
        color: "#2C1810",
        border: "2px solid #8B4513",
        borderRadius: 0,
        outline: "none",
        width: "100%",
        boxSizing: "border-box",
        ...style,
      }}
      {...props}
    />
  );
}
