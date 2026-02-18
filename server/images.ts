import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import type { ImageAttachment } from "../shared/types";

export function saveImages(images: ImageAttachment[], projectPath: string): string[] {
  const uploadDir = join(projectPath, ".claude-town-uploads");
  if (!existsSync(uploadDir)) {
    mkdirSync(uploadDir, { recursive: true });
  }

  return images.map((img) => {
    const ext = img.mediaType.split("/")[1]?.replace("jpeg", "jpg") || "png";
    const safeName = img.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const filename = `${randomUUID().slice(0, 8)}-${safeName}.${ext}`;
    const filepath = join(uploadDir, filename);
    writeFileSync(filepath, Buffer.from(img.data, "base64"));
    return filepath;
  });
}

export function buildPromptWithImages(prompt: string, imagePaths: string[]): string {
  if (imagePaths.length === 0) return prompt;

  const refs = imagePaths.map((p) => `- ${p}`).join("\n");
  return `${prompt}\n\nI've attached ${imagePaths.length} image${imagePaths.length > 1 ? "s" : ""} for reference. Use the Read tool to view them:\n${refs}`;
}
