import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { io } from "../../app";
import { producer } from "../kafka/kafka";

const prisma = new PrismaClient();

export const sendMessage = async (req: Request, res: Response) => {
  const { content, receiverId, channelId, type = "public" } = req.body;
  const senderId = req.user?.id;

  if (!senderId) {
    return res.status(401).json({
      message: "Unauthorized: User not found",
      error: true,
      status: 401,
    });
  }

  try {
    if (!["public", "private", "channel"].includes(type)) {
      return res.status(400).json({
        message:
          "Invalid message type. Must be 'public', 'private', or 'channel'",
        error: true,
        status: 400,
      });
    }

    if (type === "private" && !receiverId) {
      return res.status(400).json({
        message: "Receiver ID is required for private messages",
        error: true,
        status: 400,
      });
    }

    if (type === "channel" && !channelId) {
      return res.status(400).json({
        message: "Channel ID is required for channel messages",
        error: true,
        status: 400,
      });
    }

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

    if (type === "channel") {
      const membership = await prisma.channelMember.findUnique({
        where: {
          channelId_userId: {
            channelId,
            userId: senderId,
          },
        },
      });

      if (!membership) {
        return res.status(403).json({
          message: "You are not a member of this channel",
          error: true,
          status: 403,
        });
      }
    }

    const message = await prisma.message.create({
      data: {
        content,
        senderId,
        receiverId: type === "private" ? receiverId : null,
        channelId: type === "channel" ? channelId : null,
        type,
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    await producer.send({
      topic: "messages",
      messages: [{ value: JSON.stringify(message) }],
    });

    io.emit("newMessage", message);

    res.status(201).json({
      message: "Message sent successfully",
      data: message,
      error: false,
      status: 201,
    });
  } catch (error) {
    let message = "An unknown error occurred";

    if (error instanceof Error) {
      message = error.message;
    }

    console.error("Error sending message:", error);
    res.status(500).json({
      message: "Error sending message",
      error: true,
      status: 500,
      details: message,
    });
  }
};

export const getMessages = async (req: Request, res: Response) => {
  const { receiverId } = req.query;  // Fetch receiverId from query params
  const senderId = req.user?.id;
  
  const { page = 1, limit = 10, content, type } = req.query;

  try {
    let messages;
    const skip = (Number(page) - 1) * Number(limit);
    const take = Number(limit);

    let query: any = {
      take,
      skip,
      orderBy: {
        created_at: "asc",
      },
    };

    if (content) {
      query.where = {
        ...query.where,
        content: {
          contains: content as string,
          mode: "insensitive", 
        },
      };
    }

    if (type) {
      query.where = {
        ...query.where,
        type: type as string,
      };
    }

    if (receiverId) {
      const receiver = await prisma.user.findUnique({
        where: { id: receiverId as string },  // Convert receiverId to string if necessary
      });

      if (!receiver) {
        return res.status(400).json({
          message: "Receiver not found",
          error: true,
          status: 400,
        });
      }

      query.where = {
        ...query.where,
        OR: [
          { senderId: senderId, receiverId: receiverId },
          { senderId: receiverId, receiverId: senderId },
        ],
        type: "private", 
      };

    } else {
      query.where = {
        ...query.where,
        type: "public",
      };
    }

    messages = await prisma.message.findMany({
      ...query,
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
          },
        },
        receiver: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    const totalMessages = await prisma.message.count({
      where: query.where,
    });

    const totalPages = Math.ceil(totalMessages / Number(limit));

    res.status(200).json({
      message: "Messages fetched successfully",
      data: messages,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalMessages,
        totalPages,
      },
      error: false,
      status: 200,
    });
  } catch (error) {
    let message = "An unknown error occurred";

    if (error instanceof Error) {
      message = error.message;
    }

    console.error("Error fetching messages:", error);
    res.status(500).json({
      message: "Error fetching messages",
      error: true,
      status: 500,
      details: message,
    });
  }
};

export const updateMessage = async (req: Request, res: Response) => {
  const { messageId } = req.params;
  const { content } = req.body;
  const userId = req.user?.id;

  try {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    if (!message) {
      return res
        .status(404)
        .json({ message: "Message not found", error: true });
    }

    if (message.senderId !== userId) {
      return res.status(403).json({ message: "Unauthorized", error: true });
    }

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { content },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    io.emit("messageUpdated", updatedMessage);

    res.status(200).json({
      message: "Message updated",
      data: updatedMessage,
      error: false,
      status: 200,
    });
  } catch (error) {
    let message = "An unknown error occurred";

    if (error instanceof Error) {
      message = error.message;
    }

    console.error("Error updating message:", error);
    res.status(500).json({
      message: "Error updating message",
      error: true,
      status: 500,
      details: message,
    });
  }
};

export const deleteMessage = async (req: Request, res: Response) => {
  const { messageId } = req.params;
  const userId = req.user?.id;

  try {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return res
        .status(404)
        .json({ message: "Message not found", error: true });
    }

    if (message.senderId !== userId) {
      return res.status(403).json({ message: "Unauthorized", error: true });
    }

    await prisma.message.delete({ where: { id: messageId } });

    io.emit("messageDeleted", { messageId });

    res.status(200).json({
      message: "Message deleted successfully",
      error: false,
      status: 200,
    });
  } catch (error) {
    let message = "An unknown error occurred";

    if (error instanceof Error) {
      message = error.message;
    }

    console.error("Error deleting message:", error);
    res.status(500).json({
      message: "Error deleting message",
      error: true,
      status: 500,
      details: message,
    });
  }
};

export const markMessageAsSeen = async (req: Request, res: Response) => {
  const { messageId } = req.params;
  const userId = req.user?.id;

  try {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return res.status(404).json({ message: "Message not found", error: true });
    }

    if (!message.seenBy.includes(userId)) {
      await prisma.message.update({
        where: { id: messageId },
        data: {
          seen: true,
          seenBy: {
            push: userId,
          },
        },
      });
    }

    res.status(200).json({
      message: "Message marked as seen",
      error: false,
      status: 200,
    });
  } catch (error) {
    let message = "An unknown error occurred";

    if (error instanceof Error) {
      message = error.message;
    }

    console.error("Error marking message as seen:", error);
    res.status(500).json({
      message: "Error marking message as seen",
      error: true,
      status: 500,
      details: message,
    });
  }
};

export const getSeenUsers = async (req: Request, res: Response) => {
  const { messageId } = req.params;

  try {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    if (!message) {
      return res.status(404).json({ message: "Message not found", error: true });
    }

    const seenUsers = await prisma.user.findMany({
      where: {
        id: { in: message.seenBy },
      },
      select: {
        id: true,
        fullName: true,
        email: true,
        avatar: true,
      },
    });

    res.status(200).json({
      message: "Seen users retrieved successfully",
      data: seenUsers,
      error: false,
      status: 200,
    });
  } catch (error) {
    let message = "An unknown error occurred";

    if (error instanceof Error) {
      message = error.message;
    }

    console.error("Error retrieving seen users:", error);
    res.status(500).json({
      message: "Error retrieving seen users",
      error: true,
      status: 500,
      details: message,
    });
  }
};