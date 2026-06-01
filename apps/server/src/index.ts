import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { buildApp } from "./app";
import { connectDatabase } from "./config/db";
import { env } from "./config/env";

async function bootstrap() {
  await connectDatabase();

  const app = buildApp();
  const server = createServer(app);
  const io = new SocketIOServer(server, {
    cors: {
      origin: env.CORS_ORIGIN,
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    socket.emit("ready", { connected: true });
  });

  server.listen(env.PORT, () => {
    console.log(`AquaFlow API listening on port ${env.PORT}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
