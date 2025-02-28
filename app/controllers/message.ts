import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const sendMessage = async (req: Request, res: Response) => {
  const { content, receiverId, type } = req.body;
  const senderId = req.user.id;

  try {
    if (type === "private") {
      const receiver = await prisma.user.findUnique({
        where: { id: receiverId },
      });

      if (!receiver) {
        return res.status(400).json({
          message: "Receiver not found",
          error: true,
          status: 400,
        });
      }
    }

    const message = await prisma.message.create({
      data: {
        content,
        senderId,
        receiverId: type === "private" ? receiverId : null,
        type: type || "private",
      },
    });

    res.status(201).json({
      message: "Message sent successfully",
      data: message,
      error: false,
      status: 201,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error sending message",
      error: true,
      status: 500,
    });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  const { receiverId } = req.params;
  const senderId = req.user.id;

  try {
    let messages;

    if (receiverId) {
      const receiver = await prisma.user.findUnique({
        where: { id: receiverId },
      });

      if (!receiver) {
        return res.status(400).json({
          message: "Receiver not found",
          error: true,
          status: 400,
        });
      }

      messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: senderId, receiverId: receiverId },
            { senderId: receiverId, receiverId: senderId },
          ],
          type: "private",
        },
        orderBy: {
          created_at: "asc",
        },
      });
    } else {
      messages = await prisma.message.findMany({
        where: {
          senderId: senderId,
          type: "public",
        },
        orderBy: {
          created_at: "asc",
        },
      });
    }

    res.status(200).json({
      message: "Messages fetched successfully",
      data: messages,
      error: false,
      status: 200,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Error fetching messages",
      error: true,
      status: 500,
    });
  }
};
