import { Request, Response } from "express";
import * as userService from "../services/user.service";
import { responseHandler } from "../utils/responseHandler";
import { uploadImageToCloudinary } from "../helpers/cloudinaryConfig";
import bcrypt from "bcrypt";

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
    }

    const existingUser = await userService.getUserById(req.params.id);
    if (!existingUser) {
      return responseHandler(res, 404, "User not found");
    }

    const updateData: any = { ...req.body };

    if (updateData.email && updateData.email !== existingUser.email) {
      return responseHandler(res, 400, "Email cannot be updated");
    }

    if (
      updateData.mobileNumber &&
      updateData.mobileNumber !== existingUser.mobileNumber
    ) {
      const existingMobileUser = await userService.findUserByMobile(
        updateData.mobileNumber
      );
      if (existingMobileUser) {
        return responseHandler(
          res,
          400,
          "Mobile number is already registered with another user"
        );
      }
    }

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }

    if (avatarUrl) {
      updateData.avatar = avatarUrl;
    }

    const user = await userService.updateUser(req.params.id, updateData);

    const { password, ...filteredUser } = user;

    responseHandler(res, 200, "User updated successfully", filteredUser);
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

export const updateUserStatus = async (req: Request, res: Response) => {
  const { isOnline } = req.body;

  try {
    const user = await userService.updateUserStatus(req.params.id, isOnline);
    responseHandler(res, 200, "User  status updated", user);
  } catch (error) {
    console.error("Error updating user status:", error);
    responseHandler(res, 500, "Error updating user status", error);
  }
};
