import express from "express";
import cors from "cors";
import conversationsRouter from "./routes/conversations";

const app = express();

app.use(cors());
app.use(express.json());
app.use("/conversations", conversationsRouter);

export default app;
