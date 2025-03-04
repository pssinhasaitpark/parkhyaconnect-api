import { Router } from "express";
import * as channelController from "../controllers/channel";
import { authenticate } from "../middlewares/auth";

const router = Router();

router.post("/", authenticate, channelController.createChannel);
router.get("/", authenticate, channelController.getChannels);
router.get("/:channelId", authenticate, channelController.getChannelById);
router.put("/:channelId", authenticate, channelController.updateChannel);
router.delete("/:channelId", authenticate, channelController.deleteChannel);

router.post("/:channelId/members", authenticate, channelController.addChannelMember);
router.delete("/:channelId/members/:userId", authenticate, channelController.removeChannelMember);

router.get("/:channelId/messages", authenticate, channelController.getChannelMessages);

export default router;