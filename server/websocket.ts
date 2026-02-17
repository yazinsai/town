import type { ServerWebSocket } from "bun";
import type { WSEvent } from "../shared/types";

const clients = new Set<ServerWebSocket<unknown>>();

export function addClient(ws: ServerWebSocket<unknown>) {
  clients.add(ws);
  console.log(`WS client connected (${clients.size} total)`);
}

export function removeClient(ws: ServerWebSocket<unknown>) {
  clients.delete(ws);
  console.log(`WS client disconnected (${clients.size} total)`);
}

export function broadcast(event: WSEvent) {
  const data = JSON.stringify(event);
  for (const ws of clients) {
    try {
      ws.send(data);
    } catch {
      clients.delete(ws);
    }
  }
}

export function getClientCount(): number {
  return clients.size;
}
