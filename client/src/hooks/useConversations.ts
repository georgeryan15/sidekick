import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export function useConversations(userId: string | undefined) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from("conversations")
      .select("id, title, created_at, updated_at")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch conversations:", error.message);
    } else {
      setConversations(data ?? []);
    }
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const deleteConversation = useCallback(async (id: string) => {
    // Optimistically remove from local state
    setConversations((prev) => prev.filter((c) => c.id !== id));

    try {
      const res = await fetch(`http://localhost:3001/conversations/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        console.error("Failed to delete conversation:", res.statusText);
        // Re-fetch to restore accurate state
        refresh();
      }
    } catch (err) {
      console.error("Failed to delete conversation:", err);
      refresh();
    }
  }, [refresh]);

  return { conversations, isLoading, refresh, deleteConversation };
}
