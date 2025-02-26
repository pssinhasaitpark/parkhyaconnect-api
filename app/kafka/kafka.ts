import { Kafka } from 'kafkajs';
import { Server } from 'socket.io';

const kafka = new Kafka({
  clientId: 'parkhyaconnect',
  brokers: ['localhost:9092'], // Update with your broker addresses
});

export const producer = kafka.producer();
export const consumer = kafka.consumer({ groupId: 'chat-group' });

export const initKafka = async (io: Server) => { // Accept io as a parameter
  await producer.connect();
  await consumer.connect();

  // Subscribe to a topic
  await consumer.subscribe({ topic: 'messages', fromBeginning: true });

  consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      const msg = JSON.parse(message.value?.toString() || '{}');
      console.log(`Received message: ${msg.content} from User ${msg.senderId}`);

      // Emit the received message to all connected clients
      io.emit('receiveMessage', msg); // Now io is accessible here
    },
  });
};
