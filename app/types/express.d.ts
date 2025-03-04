import { Request } from 'express';
import { File } from 'multer';

declare module 'express' {
  export interface Request {
    files?: File[];
    user?: {
      id: string;
      email: string;
    };
  }
}