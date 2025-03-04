import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import {
  userRoutes,
  authRoutes,
  messageRoutes,
  channelRoutes,
  testRoute,
} from "./app/routes";
import { initKafka, producer } from "./app/kafka/kafka";
import * as userService from "./app/services/user.service";

dotenv.config();

const app = express();
const server = http.createServer(app);

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
    credentials: true,
  },
});

export { io };

const KAFKA_ENABLED = process.env.KAFKA_ENABLED === "true";

app.use(express.json());
app.use(morgan("dev"));

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/channels", channelRoutes);
app.use("/api", testRoute);

app.get("/", (req: Request, res: Response) => {
  res.status(200).send({
    message: "Welcome to Parkhya Connect!",
    error: false,
    status: 200,
  });
});

if (KAFKA_ENABLED) {
  initKafka(io).catch((err) => {
    console.error(
      "Kafka initialization failed, continuing without Kafka:",
      err.message
    );
  });
}

io.on("connection", (socket) => {
  console.log("A user connected");

  const userId = socket.handshake.query.userId as string;

  if (userId) {
    userService.updateUserStatus(userId, true);
    io.emit("userStatusChange", { userId, isOnline: true });
  }

  socket.on("sendMessage", async (data) => {
    console.log("Received message:", data);

    const { content, senderId } = { content: data, senderId: socket.id };

    if (KAFKA_ENABLED) {
      try {
        await producer.send({
          topic: "messages",
          messages: [{ value: JSON.stringify({ content, senderId }) }],
        });
      } catch (error: unknown) {
        console.error(
          "Failed to send message to Kafka:",
          (error as Error).message
        );
      }
    }

    io.emit("receiveMessage", { content, senderId });
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");

    if (userId) {
      userService.updateUserStatus(userId, false);
      io.emit("userStatusChange", { userId, isOnline: false });
    }
  });
});

app.use((err: unknown, req: Request, res: Response, next: NextFunction) => {
  console.error(err);
  res.status(500).send({ message: "Something went wrong!", error: true });
});

export { app, server };
