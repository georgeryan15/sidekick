import { useState, useEffect, useRef, useCallback } from "react";
import { Button, Input, ScrollShadow } from "@heroui/react";
import {
  ArrowUp,
  BookOpen,
  ChevronsExpandUpRight,
  ChevronsCollapseUpRight,
} from "@gravity-ui/icons";
import Markdown from "react-markdown";
import WidgetChip from "../components/overlay/WidgetChip";
import ThinkingIndicator from "../components/ThinkingIndicator";
import { useAuth } from "../context/AuthContext";

const COLLAPSED_HEIGHT = 52;
const MAX_EXPANDED_HEIGHT = 400;

export default function OverlayChatbar() {
  const { user } = useAuth();

  const [expanded, setExpanded] = useState(false);
  const [input, setInput] = useState("");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusLines, setStatusLines] = useState<string[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const conversationIdRef = useRef<string | null>(null);
  const answerRef = useRef("");

  // Resize overlay based on content
  const resizeToContent = useCallback(() => {
    requestAnimationFrame(() => {
      const el = containerRef.current;
      if (!el) return;
      const height = Math.min(el.scrollHeight, MAX_EXPANDED_HEIGHT);
      window.electronAPI?.resizeOverlay(height);
    });
  }, []);

  // Resize when expanded state changes
  useEffect(() => {
    if (!expanded) {
      window.electronAPI?.resizeOverlay(COLLAPSED_HEIGHT);
    } else {
      resizeToContent();
    }
  }, [expanded, resizeToContent]);

  // Resize as answer streams in
  useEffect(() => {
    if (expanded) {
      resizeToContent();
    }
  }, [answer, statusLines, expanded, resizeToContent]);

  // Clean up WebSocket on unmount
  useEffect(() => {
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  const handleSubmit = () => {
    const text = input.trim();
    if (!text || isLoading) return;

    setQuestion(text);
    setInput("");
    setAnswer("");
    setIsLoading(true);
    setStatusLines([]);
    setExpanded(true);
    answerRef.current = "";
    conversationIdRef.current = null;

    // Close any existing socket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    const ws = new WebSocket("ws://localhost:3001");
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send(
        JSON.stringify({
          type: "chat",
          messages: [{ role: "user", content: text }],
          userId: user?.id,
          conversationId: null,
        })
      );
    };

    ws.onmessage = async (event) => {
      let msg: any;
      try {
        msg = JSON.parse(event.data);
      } catch {
        return;
      }

      if (msg.type === "text") {
        answerRef.current += msg.content;
        setAnswer(answerRef.current);
      } else if (msg.type === "status") {
        setStatusLines((prev) => [...prev, msg.content].slice(-3));
      } else if (msg.type === "conversation_created") {
        conversationIdRef.current = msg.id;
      } else if (msg.type === "done") {
        setIsLoading(false);
        setStatusLines([]);
      } else if (msg.type === "error") {
        setAnswer(msg.content || "Something went wrong.");
        setIsLoading(false);
        setStatusLines([]);
      } else if (msg.type === "tool_call") {
        let result: string;
        try {
          if (window.electronAPI) {
            result = await window.electronAPI.execCommand(msg.command);
          } else {
            result =
              "Error: Not running in Electron — cannot execute commands.";
          }
        } catch (err) {
          result = `Error: ${err instanceof Error ? err.message : String(err)}`;
        }
        ws.send(JSON.stringify({ type: "tool_result", id: msg.id, result }));
      }
    };

    ws.onerror = () => {
      setAnswer("Failed to connect to the server.");
      setIsLoading(false);
    };

    ws.onclose = () => {
      if (wsRef.current === ws) wsRef.current = null;
    };
  };

  const handleCollapse = () => {
    // Close socket and reset state for a new question
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setExpanded(false);
    setQuestion("");
    setAnswer("");
    setIsLoading(false);
    setStatusLines([]);
    answerRef.current = "";
    conversationIdRef.current = null;
  };

  const handleExpandToApp = () => {
    window.electronAPI?.toggleOverlay();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (expanded) {
    return (
      <div
        ref={containerRef}
        className="flex flex-col max-h-[400px] bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg border border-neutral-200/60 p-4 gap-3"
        style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
      >
        {/* Header with question */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-medium text-neutral-800 pt-0.5">
            {question}
          </p>
          <div className="flex gap-1 shrink-0">
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              aria-label="Collapse"
              onPress={handleCollapse}
            >
              <ChevronsCollapseUpRight className="size-4" />
            </Button>
            <Button
              isIconOnly
              size="sm"
              variant="ghost"
              aria-label="Open in app"
              onPress={handleExpandToApp}
            >
              <ChevronsExpandUpRight className="size-4" />
            </Button>
          </div>
        </div>

        {/* Answer */}
        <ScrollShadow className="flex-1 min-h-0 max-h-[220px]" hideScrollBar>
          {isLoading && !answer ? (
            <ThinkingIndicator statusLines={statusLines} />
          ) : (
            <div className="text-sm text-neutral-600 leading-relaxed markdown-body">
              <Markdown>{answer}</Markdown>
            </div>
          )}
        </ScrollShadow>

        {/* Widget chip */}
        <ScrollShadow
          orientation="horizontal"
          hideScrollBar
          className="shrink-0"
        >
          <div className="flex gap-2">
            <WidgetChip
              icon={<BookOpen className="size-3.5" />}
              title="Open in app"
              description="View full conversation"
              onPress={handleExpandToApp}
            />
          </div>
        </ScrollShadow>
      </div>
    );
  }

  // Collapsed state
  return (
    <div
      ref={containerRef}
      className="flex items-center h-full bg-white/95 backdrop-blur-xl rounded-full shadow-lg border border-neutral-200/60 px-3 gap-2"
      style={{ WebkitAppRegion: "no-drag" } as React.CSSProperties}
    >
      <Input
        aria-label="Ask anything"
        placeholder="Ask anything..."
        className="flex-1 rounded-full text-sm"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        variant="secondary"
      />
      <Button
        isIconOnly
        size="sm"
        aria-label="Send"
        isDisabled={!input.trim()}
        onPress={handleSubmit}
      >
        <ArrowUp className="size-4" />
      </Button>
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        aria-label="Open in app"
        onPress={handleExpandToApp}
      >
        <ChevronsExpandUpRight className="size-4" />
      </Button>
    </div>
  );
}
