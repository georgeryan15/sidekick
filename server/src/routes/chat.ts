import { Router, Request, Response } from "express";
import { run, user, assistant } from "@openai/agents";
import { agent } from "../agent";

const router = Router();

router.post("/", async (req: Request, res: Response) => {
  const { messages } = req.body;

  const input = messages.map((msg: { role: string; content: string }) =>
    msg.role === "user" ? user(msg.content) : assistant(msg.content)
  );

  try {
    const result = await run(agent, input, { stream: true });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    const textStream = result.toTextStream({
      compatibleWithNodeStreams: true,
    });

    textStream.on("data", (chunk: Buffer) => {
      res.write(`data: ${JSON.stringify({ content: chunk.toString() })}\n\n`);
    });

    textStream.on("end", () => {
      res.write("data: [DONE]\n\n");
      res.end();
    });

    textStream.on("error", (err: Error) => {
      console.error("Stream error:", err);
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Agent error:", message);
    res.status(500).json({ error: message });
  }
});

export default router;
