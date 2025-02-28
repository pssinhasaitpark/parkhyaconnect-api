import express from "express";
import { sendMessage, getMessages } from "../controllers/message";
import { authenticate } from "../middlewares/auth"; 

const router = express.Router();

router.post("/", authenticate, sendMessage);
router.get("/:receiverId", authenticate, getMessages);

export default router;
