import { Router } from "express";
import * as authController from "../controllers/auth";
import { upload, convertImagesToWebP } from "../helpers/fileUploader";
import { validate } from "../validators/auth.validator";
import {authenticate} from "../middlewares/auth"

const router = Router();

router.post("/register", upload, convertImagesToWebP, authController.register);
router.post("/login", authController.login);
router.post("/social-login", authController.socialLogin);
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", validate, authController.resetPassword);
router.post("/logout",authenticate, authController.logout);

export default router;
