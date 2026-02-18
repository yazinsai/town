import type { ImageAttachment } from "@shared/types";

interface ImageThumbnailsProps {
  images: ImageAttachment[];
  onRemove: (index: number) => void;
}

export function ImageThumbnails({ images, onRemove }: ImageThumbnailsProps) {
  if (images.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        gap: "6px",
        padding: "6px 0",
        flexWrap: "wrap",
      }}
    >
      {images.map((img, i) => (
        <div
          key={i}
          style={{
            position: "relative",
            width: "40px",
            height: "40px",
            border: "2px solid #5C3317",
            flexShrink: 0,
          }}
        >
          <img
            src={`data:${img.mediaType};base64,${img.data}`}
            alt={img.name}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
              imageRendering: "auto",
            }}
          />
          <div
            onClick={() => onRemove(i)}
            style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              width: "12px",
              height: "12px",
              background: "#F44336",
              color: "#fff",
              fontFamily: "'Press Start 2P', monospace",
              fontSize: "5px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              lineHeight: 1,
            }}
          >
            x
          </div>
        </div>
      ))}
    </div>
  );
}

interface AttachButtonProps {
  onClick: () => void;
  hasImages?: boolean;
}

/** Small paperclip icon button */
export function AttachButton({ onClick, hasImages }: AttachButtonProps) {
  return (
    <div
      onClick={onClick}
      style={{
        cursor: "pointer",
        padding: "6px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        opacity: 0.7,
        position: "relative",
      }}
      title="Attach image"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 14 14"
        fill="none"
        style={{ display: "block", imageRendering: "pixelated" }}
      >
        <path
          d="M11 3v6a4 4 0 01-8 0V4a2.5 2.5 0 015 0v5.5a1 1 0 01-2 0V4h1.5v5.5a2.5 2.5 0 005 0V4A4 4 0 004.5 4v5a5.5 5.5 0 0011 0V3"
          stroke={hasImages ? "#E8C55A" : "#8B4513"}
          strokeWidth="1.5"
          strokeLinecap="square"
          transform="translate(1, 0)"
        />
      </svg>
      {hasImages && (
        <div
          style={{
            position: "absolute",
            top: "2px",
            right: "2px",
            width: "5px",
            height: "5px",
            background: "#E8C55A",
            borderRadius: "50%",
          }}
        />
      )}
    </div>
  );
}

interface HiddenFileInputProps {
  inputRef: React.RefObject<HTMLInputElement | null>;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function HiddenFileInput({ inputRef, onChange }: HiddenFileInputProps) {
  return (
    <input
      ref={inputRef}
      type="file"
      accept="image/png,image/jpeg,image/gif,image/webp"
      multiple
      onChange={onChange}
      style={{ display: "none" }}
    />
  );
}
