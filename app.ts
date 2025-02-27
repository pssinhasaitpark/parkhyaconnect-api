// import express, { Request, Response, NextFunction } from "express";
// import cors from "cors";
// import morgan from "morgan";
// import dotenv from "dotenv";
// import http from "http"; // Import http module
// import { Server } from "socket.io"; // Import Socket.io
// import userRoutes from "./app/routes/user";
// import { initKafka, producer } from "./app/kafka/kafka"; // Ensure you have Kafka setup

// dotenv.config();

// const app = express();
// const server = http.createServer(app); // Create an HTTP server
// const io = new Server(server); // Create a Socket.io server

// app.use(cors());
// app.use(express.json());
// app.use(morgan('dev'));

// app.use("/api/users", userRoutes);

// app.get("/", (req: Request, res: Response) => {
//   res.status(200).send({
//     message: "Welcome to Parkhya Connect!",
//     error: false,
//     status: 200,
//   });
// });

// // Real-time chat setup with Socket.io
// io.on('connection', (socket) => {
//   console.log('A user connected');

//   // Listen for incoming messages
//   socket.on('sendMessage', async (data) => {
//     const { content, senderId } = data;

//     // Send message to Kafka
//     await producer.send({
//       topic: 'messages',
//       messages: [{ value: JSON.stringify({ content, senderId }) }],
//     });

//     // Emit the message to all connected clients
//     io.emit('receiveMessage', { content, senderId });
//   });

//   socket.on('disconnect', () => {
//     console.log('A user disconnected');
//   });
// });

// // Error handling middleware
// app.use((err: any, req: Request, res: Response, next: NextFunction) => {
//   console.error(err.stack);
//   res.status(500).send({ message: "Something went wrong!", error: true });
// });

// // Initialize Kafka
// initKafka(io).catch(console.error); // Pass `io` to initKafka

// export { app, server }; // Use named exports for both

import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import userRoutes from "./app/routes/user";
import authRoutes from "./app/routes/auth";
import { initKafka, producer } from "./app/kafka/kafka";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const KAFKA_ENABLED = process.env.KAFKA_ENABLED === "true";

app.use(cors());
app.use(express.json());
app.use(morgan("dev"));

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);

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

  socket.on("sendMessage", async (data) => {
    const { content, senderId } = data;

    if (KAFKA_ENABLED) {
      try {
        await producer.send({
          topic: "messages",
          messages: [{ value: JSON.stringify({ content, senderId }) }],
        });
      } catch (error) {
        console.error("Failed to send message to Kafka:", error.message);
      }
    }

    io.emit("receiveMessage", { content, senderId });
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).send({ message: "Something went wrong!", error: true });
});

export { app, server };
