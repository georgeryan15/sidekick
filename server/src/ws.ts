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

async function handleChat(
  ws: WebSocket,
  messages: { role: string; content: string }[]
) {
  const input = messages.map((msg) =>
    msg.role === "user" ? user(msg.content) : assistant(msg.content)
  );

  try {
    const result = await run(agent, input, { stream: true });

    const textStream = result.toTextStream({
      compatibleWithNodeStreams: true,
    });

    textStream.on("data", (chunk: Buffer) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "text", content: chunk.toString() }));
      }
    });

    textStream.on("end", () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "done" }));
      }
    });

    textStream.on("error", (err: Error) => {
      console.error("Stream error:", err);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: "error", content: err.message }));
      }
    });
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
