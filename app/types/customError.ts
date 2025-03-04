export interface CustomError extends Error {
    code?: string;
    status?: number; 
    meta?: any;
  }