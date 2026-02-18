import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { run, user, assistant } from "@openai/agents";
import { agent } from "./agent";
import crypto from "crypto";

let clientSocket: WebSocket | null = null;

const pendingExecs = new Map<
  string,
  { resolve: (result: string) => void; timer: ReturnType<typeof setTimeout> }
>();

export function setupWebSocket(server: Server) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", (ws) => {
    console.log("Client connected");
    clientSocket = ws;

    ws.on("message", async (raw) => {
      let msg: any;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      if (msg.type === "tool_result") {
        const pending = pendingExecs.get(msg.id);
        if (pending) {
          clearTimeout(pending.timer);
          pendingExecs.delete(msg.id);
          pending.resolve(msg.result);
        }
        return;
      }

      if (msg.type === "chat") {
        await handleChat(ws, msg.messages);
        return;
      }
    });

    ws.on("close", () => {
      console.log("Client disconnected");
      if (clientSocket === ws) clientSocket = null;
    });
  });
}

const MAX_STATUS_LENGTH = 80;

function truncate(str: string, max = MAX_STATUS_LENGTH): string {
  const oneLine = str.replace(/\n/g, " ").trim();
  return oneLine.length <= max ? oneLine : oneLine.slice(0, max - 1) + "…";
}

function summarizeToolArgs(argsJson?: string): string | null {
  if (!argsJson) return null;
  try {
    const args = JSON.parse(argsJson);
    const values = Object.values(args).filter(
      (v) => typeof v === "string" || typeof v === "number"
    );
    if (values.length === 0) return null;
    return truncate(values.join(", "));
  } catch {
    return null;
  }
}

async function handleChat(
  ws: WebSocket,
  messages: { role: string; content: string }[]
) {
  const input = messages.map((msg) =>
    msg.role === "user" ? user(msg.content) : assistant(msg.content)
  );

  try {
    const result = await run(agent, input, { stream: true });

    for await (const event of result) {
      if (ws.readyState !== WebSocket.OPEN) break;

      if (event.type === "raw_model_stream_event") {
        if (event.data.type === "output_text_delta") {
          ws.send(JSON.stringify({ type: "text", content: event.data.delta }));
        }
      } else if (event.type === "run_item_stream_event") {
        if (event.name === "tool_called") {
          const rawItem = event.item.rawItem as {
            name?: string;
            arguments?: string;
          };
          const name = rawItem.name ?? "unknown";
          const detail = summarizeToolArgs(rawItem.arguments);
          const content = detail
            ? `Calling tool: ${name} — ${detail}`
            : `Calling tool: ${name}`;
          ws.send(JSON.stringify({ type: "status", content }));
        } else if (event.name === "handoff_requested") {
          const rawItem = event.item.rawItem as { name?: string };
          const name = rawItem.name ?? "unknown";
          ws.send(
            JSON.stringify({
              type: "status",
              content: `Handing off to ${name}`,
            })
          );
        } else if (event.name === "reasoning_item_created") {
          const rawItem = event.item.rawItem as {
            content?: Array<{ text?: string }>;
          };
          const text = rawItem.content?.[0]?.text;
          const summary = text ? truncate(text, 80) : "Thinking...";
          ws.send(
            JSON.stringify({ type: "status", content: summary })
          );
        }
      } else if (event.type === "agent_updated_stream_event") {
        ws.send(
          JSON.stringify({
            type: "status",
            content: `Now running: ${event.agent.name}`,
          })
        );
      }
    }

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "done" }));
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Agent error:", message);
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: "error", content: message }));
    }
  }
}

export function requestClientExec(command: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!clientSocket || clientSocket.readyState !== WebSocket.OPEN) {
      resolve("Error: No client connected to execute commands.");
      return;
    }

    const id = crypto.randomUUID();

    const timer = setTimeout(() => {
      pendingExecs.delete(id);
      resolve("Error: Command execution timed out (30s).");
    }, 30_000);

    pendingExecs.set(id, { resolve, timer });

    clientSocket.send(
      JSON.stringify({ type: "tool_call", id, command })
    );
  });
}
