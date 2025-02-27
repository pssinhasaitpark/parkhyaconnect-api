import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createUser = async (data: {
  fullName?: string;
  mobileNumber?: string;
  email: string;
  password: string;
  socialId?: string;
  avatar?: string;
}) => {
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ email: data.email }, { mobileNumber: data.mobileNumber }],
    },
  });

  if (existingUser) {
    throw new Error("User with this email or mobile number already exists.");
  }

  return await prisma.user.create({ data });
};

export const findUserByEmail = async (email: string) => {
  return await prisma.user.findUnique({ where: { email } });
};

export const findUserBySocialId = async (socialId: string) => {
  return await prisma.user.findUnique({ where: { socialId } });
};

export const getUsers = async (
  searchTerm?: string,
  page: number = 1,
  limit: number = 10
) => {
  const query: any = {};

  if (searchTerm) {
    query.OR = [
      { email: { contains: searchTerm, mode: "insensitive" } },
      { mobileNumber: { contains: searchTerm, mode: "insensitive" } },
      { fullName: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  const users = await prisma.user.findMany({
    where: query,
    skip: (page - 1) * limit,
    take: limit,
  });

  const totalUsers = await prisma.user.count({ where: query });

  return {
    users,
    totalUsers,
    totalPages: Math.ceil(totalUsers / limit),
    currentPage: page,
  };
};

export const getUserById = async (id: string) => {
  return await prisma.user.findUnique({ where: { id } });
};

export const updateUser = async (id: string, data: { socialId?: string }) => {
  return await prisma.user.update({
    where: { id },
    data,
  });
};

export const deleteUser = async (id: string) => {
  return await prisma.user.delete({ where: { id } });
};
