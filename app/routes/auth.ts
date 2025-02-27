import { Router } from "express";
import * as authController from "../controllers/auth";
import { upload, convertImagesToWebP } from "../helpers/fileUploader";

const router = Router();

router.post("/register", upload, convertImagesToWebP, authController.register);
router.post("/login", authController.login);
router.post("/social-login", authController.socialLogin);

export default router;
