import express, { NextFunction, Request, Response } from "express";
import { ChatControllers } from "./chat.Controller";
import auth from "../../middleware/auth";

const router = express.Router();

// Create a new chatroom (conversation)
router.post("/conversation", ChatControllers.createConversation);

// Get all chat rooms (conversations) for a user
router.get("/conversation", ChatControllers.getConversationByUserId);

// Get a specific chatroom by conversation ID
router.get(
  "/conversation/:id1/:id2",
  ChatControllers.getSingleMassageConversation
);

// Send a message in a specific chatroom (conversation)
router.post("/message", ChatControllers.sendMessage);

// Get all messages for a specific chatroom
router.get("/:chatroomId/messages", ChatControllers.getMessages);

router.get("/:id/chatUsers", ChatControllers.getUserChat);

router.delete("/conversation/:id", auth(), ChatControllers.deleteConversion);

router.get("/getMyChat", auth(), ChatControllers.getMyChat);
router.get("/searchUser", ChatControllers.searchUser);

export const ChatRoutes = router;
