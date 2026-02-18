# Building Trash/Archive System

Demolished buildings move to a trash store instead of being permanently deleted. They remain recoverable for 48 hours, after which they are auto-purged.

## Storage

- `data/trash/manifest.json` — array of `{ buildingId, trashedAt, building, agents[] }`
- `data/trash/agents/` — agent JSON files and `.conversation.jsonl` logs, copied before removal from active storage
- On trash: copy agent files to trash dir, remove from active storage
- On restore: move agent files back, re-insert building and agents into active maps

## Auto-purge

- On server startup: purge entries where `Date.now() - trashedAt > 48h`
- `setInterval` every hour: same purge check
- Purge deletes the manifest entry and associated agent files from `data/trash/agents/`

## API

| Method | Route | Description |
|--------|-------|-------------|
| DELETE | `/buildings/:id` | Move building to trash (was: hard delete) |
| GET | `/trash` | List trashed buildings with time remaining |
| POST | `/trash/:id/restore` | Restore building + agents to active |
| DELETE | `/trash/:id` | Permanently delete from trash |

## WebSocket Events

- `building:removed` — unchanged, fired on demolish
- `building:restored` — new event, fired on restore, carries full `Building` object

## Types

```ts
interface TrashedBuilding {
  buildingId: string;
  trashedAt: string; // ISO 8601
  building: Building;
  agents: Agent[];
}
```

Add to `WSEvent` union:
```ts
| { type: "building:restored"; building: Building }
```

## Frontend

- Main screen shows a "TRASH (n)" indicator when n > 0
- Trash panel lists trashed buildings with name, style, time remaining, and RESTORE button
- Restoring a building adds it back to the town in real-time via WebSocket
