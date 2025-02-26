import { PrismaClient } from '@prisma/client';
import config from './config'; // Adjust the path as necessary

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: config.database.url,
    },
  },
});

export default prisma;
