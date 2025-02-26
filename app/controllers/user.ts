import { Request, Response } from "express";
import * as userService from "../services/user.service";
import { responseHandler } from "../utils/responseHandler";

export const createUser = async (req: Request, res: Response) => {
  try {
    const user = await userService.createUser(req.body);
    responseHandler(res, 201, "User created successfully", user);
  } catch (error) {
    responseHandler(res, 400, "Error creating user", error);
  }
};

export const getUsers = async (_req: Request, res: Response) => {
  try {
    const users = await userService.getUsers();
    responseHandler(res, 200, "Users retrieved", users);
  } catch (error) {
    responseHandler(res, 400, "Error fetching users", error);
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) return responseHandler(res, 404, "User not found");
    responseHandler(res, 200, "User retrieved", user);
  } catch (error) {
    responseHandler(res, 400, "Error fetching user", error);
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    const user = await userService.updateUser(req.params.id, req.body);
    responseHandler(res, 200, "User updated", user);
  } catch (error) {
    responseHandler(res, 400, "Error updating user", error);
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    await userService.deleteUser(req.params.id);
    responseHandler(res, 200, "User deleted");
  } catch (error) {
    responseHandler(res, 400, "Error deleting user", error);
  }
};
