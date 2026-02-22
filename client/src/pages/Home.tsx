import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Markdown from "react-markdown";
import {
  Button,
  InputGroup,
  Kbd,
  ScrollShadow,
  Avatar,
  Spinner,
  TextField,
  Tooltip,
  Select,
  ListBox,
  Label,
} from "@heroui/react";
import ThinkingIndicator from "../components/ThinkingIndicator";
import { useAuth } from "../context/AuthContext";
import { useConversationContext } from "../context/ConversationContext";
import { supabase } from "../lib/supabase";
import {
  ArrowUp,
  At,
  Microphone,
  PlugConnection,
  Plus,
} from "@gravity-ui/icons";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export default function Home() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refresh: refreshConversations } = useConversationContext();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusLines, setStatusLines] = useState<string[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const assistantContentRef = useRef("");
  const assistantIdRef = useRef("");
  const currentConvIdRef = useRef<string | null>(conversationId ?? null);

  // Keep ref in sync with URL param
  useEffect(() => {
    currentConvIdRef.current = conversationId ?? null;
  }, [conversationId]);

  // Load history when conversationId changes
  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
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
          navigate(`/c/${msg.id}`, { replace: true });
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
  }, [navigate, refreshConversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
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
    <div className="flex flex-col h-full p-2">
      <div className="flex-1 overflow-hidden">
        <ScrollShadow className="h-full" hideScrollBar>
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full text-muted">
              <p>Send a message to get started.</p>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {msg.role === "user" && (
                  <Avatar size="sm" color="accent">
                    <Avatar.Fallback>U</Avatar.Fallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[80%] text-sm ${
                    msg.role === "user"
                      ? "rounded-2xl bg-accent text-accent-foreground px-3 py-2"
                      : ""
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="markdown-body">
                      <Markdown>{msg.content}</Markdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}

            {isLoading && !assistantContentRef.current && (
              <ThinkingIndicator statusLines={statusLines} />
            )}

            <div ref={bottomRef} />
          </div>
        </ScrollShadow>
      </div>

      <TextField
        fullWidth
        aria-label="Prompt input"
        className="flex w-full flex-col"
        name="prompt"
      >
        <InputGroup fullWidth className="flex flex-col gap-2 rounded-2xl py-2">
          <InputGroup.Prefix className="px-3 py-0">
            <Button aria-label="Add context" size="sm" variant="outline">
              <At />
              Add Context
            </Button>
          </InputGroup.Prefix>
          <InputGroup.TextArea
            className="w-full resize-none px-3.5 py-0"
            placeholder="Type a message..."
            rows={3}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <InputGroup.Suffix className="flex w-full items-center gap-1.5 px-3 py-0">
            <Tooltip delay={0}>
              <Button
                isIconOnly
                aria-label="Attach file"
                size="sm"
                variant="tertiary"
              >
                <Plus />
              </Button>
              <Tooltip.Content>
                <p className="text-xs">Add files and more</p>
              </Tooltip.Content>
            </Tooltip>
            <Select placeholder="GPT-5.2">
              <Select.Trigger>
                <Select.Value />
                <Select.Indicator />
              </Select.Trigger>
              <Select.Popover>
                <ListBox>
                  <ListBox.Item id="florida" textValue="Florida">
                    GPT-5.2
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  <ListBox.Item id="delaware" textValue="Delaware">
                    Opus 4.6
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  <ListBox.Item id="california" textValue="California">
                    Sonnet 4.6
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                  <ListBox.Item id="texas" textValue="Texas">
                    Gemini 3 Pro
                    <ListBox.ItemIndicator />
                  </ListBox.Item>
                </ListBox>
              </Select.Popover>
            </Select>
            <div className="ml-auto flex items-center gap-1.5">
              <Tooltip delay={0}>
                <Button
                  isIconOnly
                  aria-label="Voice input"
                  size="sm"
                  variant="ghost"
                >
                  <Microphone />
                </Button>
                <Tooltip.Content>
                  <p className="text-xs">Voice input</p>
                </Tooltip.Content>
              </Tooltip>
              <Tooltip delay={0}>
                <Button
                  isIconOnly
                  aria-label="Send prompt"
                  isDisabled={!input.trim() || isLoading}
                  isPending={isLoading}
                  onPress={handleSend}
                >
                  {({ isPending }) =>
                    isPending ? (
                      <Spinner color="current" size="sm" />
                    ) : (
                      <ArrowUp />
                    )
                  }
                </Button>
                <Tooltip.Content className="flex items-center gap-1">
                  <p className="text-xs">Send</p>
                  <Kbd className="h-4 rounded-sm px-1">
                    <Kbd.Abbr keyValue="enter" />
                  </Kbd>
                </Tooltip.Content>
              </Tooltip>
            </div>
          </InputGroup.Suffix>
        </InputGroup>
      </TextField>
    </div>
  );
}
