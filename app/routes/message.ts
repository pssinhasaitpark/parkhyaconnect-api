import express from "express";
import { sendMessage, getMessages,updateMessage,deleteMessage } from "../controllers/message";
import { authenticate } from "../middlewares/auth"; 

const router = express.Router();

router.post("/", authenticate, sendMessage);
router.get("/:receiverId", authenticate, getMessages);
router.get("/", authenticate, getMessages);
router.put("/:messageId", authenticate, updateMessage);
router.delete("/:messageId", authenticate, deleteMessage);
export default router;
