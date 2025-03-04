import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { io } from "../../app";

const prisma = new PrismaClient();

export const createChannel = async (req: Request, res: Response) => {
  try {
    const { name, description, isPrivate = false } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized: User not found",
        error: true,
        status: 401,
      });
    }

    if (!name) {
      return res.status(400).json({
        message: "Channel name is required",
        error: true,
        status: 400,
      });
    }

    const channel = await prisma.channel.create({
      data: {
        name,
        description,
        isPrivate,
        createdBy: userId,
      },
    });

    await prisma.channelMember.create({
      data: {
        channelId: channel.id,
        userId,
        role: "admin",
      },
    });

    const channelWithMembers = await prisma.channel.findUnique({
      where: { id: channel.id },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatar: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!channelWithMembers) {
      return res.status(404).json({
        message: "Channel not found",
        error: true,
        status: 404,
      });
    }

    const formattedChannel = {
      ...channelWithMembers,
      members: channelWithMembers.members.map((member) => member.user),
    };

    io.emit("channelCreated", formattedChannel);

    res.status(201).json({
      message: "Channel created successfully",
      data: formattedChannel,
      error: false,
      status: 201,
    });
  } catch (error) {
    console.error("Error creating channel:", error);
    res.status(500).json({
      message: "Error creating channel",
      error: true,
      status: 500,
    });
  }
};

export const getChannels = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    const channelMembers = await prisma.channelMember.findMany({
      where: { userId },
      include: {
        channel: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    fullName: true,
                    email: true,
                    avatar: true,
                    status: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const channels = channelMembers.map((member) => ({
      ...member.channel,
      members: member.channel.members.map((m) => m.user),
    }));

    res.status(200).json({
      message: "Channels retrieved successfully",
      data: channels,
      error: false,
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching channels:", error);
    res.status(500).json({
      message: "Error fetching channels",
      error: true,
      status: 500,
    });
  }
};

export const getChannelById = async (req: Request, res: Response) => {
  try {
    const { channelId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized: User not found",
        error: true,
        status: 401,
      });
    }

    const membership = await prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId,
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

    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatar: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!channel) {
      return res.status(404).json({
        message: "Channel not found",
        error: true,
        status: 404,
      });
    }

    const formattedChannel = {
      ...channel,
      members: channel.members.map((member) => member.user),
    };

    res.status(200).json({
      message: "Channel retrieved successfully",
      data: formattedChannel,
      error: false,
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching channel:", error);
    res.status(500).json({
      message: "Error fetching channel",
      error: true,
      status: 500,
    });
  }
};

export const addChannelMember = async (req: Request, res: Response) => {
  try {
    const { channelId } = req.params;
    const { userId } = req.body;
    const currentUserId = req.user?.id;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required",
        error: true,
        status: 400,
      });
    }

    if (!currentUserId) {
      return res.status(401).json({
        message: "Unauthorized: User not found",
        error: true,
        status: 401,
      });
    }

    const membership = await prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId: currentUserId,
        },
      },
    });

    if (!membership || membership.role !== "admin") {
      return res.status(403).json({
        message: "You don't have permission to add members to this channel",
        error: true,
        status: 403,
      });
    }

    const userToAdd = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!userToAdd) {
      return res.status(404).json({
        message: "User not found",
        error: true,
        status: 404,
      });
    }

    const existingMembership = await prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId,
        },
      },
    });

    if (existingMembership) {
      return res.status(400).json({
        message: "User is already a member of this channel",
        error: true,
        status: 400,
      });
    }

    await prisma.channelMember.create({
      data: {
        channelId,
        userId,
        role: "member",
      },
    });

    const updatedChannel = await prisma.channel.findUnique({
      where: { id: channelId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatar: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!updatedChannel) {
      return res.status(404).json({
        message: "Channel not found",
        error: true,
        status: 404,
      });
    }

    const formattedChannel = {
      ...updatedChannel,
      members: updatedChannel.members.map((member) => member.user),
    };

    io.emit("channelMemberAdded", {
      channelId,
      user: userToAdd,
    });

    res.status(200).json({
      message: "Member added to channel successfully",
      data: formattedChannel,
      error: false,
      status: 200,
    });
  } catch (error) {
    console.error("Error adding member to channel:", error);
    res.status(500).json({
      message: "Error adding member to channel",
      error: true,
      status: 500,
    });
  }
};

export const removeChannelMember = async (req: Request, res: Response) => {
  try {
    const { channelId, userId } = req.params;
    const currentUserId = req.user?.id;

    if (!currentUserId) {
      return res.status(401).json({
        message: "Unauthorized: User not found",
        error: true,
        status: 401,
      });
    }

    const membership = await prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId: currentUserId,
        },
      },
    });

    if (!membership || membership.role !== "admin") {
      return res.status(403).json({
        message:
          "You don't have permission to remove members from this channel",
        error: true,
        status: 403,
      });
    }

    const membershipToRemove = await prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId,
        },
      },
    });

    if (!membershipToRemove) {
      return res.status(404).json({
        message: "User is not a member of this channel",
        error: true,
        status: 404,
      });
    }

    if (membershipToRemove.role === "admin") {
      return res.status(400).json({
        message: "Cannot remove the channel admin",
        error: true,
        status: 400,
      });
    }

    await prisma.channelMember.delete({
      where: {
        channelId_userId: {
          channelId,
          userId,
        },
      },
    });

    io.emit("channelMemberRemoved", {
      channelId,
      userId,
    });

    res.status(200).json({
      message: "Member removed from channel successfully",
      error: false,
      status: 200,
    });
  } catch (error) {
    console.error("Error removing member from channel:", error);
    res.status(500).json({
      message: "Error removing member from channel",
      error: true,
      status: 500,
    });
  }
};

export const getChannelMessages = async (req: Request, res: Response) => {
  try {
    const { channelId } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized: User not found",
        error: true,
        status: 401,
      });
    }
    const membership = await prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId,
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

    const messages = await prisma.message.findMany({
      where: {
        channelId,
        type: "channel",
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
      orderBy: {
        created_at: "asc",
      },
    });

    res.status(200).json({
      message: "Channel messages retrieved successfully",
      data: messages,
      error: false,
      status: 200,
    });
  } catch (error) {
    console.error("Error fetching channel messages:", error);
    res.status(500).json({
      message: "Error fetching channel messages",
      error: true,
      status: 500,
    });
  }
};

export const deleteChannel = async (req: Request, res: Response) => {
  try {
    const { channelId } = req.params;
    const userId = req.user?.id;

    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      return res.status(404).json({
        message: "Channel not found",
        error: true,
        status: 404,
      });
    }

    if (channel.createdBy !== userId) {
      return res.status(403).json({
        message: "Only the channel creator can delete the channel",
        error: true,
        status: 403,
      });
    }

    await prisma.channel.delete({
      where: { id: channelId },
    });

    io.emit("channelDeleted", { channelId });

    res.status(200).json({
      message: "Channel deleted successfully",
      error: false,
      status: 200,
    });
  } catch (error) {
    console.error("Error deleting channel:", error);
    res.status(500).json({
      message: "Error deleting channel",
      error: true,
      status: 500,
    });
  }
};

export const updateChannel = async (req: Request, res: Response) => {
  try {
    const { channelId } = req.params;
    const { name, description, isPrivate } = req.body;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized: User not found",
        error: true,
        status: 401,
      });
    }

    const channel = await prisma.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      return res.status(404).json({
        message: "Channel not found",
        error: true,
        status: 404,
      });
    }

    const membership = await prisma.channelMember.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId,
        },
      },
    });

    if (!membership || membership.role !== "admin") {
      return res.status(403).json({
        message: "Only channel admins can update the channel",
        error: true,
        status: 403,
      });
    }

    const updatedChannel = await prisma.channel.update({
      where: { id: channelId },
      data: {
        name: name !== undefined ? name : channel.name,
        description:
          description !== undefined ? description : channel.description,
        isPrivate: isPrivate !== undefined ? isPrivate : channel.isPrivate,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                email: true,
                avatar: true,
                status: true,
              },
            },
          },
        },
      },
    });

    const formattedChannel = {
      ...updatedChannel,
      members: updatedChannel.members.map((member) => member.user),
    };

    io.emit("channelUpdated", formattedChannel);

    res.status(200).json({
      message: "Channel updated successfully",
      data: formattedChannel,
      error: false,
      status: 200,
    });
  } catch (error) {
    console.error("Error updating channel:", error);
    res.status(500).json({
      message: "Error updating channel",
      error: true,
      status: 500,
    });
  }
};
