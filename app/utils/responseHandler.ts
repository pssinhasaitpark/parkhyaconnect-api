import { Response } from "express";

export const responseHandler = (res: Response, status: number, message: string, data: any = null) => {
  res.status(status).json({ message, data });
};
