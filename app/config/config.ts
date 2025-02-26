import { config } from 'dotenv';

config(); // Load environment variables from .env file

const DATABASE_URL = process.env.DATABASE_URL || '';

export default {
  database: {
    url: DATABASE_URL,
  },
};
