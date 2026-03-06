import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useConversationContext } from "../../context/ConversationContext";
import { supabase } from "../../lib/supabase";
import EmptyState from "./EmptyState";
import MessageList from "./MessageList";
import ChatInput from "./ChatInput";
import ChatTopBar from "./ChatTopBar";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatPaneProps {
  onSplitPane: () => void;
  onClosePane: () => void;
  paneCount: number;
  conversationId?: string;
  isUrlPane: boolean;
}

export default function ChatPane({
  onSplitPane,
  onClosePane,
  paneCount,
  conversationId,
  isUrlPane,
}: ChatPaneProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refresh: refreshConversations } = useConversationContext();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusLines, setStatusLines] = useState<string[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const assistantContentRef = useRef("");
  const assistantIdRef = useRef("");
  const currentConvIdRef = useRef<string | null>(conversationId ?? null);
  const skipNextHistoryLoad = useRef(false);

  // Keep ref in sync with prop
  useEffect(() => {
    currentConvIdRef.current = conversationId ?? null;
  }, [conversationId]);

  // Load history when conversationId changes
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    // Skip loading if we just created this conversation (messages already in state)
    if (skipNextHistoryLoad.current) {
      skipNextHistoryLoad.current = false;
      return;
    }

    let cancelled = false;

    async function loadHistory() {
      const { data, error } = await supabase
        .from("messages")
        .select("id, role, content")
        .eq("conversation_id", conversationId)
        .order("created_at", { ascending: true });

      if (cancelled) return;

      if (error) {
        console.error("Failed to load messages:", error.message);
        return;
      }

      setMessages(
        (data ?? []).map((m) => ({
          id: m.id,
          role: m.role as "user" | "assistant",
          content: m.content,
        }))
      );
    }

    loadHistory();
    return () => {
      cancelled = true;
    };
  }, [conversationId]);

  // Cleanup WS on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  const getOrCreateSocket = useCallback((): Promise<WebSocket> => {
    return new Promise((resolve, reject) => {
      const existing = wsRef.current;
      if (existing && existing.readyState === WebSocket.OPEN) {
        resolve(existing);
        return;
      }

      const ws = new WebSocket("ws://localhost:3001");
      wsRef.current = ws;

      ws.onopen = () => resolve(ws);
      ws.onerror = () => reject(new Error("WebSocket connection failed"));

      ws.onmessage = async (event) => {
        let msg: any;
        try {
          msg = JSON.parse(event.data);
        } catch {
          return;
        }

        if (msg.type === "text") {
          assistantContentRef.current += msg.content;
          const content = assistantContentRef.current;
          const id = assistantIdRef.current;
          setMessages((prev) =>
            prev.map((m) => (m.id === id ? { ...m, content } : m))
          );
        } else if (msg.type === "status") {
          setStatusLines((prev) => [...prev, msg.content].slice(-3));
        } else if (msg.type === "conversation_created") {
          currentConvIdRef.current = msg.id;
          if (isUrlPane) {
            skipNextHistoryLoad.current = true;
            navigate(`/c/${msg.id}`, { replace: true });
          }
        } else if (msg.type === "title_updated") {
          refreshConversations();
        } else if (msg.type === "done") {
          setIsLoading(false);
          setStatusLines([]);
          refreshConversations();
        } else if (msg.type === "error") {
          const id = assistantIdRef.current;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === id
                ? { ...m, content: msg.content || "Something went wrong." }
                : m
            )
          );
          setIsLoading(false);
          setStatusLines([]);
        } else if (msg.type === "local_exec") {
          let result: string;
          try {
            if (window.electronAPI) {
              result = await window.electronAPI.execCommand(msg.command);
            } else {
              result =
                "Error: Not running in Electron — cannot execute commands.";
            }
          } catch (err) {
            result = `Error: ${
              err instanceof Error ? err.message : String(err)
            }`;
          }
          ws.send(JSON.stringify({ type: "tool_result", id: msg.id, result }));
        }
      };

      ws.onclose = () => {
        if (wsRef.current === ws) wsRef.current = null;
      };
    });
  }, [navigate, refreshConversations, isUrlPane]);

  const handleSend = async (text?: string) => {
    const content = text ?? input.trim();
    if (!content || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    const assistantMessage: Message = {
      id: crypto.randomUUID(),
      role: "assistant",
      content: "",
    };
    assistantContentRef.current = "";
    assistantIdRef.current = assistantMessage.id;

    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const ws = await getOrCreateSocket();
      ws.send(
        JSON.stringify({
          type: "chat",
          messages: updatedMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          userId: user?.id,
          conversationId: currentConvIdRef.current,
        })
      );
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id
            ? { ...m, content: "Something went wrong. Please try again." }
            : m
        )
      );
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full flex-1 min-w-0 bg-surface rounded-2xl shadow-sm overflow-hidden">
      <ChatTopBar
        onSplitPane={onSplitPane}
        onClosePane={onClosePane}
        paneCount={paneCount}
      />
      <div className="flex flex-col flex-1 overflow-hidden p-4 items-center">
        <div className="flex-1 overflow-hidden w-full max-w-2xl mx-auto">
          {messages.length === 0 ? (
            <EmptyState onSuggestionClick={(text) => handleSend(text)} />
          ) : (
            <MessageList
              messages={messages}
              isLoading={isLoading}
              statusLines={statusLines}
              hasStreamContent={!!assistantContentRef.current}
            />
          )}
        </div>

        <ChatInput
          className="w-full max-w-2xl"
          input={input}
          setInput={setInput}
          isLoading={isLoading}
          onSend={() => handleSend()}
          onKeyDown={handleKeyDown}
        />
      </div>
    </div>
  );
}
