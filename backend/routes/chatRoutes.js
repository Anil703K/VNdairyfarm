import express from "express";
import { chatbotReply } from "../controllers/chatController.js";

const router = express.Router();

router.post("/chat", chatbotReply);

export default router;
