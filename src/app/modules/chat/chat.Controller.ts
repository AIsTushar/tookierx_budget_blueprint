import { StatusCodes } from "http-status-codes";
import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { ChatServices } from "./chat.service";
import sendResponse from "../../middleware/sendResponse";

const createConversation = catchAsync(async (req: Request, res: Response) => {
  const { user1Id, user2Id } = req.body;
  const result = await ChatServices.createConversationIntoDB(user1Id, user2Id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Conversation created successfully",
    data: result,
  });
});

// Get a specific chatroom (conversation) between two users
const getConversationByUserId = catchAsync(
  async (req: Request, res: Response) => {
    const { user1Id, user2Id } = req.query;
    const result = await ChatServices.getMessagesByConversationIntoDB(
      user1Id as string,
      user2Id as string
    );
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Chatroom messages retrieved successfully",
      data: result,
    });
  }
);

// Get a single chatroom (conversation) by conversation ID
const getSingleMassageConversation = catchAsync(
  async (req: Request, res: Response) => {
    const id1 = req.params.id1;
    const id2 = req.params.id2;
    const result = await ChatServices.getMessagesByConversationIntoDB(id1, id2);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Chatroom retrieved successfully",
      data: result,
    });
  }
);

// Send a message in a specific conversation (chatroom)
const sendMessage = catchAsync(async (req: Request, res: Response) => {
  const { conversationId, senderId, senderName, content, file } = req.body;
  const result = await ChatServices.createMessageIntoDB(
    conversationId,
    senderId,
    senderName,
    content,
    file
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Message sent successfully",
    data: result,
  });
});

// Get all messages in a specific chatroom (conversation)
const getMessages = catchAsync(async (req: Request, res: Response) => {
  const { user1Id, user2Id } = req.query;
  const result = await ChatServices.getMessagesByConversationIntoDB(
    user1Id as string,
    user2Id as string
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Messages retrieved successfully",
    data: result,
  });
});
const getUserChat = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ChatServices.getChatUsersForUser(id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "chat users retrieved successfully",
    data: result,
  });
});

// Delete a specific message in a specific chatroom (conversation)
const deleteConversion = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const result = await ChatServices.deleteConversation(id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "conversation deleted successfully",
    data: result,
  });
});

const getMyChat = catchAsync(
  async (req: Request & { user?: any }, res: Response) => {
    const userId = req.user.id;
    const name = req.query.name as string;
    const result = await ChatServices.getMyChat(userId, name);
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: "Chat Retrieve successfully",
      data: result,
    });
  }
);

const searchUser = catchAsync(async (req: Request, res: Response) => {
  const { user } = req.query;
  const result = await ChatServices.searchUser(user as string);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Users retrieved successfully",
    data: result,
  });
});

export const ChatControllers = {
  createConversation,
  sendMessage,
  getMessages,
  getConversationByUserId,
  getSingleMassageConversation,
  getUserChat,
  deleteConversion,
  getMyChat,
  searchUser,
};
