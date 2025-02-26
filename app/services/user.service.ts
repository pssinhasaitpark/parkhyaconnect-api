import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createUser = async (data: { name: string; email: string; password: string }) => {
  return await prisma.user.create({ data });
};

export const getUsers = async () => {
  return await prisma.user.findMany();
};

export const getUserById = async (id: string) => {
  return await prisma.user.findUnique({ where: { id } });
};

export const updateUser = async (id: string, data: { name?: string; email?: string }) => {
  return await prisma.user.update({ where: { id }, data });
};

export const deleteUser = async (id: string) => {
  return await prisma.user.delete({ where: { id } });
};
