import express from "express";
import { sendMessage, getMessages,updateMessage,deleteMessage,markMessageAsSeen,getSeenUsers,addReaction,getReactions} from "../controllers/message";
import { authenticate } from "../middlewares/auth"; 

const router = express.Router();

router.post("/", authenticate, sendMessage);
router.get("/:receiverId", authenticate, getMessages);
router.get("/", authenticate, getMessages);
router.put("/:messageId", authenticate, updateMessage);
router.delete("/:messageId", authenticate, deleteMessage);
router.put("/seen/:messageId", authenticate, markMessageAsSeen);
router.get("/seen/:messageId", authenticate, getSeenUsers);

router.post("/:messageId/reactions", authenticate, addReaction); // Add a reaction to a message
router.get("/:messageId/reactions", authenticate, getReactions); // Get reactions for a message

export default router;
