import { createServer } from "http";
import { PORT } from "./config";
import app from "./app";
import { setupWebSocket } from "./ws";

const server = createServer(app);
setupWebSocket(server);

server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
