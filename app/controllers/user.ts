import { Request, Response } from "express";
import * as userService from "../services/user.service";
import { responseHandler } from "../utils/responseHandler";
import { uploadImageToCloudinary } from "../helpers/cloudinaryConfig";

export const createUser = async (req: Request, res: Response) => {
  try {
    const user = await userService.createUser(req.body);
    responseHandler(res, 201, "User created successfully", user);
  } catch (error) {
    console.error("Error details:", error);
    if (
      error.message === "User with this email or mobile number already exists."
    ) {
      responseHandler(res, 409, error.message);
    } else {
      responseHandler(res, 400, "Error creating user", error);
    }
  }
};

export const getUsers = async (req: Request, res: Response) => {
  try {
    const { searchTerm, page = 1, limit = 10 } = req.query;

    const users = await userService.getUsers(
      searchTerm as string,
      Number(page),
      Number(limit)
    );

    responseHandler(res, 200, "Users retrieved", users);
  } catch (error) {
    console.error("Error:", error);
    responseHandler(res, 500, "Internal Server Error");
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) {
      return responseHandler(res, 404, "User not found");
    }
    responseHandler(res, 200, "User retrieved", user);
  } catch (error) {
    responseHandler(res, 400, "Error fetching user", error);
  }
};

export const updateUser = async (req: Request, res: Response) => {
  try {
    let avatarUrl: string | null = null;

    if (req.files && req.files.length > 0) {
      const uploadResult = await uploadImageToCloudinary(req.files[0].buffer);
      avatarUrl = uploadResult;
      console.log("Avatar URL:", avatarUrl);
    }

    const updateData: any = {
      ...req.body,
    };

    if (avatarUrl) {
      updateData.avatar = avatarUrl;
    }

    const user = await userService.updateUser(req.params.id, updateData);
    responseHandler(res, 200, "User updated", user);
  } catch (error) {
    console.error("Error updating user:", error);
    responseHandler(res, 400, "Error updating user", error);
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) return responseHandler(res, 404, "User not found");

    await userService.deleteUser(req.params.id);
    responseHandler(res, 200, "User deleted");
  } catch (error) {
    responseHandler(res, 400, "Error deleting user", error);
  }
};
