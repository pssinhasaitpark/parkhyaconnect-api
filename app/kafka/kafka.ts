import { Kafka, Partitioners } from "kafkajs";
import { Server } from "socket.io";

// const kafka = new Kafka({
//   clientId: 'parkhyaconnect',
//   brokers: ['localhost:9092'], // Update with your broker addresses
// });

const kafka = new Kafka({
  clientId: "parkhyaconnect",
  brokers: (process.env.KAFKA_BROKERS || "localhost:9092").split(","),
});

export const producer = kafka.producer({
  createPartitioner: Partitioners.LegacyPartitioner,
});

export const consumer = kafka.consumer({ groupId: "chat-group" });

// export const initKafka = async (io: Server) => { // Accept io as a parameter
//   await producer.connect();
//   await consumer.connect();

//   // Subscribe to a topic
//   await consumer.subscribe({ topic: 'messages', fromBeginning: true });

//   consumer.run({
//     eachMessage: async ({ topic, partition, message }) => {
//       const msg = JSON.parse(message.value?.toString() || '{}');
//       console.log(`Received message: ${msg.content} from User ${msg.senderId}`);

//       // Emit the received message to all connected clients
//       io.emit('receiveMessage', msg); // Now io is accessible here
//     },
//   });
// };

// In kafka.ts

export const initKafka = async (io: Server) => {
  try {
    await producer.connect();
    await consumer.connect();

    await consumer.subscribe({ topic: "messages", fromBeginning: true });

    consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        const msg = JSON.parse(message.value?.toString() || "{}");
        console.log(
          `Received message: ${msg.content} from User ${msg.senderId}`
        );
        io.emit("receiveMessage", msg);
      },
    });

    console.log("Kafka connection established successfully");
  } catch (error) {
    console.error("Failed to connect to Kafka:", error.message);
  }
};
