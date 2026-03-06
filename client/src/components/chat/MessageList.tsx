import { useRef, useEffect } from "react";
import Markdown from "react-markdown";
import { ScrollShadow } from "@heroui/react";
import ThinkingIndicator from "./ThinkingIndicator";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface MessageListProps {
  messages: Message[];
  isLoading: boolean;
  statusLines: string[];
  hasStreamContent: boolean;
}

export default function MessageList({
  messages,
  isLoading,
  statusLines,
  hasStreamContent,
}: MessageListProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  return (
    <ScrollShadow className="h-full" hideScrollBar>
      <div className="flex flex-col gap-3">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 ${
              msg.role === "user" ? "flex-row-reverse" : "flex-row"
            }`}
          >
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

        {isLoading && !hasStreamContent && (
          <ThinkingIndicator statusLines={statusLines} />
        )}

        <div ref={bottomRef} />
      </div>
    </ScrollShadow>
  );
}
