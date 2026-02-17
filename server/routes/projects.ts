import { Hono } from "hono";
import { readdirSync, statSync } from "fs";
import { join, dirname, basename } from "path";
import { homedir } from "os";

const app = new Hono();

const PROJECTS_ROOT = join(homedir(), "ai", "projects");

function listDirs(dir: string): { name: string; path: string }[] {
  try {
    return readdirSync(dir)
      .filter((entry) => {
        if (entry.startsWith(".") || entry === "node_modules") return false;
        try {
          return statSync(join(dir, entry)).isDirectory();
        } catch {
          return false;
        }
      })
      .map((entry) => ({
        name: entry,
        path: join(dir, entry),
      }));
  } catch {
    return [];
  }
}

// List directories for autocomplete
// ?q=/Users/rock/ai/projects/sij → lists dirs matching "sij" prefix
// ?q=/Users/rock/ai/projects/sijilat/ → lists subdirs of sijilat
app.get("/", (c) => {
  const query = c.req.query("q") || "";

  if (!query) {
    return c.json(listDirs(PROJECTS_ROOT));
  }

  // If it's not an absolute path, treat as a search within PROJECTS_ROOT
  if (!query.startsWith("/")) {
    const search = query.toLowerCase();
    const dirs = listDirs(PROJECTS_ROOT).filter((d) =>
      d.name.toLowerCase().includes(search)
    );
    return c.json(dirs);
  }

  // If query ends with /, list contents of that directory
  if (query.endsWith("/")) {
    return c.json(listDirs(query));
  }

  // Otherwise, list the parent dir filtered by prefix
  const parent = dirname(query);
  const prefix = basename(query).toLowerCase();
  const dirs = listDirs(parent).filter((d) =>
    d.name.toLowerCase().includes(prefix)
  );
  return c.json(dirs);
});

export default app;
