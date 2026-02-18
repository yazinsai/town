import { useState, useEffect, useCallback } from "react";
import type { Agent, ConversationEntry, WSEvent } from "@shared/types";
import { getAgent, getConversation } from "../lib/api";

export function useAgent(agentId: string | null, lastEvent: WSEvent | null) {
  const [agent, setAgent] = useState<Agent | null>(null);
  const [conversation, setConversation] = useState<ConversationEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    if (!agentId) return;
    setLoading(true);
    try {
      const [agentData, convData] = await Promise.all([
        getAgent(agentId),
        getConversation(agentId),
      ]);
      setAgent(agentData);
      setConversation(convData);
    } catch (err) {
      console.error("Failed to fetch agent:", err);
    } finally {
      setLoading(false);
    }
  }, [agentId]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  useEffect(() => {
    if (!lastEvent || !agentId) return;

    if ("agentId" in lastEvent && lastEvent.agentId === agentId) {
      if (lastEvent.type === "agent:message") {
        setConversation((prev) => {
          // Deduplicate — resumed sessions can replay messages already in the list
          const e = lastEvent.entry;
          const isDupe = prev.some(
            (p) => p.timestamp === e.timestamp && p.role === e.role && p.content === e.content
          );
          if (isDupe) return prev;
          return [...prev, e];
        });
      } else if (lastEvent.type === "agent:state") {
        setAgent((prev) =>
          prev
            ? {
                ...prev,
                state: lastEvent.state,
                currentTask: lastEvent.currentTask ?? prev.currentTask,
              }
            : prev
        );
      } else if (lastEvent.type === "agent:question") {
        setAgent((prev) =>
          prev
            ? { ...prev, state: "waiting_input", pendingQuestion: lastEvent.question }
            : prev
        );
      } else if (lastEvent.type === "agent:permission") {
        setAgent((prev) =>
          prev
            ? { ...prev, state: "waiting_permission", pendingPermission: lastEvent.permission }
            : prev
        );
      } else if (lastEvent.type === "agent:completed") {
        setAgent((prev) =>
          prev ? { ...prev, state: "completed" } : prev
        );
      } else if (lastEvent.type === "agent:error") {
        setAgent((prev) =>
          prev ? { ...prev, state: "error", error: lastEvent.error } : prev
        );
      }
    }
  }, [lastEvent, agentId]);

  return { agent, conversation, loading, refetch: fetch };
}
