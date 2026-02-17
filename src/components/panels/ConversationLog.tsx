import { useRef, useEffect, useState } from "react";
import type { ConversationEntry } from "@shared/types";
import ReactMarkdown from "react-markdown";
import PixelText from "../ui/PixelText";

interface ConversationLogProps {
  entries: ConversationEntry[];
}

function formatTime(ts: string) {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

const roleColors: Record<string, string> = {
  assistant: "#8EAAB8",
  user: "#E8C55A",
  tool_call: "#A0826A",
  tool_result: "#A0826A",
  system: "#9E9E9E",
};

function toolSummary(entry: ConversationEntry): string {
  const input = entry.metadata?.input as Record<string, unknown> | undefined;
  if (!input) return "";
  const toolName = entry.metadata?.toolName as string;
  switch (toolName) {
    case "Read":
      return String(input.file_path || "").replace(/^.*\//, "");
    case "Write":
      return String(input.file_path || "").replace(/^.*\//, "");
    case "Edit":
      return String(input.file_path || "").replace(/^.*\//, "");
    case "Bash": {
      const cmd = String(input.command || "");
      return cmd.length > 50 ? cmd.slice(0, 50) + "..." : cmd;
    }
    case "Glob":
      return String(input.pattern || "");
    case "Grep":
      return `/${input.pattern || ""}/${input.glob ? " " + input.glob : ""}`;
    case "Task":
      return String(input.description || input.prompt || "").slice(0, 50);
    case "TodoWrite":
    case "TaskCreate":
      return String(input.subject || "");
    case "WebFetch":
      return String(input.url || "").replace(/^https?:\/\//, "").slice(0, 40);
    case "WebSearch":
      return String(input.query || "");
    default:
      return "";
  }
}

function formatInput(input: unknown): string {
  if (!input || typeof input !== "object") return String(input ?? "");
  const obj = input as Record<string, unknown>;
  return Object.entries(obj)
    .map(([k, v]) => {
      const val = typeof v === "string" ? v : JSON.stringify(v, null, 2);
      return `${k}: ${val}`;
    })
    .join("\n");
}

function Entry({ entry }: { entry: ConversationEntry }) {
  const [expanded, setExpanded] = useState(false);
  const isTool = entry.role === "tool_call" || entry.role === "tool_result";

  if (isTool) {
    const summary = toolSummary(entry);
    const input = entry.metadata?.input as Record<string, unknown> | undefined;
    return (
      <div style={{ marginBottom: "4px" }}>
        <div
          onClick={() => setExpanded(!expanded)}
          style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
        >
          <PixelText variant="small" color="#A0826A">
            {expanded ? "v" : ">"}
          </PixelText>
          <PixelText variant="small" color="#8B6914" style={{ flexShrink: 0 }}>
            {entry.content}
          </PixelText>
          {summary && (
            <PixelText
              variant="small"
              color="#7A6252"
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                minWidth: 0,
              }}
            >
              {summary}
            </PixelText>
          )}
        </div>
        {expanded && input && (
          <div
            style={{
              background: "#1A0F0A",
              border: "1px solid #3E2109",
              padding: "6px",
              marginTop: "2px",
              maxHeight: "200px",
              overflowY: "auto",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            <PixelText variant="small" color="#A0826A">
              {formatInput(input)}
            </PixelText>
          </div>
        )}
      </div>
    );
  }

  const isUser = entry.role === "user";

  return (
    <div
      style={{
        marginBottom: "6px",
        display: "flex",
        flexDirection: "column",
        alignItems: isUser ? "flex-end" : "flex-start",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          marginBottom: "2px",
          flexDirection: isUser ? "row-reverse" : "row",
        }}
      >
        <PixelText variant="small" color={roleColors[entry.role]}>
          {entry.role.toUpperCase()}
        </PixelText>
        <PixelText variant="small" color="#5C3317">
          {formatTime(entry.timestamp)}
        </PixelText>
      </div>
      <div
        className="pixel-markdown"
        style={{
          background: isUser ? "rgba(232,197,90,0.1)" : "rgba(142,170,184,0.1)",
          border: `1px solid ${isUser ? "#5C4A1A" : "#4A5A6A"}`,
          padding: "6px 8px",
          maxWidth: "85%",
          wordBreak: "break-word",
          fontFamily: "'Press Start 2P', monospace",
          fontSize: "6px",
          lineHeight: "10px",
          color: "#E8D5B7",
        }}
      >
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <p style={{ fontSize: "10px", lineHeight: "16px", margin: "4px 0 2px", color: "#F4D03F", fontFamily: "inherit" }}>{children}</p>
            ),
            h2: ({ children }) => (
              <p style={{ fontSize: "8px", lineHeight: "14px", margin: "4px 0 2px", color: "#F4D03F", fontFamily: "inherit" }}>{children}</p>
            ),
            h3: ({ children }) => (
              <p style={{ fontSize: "7px", lineHeight: "12px", margin: "3px 0 2px", color: "#E8C55A", fontFamily: "inherit" }}>{children}</p>
            ),
            h4: ({ children }) => (
              <p style={{ fontSize: "6px", lineHeight: "10px", margin: "3px 0 2px", color: "#E8C55A", fontFamily: "inherit" }}>{children}</p>
            ),
            p: ({ children }) => (
              <p style={{ margin: "2px 0", fontFamily: "inherit" }}>{children}</p>
            ),
            strong: ({ children }) => (
              <strong style={{ color: "#F4E4C1" }}>{children}</strong>
            ),
            em: ({ children }) => (
              <em style={{ color: "#C8B89A" }}>{children}</em>
            ),
            code: ({ children, className }) => {
              const isBlock = className?.includes("language-");
              if (isBlock) {
                return (
                  <code
                    style={{
                      display: "block",
                      background: "#1A0F0A",
                      border: "1px solid #3E2109",
                      padding: "4px",
                      margin: "3px 0",
                      whiteSpace: "pre-wrap",
                      color: "#A0826A",
                      fontFamily: "inherit",
                    }}
                  >
                    {children}
                  </code>
                );
              }
              return (
                <code
                  style={{
                    background: "#1A0F0A",
                    padding: "1px 3px",
                    color: "#A0826A",
                    fontFamily: "inherit",
                  }}
                >
                  {children}
                </code>
              );
            },
            pre: ({ children }) => (
              <pre style={{ margin: "3px 0", whiteSpace: "pre-wrap", fontFamily: "inherit" }}>{children}</pre>
            ),
            ul: ({ children }) => (
              <ul style={{ margin: "2px 0", paddingLeft: "12px", fontFamily: "inherit" }}>{children}</ul>
            ),
            ol: ({ children }) => (
              <ol style={{ margin: "2px 0", paddingLeft: "12px", fontFamily: "inherit" }}>{children}</ol>
            ),
            li: ({ children }) => (
              <li style={{ margin: "1px 0", fontFamily: "inherit" }}>{children}</li>
            ),
            blockquote: ({ children }) => (
              <blockquote
                style={{
                  borderLeft: "2px solid #5C3317",
                  margin: "3px 0",
                  paddingLeft: "6px",
                  color: "#C8B89A",
                  fontFamily: "inherit",
                }}
              >
                {children}
              </blockquote>
            ),
            hr: () => (
              <hr style={{ border: "none", borderTop: "1px solid #3E2109", margin: "4px 0" }} />
            ),
            a: ({ children, href }) => (
              <a href={href} style={{ color: "#8EAAB8", textDecoration: "underline" }} target="_blank" rel="noopener noreferrer">{children}</a>
            ),
          }}
        >
          {entry.content}
        </ReactMarkdown>
      </div>
    </div>
  );
}

export default function ConversationLog({ entries }: ConversationLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries.length]);

  if (entries.length === 0) {
    return (
      <div style={{ padding: "16px", textAlign: "center" }}>
        <PixelText variant="small" color="#5C3317">
          No conversation yet...
        </PixelText>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        padding: "8px",
        overflowY: "auto",
        maxHeight: "300px",
      }}
    >
      {entries.map((entry, i) => (
        <Entry key={i} entry={entry} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
}
