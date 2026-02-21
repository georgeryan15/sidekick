import { Router, Request, Response } from "express";
import { deleteConversation } from "../lib/conversations";

const router = Router();

router.delete("/:id", async (req: Request, res: Response) => {
  try {
    await deleteConversation(req.params.id);
    res.status(204).end();
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Delete conversation error:", message);
    res.status(500).json({ error: message });
  }
});

export default router;
