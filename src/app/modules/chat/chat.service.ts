import { StatusCodes } from "http-status-codes";
import { prisma } from "../../../utils/prisma";
import ApiError from "../../error/ApiErrors";

// Create a new conversation between two users
const createConversationIntoDB = async (user1Id: string, user2Id: string) => {
  // Check if a conversation already exists between these two users
  const existingConversation = await prisma.conversation.findFirst({
    where: {
      OR: [
        { user1Id: user1Id, user2Id: user2Id },
        { user1Id: user2Id, user2Id: user1Id },
      ],
    },
  });

  if (existingConversation) {
    return existingConversation; // If it exists, return the existing conversation
  }

  // Create a new conversation if it doesn't exist
  const result = await prisma.conversation.create({
    data: {
      user1Id,
      user2Id,
    },
  });
  return result;
};

// Get all conversations for a specific user
const getConversationsByUserIdIntoDB = async (userId: string) => {
  const result = await prisma.conversation.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
    include: {
      user1: true, // Include details of user1
      user2: true, // Include details of user2
      messages: {
        orderBy: { createdAt: "desc" }, // Include the latest message
        take: 1, // Just get the latest message for preview
      },
    },
  });
  return result;
};

// Get messages for a specific conversation between two users
const getMessagesByConversationIntoDB = async (
  user1Id: string,
  user2Id: string
) => {
  const conversation = await prisma.conversation.findFirst({
    where: {
      OR: [
        { user1Id: user1Id, user2Id: user2Id },
        { user1Id: user2Id, user2Id: user1Id },
      ],
    },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  return conversation || [];
};

// Create a message in a specific conversation
const createMessageIntoDB = async (
  conversationId: string,
  senderId: string,
  receiverId: string,
  content: string,
  file?: any
) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  // Create a message in the existing conversation
  const result = await prisma.message.create({
    data: {
      conversationId: conversation.id,
      senderId,
      receiverId,
      content,
    },
  });

  return result;
};

const getChatUsersForUser = async (userId: string) => {
  const conversations = await prisma.conversation.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
    },
    include: {
      user1: true,
      user2: true,
      messages: {
        orderBy: { createdAt: "desc" }, // Get the most recent message
        take: 1, // Only return the latest message
      },
    },
  });

  // Extract the unique list of users the user is chatting with and their last message
  const chatUsersData = conversations.map((conversation) => {
    const chatUser =
      conversation.user1Id === userId ? conversation.user2 : conversation.user1;
    const lastMessage = conversation.messages[0]; // The most recent message
    return {
      chatUser,
      lastMessage, // Include the latest message
    };
  });

  return chatUsersData;
};

const deleteConversation = async (id: string) => {
  // Start a transaction
  return await prisma.$transaction(async (prisma) => {
    // Check if the conversation exists
    const isConversationExist = await prisma.conversation.findUnique({
      where: { id },
      include: { messages: true }, // Include messages in the conversation
    });

    if (!isConversationExist) {
      throw new ApiError(StatusCodes.NOT_FOUND, "Conversation not found");
    }

    // First, delete all related messages
    await prisma.message.deleteMany({
      where: { conversationId: id },
    });

    // Then, delete the conversation
    const result = await prisma.conversation.delete({
      where: { id },
    });

    if (!result) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Could not delete conversation"
      );
    }

    return result;
  });
};

const countUnreadMessages = async (userId: string, chatroomId: string) => {
  const unreadCount = await prisma.message.count({
    where: {
      conversationId: chatroomId,
      receiverId: userId,
      isRead: false, // Only count unread messages
    },
  });

  return unreadCount;
};

const markMessagesAsRead = async (userId: string, chatroomId: string) => {
  await prisma.message.updateMany({
    where: {
      receiverId: userId,
      conversationId: chatroomId,
      isRead: false,
    },
    data: {
      isRead: true,
    },
  });
};

const searchUser = async (user: string) => {
  const result = await prisma.user.findMany({
    where: {
      name: user,
    },
    orderBy: {
      createdAt: "desc",
    },
    select: {
      id: true,
      name: true,
      image: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return {
    meta: {
      total: await prisma.user.count({
        where: {
          name: user,
        },
      }),
    },
    data: result,
  };
};

const getMyChat = async (userId: string, name?: string) => {
  // const blockedUsers = await prisma.block.findMany({
  //   where: {
  //     userId
  //   },
  //   select: {
  //     blockedUserId: true
  //   }
  // })

  // const blockedUserIds = blockedUsers.map(user => user.blockedUserId)
  const result = await prisma.conversation.findMany({
    where: {
      OR: [{ user1Id: userId }, { user2Id: userId }],
      // NOT: {
      //   user1Id: {
      //     in: [userId, ...blockedUserIds]
      //   },
      //   user2Id: {
      //     in: [userId, ...blockedUserIds]
      //   }
      // }
    },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  const chatList = await Promise.all(
    result.map(async (conversation) => {
      const lastMessage = conversation.messages[0];
      const targetUserId =
        conversation.user1Id === userId
          ? conversation.user2Id
          : conversation.user1Id;

      const targetUserProfile = await prisma.user.findUnique({
        where: { id: targetUserId },
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        },
      });

      const unreadCount = await prisma.message.count({
        where: {
          conversationId: conversation.id,
          receiverId: userId,
          isRead: false,
        },
      });

      return {
        conversationId: conversation.id,
        user: targetUserProfile || null,
        lastMessage: lastMessage ? lastMessage.content : null,
        lastMessageDate: lastMessage ? lastMessage.createdAt : null,
        unreadCount,
      };
    })
  );

  // 🔍 If name is provided, filter conversations by user name
  if (name && name.trim() !== "") {
    return chatList.filter(
      (chat) =>
        chat.user && chat.user.name!.toLowerCase().includes(name.toLowerCase())
    );
  }

  return chatList;
};

// const createChatRoom = async (userId: string, recipientId: string) => {
//   const user = await prisma.user.findUnique({
//     where: { id: userId, status: "ACTIVE" },
//   });
//   const recipient = await prisma.user.findUnique({
//     where: { id: recipientId, status: "ACTIVE" },
//   });

//   if (!user || !recipient) {
//     throw new ApiError(
//       StatusCodes.BAD_REQUEST,
//       "User or recipient not found or blocked"
//     );
//   }

//   let chatRoom = await prisma.chatRoom.findFirst({
//     where: {
//       type: "PRIVATE",
//       AND: [{ userIds: { has: userId } }, { userIds: { has: recipientId } }],
//     },
//     include: {
//       users: { select: { id: true, name: true, email: true, image: true } },
//     },
//   });

//   if (!chatRoom) {
//     chatRoom = await prisma.chatRoom.create({
//       data: {
//         userIds: [userId, recipientId],
//         users: { connect: [{ id: userId }, { id: recipientId }] },
//         type: "PRIVATE",
//       },
//       include: {
//         users: { select: { id: true, name: true, email: true, image: true } },
//       },
//     });

//     // Update chatRoomIds in User model
//     await prisma.user.update({
//       where: { id: userId },
//       data: { chatRoomIds: { push: chatRoom.id } },
//     });
//     await prisma.user.update({
//       where: { id: recipientId },
//       data: { chatRoomIds: { push: chatRoom.id } },
//     });
//   }

//   return chatRoom;
// };

// const createGroupChat = async (
//   userId: string,
//   userIds: string[],
//   name: string
// ) => {
//   const users = await prisma.user.findMany({
//     where: { id: { in: [...userIds, userId] }, status: "ACTIVE" },
//   });

//   if (users.length !== userIds.length + 1) {
//     throw new ApiError(
//       StatusCodes.BAD_REQUEST,
//       "One or more users not found or blocked"
//     );
//   }

//   const chatRoom = await prisma.chatRoom.create({
//     data: {
//       userIds: [...userIds, userId],
//       users: { connect: [...userIds, userId].map((id) => ({ id })) },
//       type: "GROUP",
//       name,
//       adminId: userId,
//     },
//     include: {
//       users: { select: { id: true, name: true, email: true, image: true } },
//     },
//   });

//   // Update chatRoomIds for all users
//   await prisma.user.updateMany({
//     where: { id: { in: [...userIds, userId] } },
//     data: { chatRoomIds: { push: chatRoom.id } },
//   });

//   return chatRoom;
// };

// const addUserToGroup = async (
//   adminId: string,
//   chatRoomId: string,
//   newUserId: string
// ) => {
//   const chatRoom = await prisma.chatRoom.findUnique({
//     where: { id: chatRoomId },
//   });

//   if (!chatRoom || chatRoom.type !== "GROUP") {
//     throw new ApiError(StatusCodes.BAD_REQUEST, "Group chat not found");
//   }

//   if (chatRoom.adminId !== adminId) {
//     throw new ApiError(StatusCodes.FORBIDDEN, "Only the admin can add users");
//   }

//   const user = await prisma.user.findUnique({
//     where: { id: newUserId, status: "ACTIVE" },
//   });

//   if (!user) {
//     throw new ApiError(StatusCodes.BAD_REQUEST, "User not found or blocked");
//   }

//   if (chatRoom.userIds.includes(newUserId)) {
//     throw new ApiError(StatusCodes.BAD_REQUEST, "User already in group");
//   }

//   const updatedChatRoom = await prisma.chatRoom.update({
//     where: { id: chatRoomId },
//     data: {
//       userIds: { push: newUserId },
//       users: { connect: { id: newUserId } },
//     },
//     include: {
//       users: { select: { id: true, name: true, email: true, image: true } },
//     },
//   });

//   // Update chatRoomIds for the new user
//   await prisma.user.update({
//     where: { id: newUserId },
//     data: { chatRoomIds: { push: chatRoomId } },
//   });

//   return updatedChatRoom;
// };

// const removeUserFromGroup = async (
//   adminId: string,
//   chatRoomId: string,
//   removeUserId: string
// ) => {
//   const chatRoom = await prisma.chatRoom.findUnique({
//     where: { id: chatRoomId },
//   });

//   if (!chatRoom || chatRoom.type !== "GROUP") {
//     throw new ApiError(httpStatus.BAD_REQUEST, "Group chat not found");
//   }

//   if (chatRoom.adminId !== adminId) {
//     throw new ApiError(httpStatus.FORBIDDEN, "Only the admin can remove users");
//   }

//   if (!chatRoom.userIds.includes(removeUserId)) {
//     throw new ApiError(httpStatus.BAD_REQUEST, "User not in group");
//   }

//   const updatedChatRoom = await prisma.chatRoom.update({
//     where: { id: chatRoomId },
//     data: {
//       userIds: { set: chatRoom.userIds.filter((id) => id !== removeUserId) },
//       users: { disconnect: { id: removeUserId } },
//     },
//     include: {
//       users: { select: { id: true, name: true, email: true, image: true } },
//     },
//   });

//   // Remove chatRoomId from the user's chatRoomIds
//   await prisma.user.update({
//     where: { id: removeUserId },
//     data: {
//       chatRoomIds: {
//         set: (
//           await prisma.user.findUnique({ where: { id: removeUserId } })
//         )?.chatRoomIds.filter((id) => id !== chatRoomId),
//       },
//     },
//   });

//   return updatedChatRoom;
// };

// const getUserChatRooms = async (userId: string) => {
//   const user = await prisma.user.findUnique({
//     where: { id: userId, status: "ACTIVE" },
//   });

//   if (!user) {
//     throw new ApiError(httpStatus.BAD_REQUEST, "User not found or blocked");
//   }

//   const chatRooms = await prisma.chatRoom.findMany({
//     where: { userIds: { has: userId } },
//     include: {
//       users: { select: { id: true, name: true, email: true, image: true } },
//       messages: {
//         orderBy: { createdAt: "desc" },
//         take: 1,
//       },
//     },
//   });

//   const formattedChatRooms = chatRooms.map((room) => ({
//     ...room,
//     unreadCount: room.messages.filter((msg) => !msg.readBy.includes(userId))
//       .length,
//     name:
//       room.type === "GROUP"
//         ? room.name
//         : room.users.find((u) => u.id !== userId)?.name,
//   }));

//   return formattedChatRooms;
// };

// const getMessages = async (userId: string, chatRoomId: string) => {
//   const user = await prisma.user.findUnique({
//     where: { id: userId, status: "ACTIVE" },
//   });

//   if (!user) {
//     throw new ApiError(httpStatus.BAD_REQUEST, "User not found or blocked");
//   }

//   const chatRoom = await prisma.chatRoom.findUnique({
//     where: { id: chatRoomId },
//     include: {
//       users: { select: { id: true, name: true, email: true, image: true } },
//     },
//   });

//   if (!chatRoom || !chatRoom.userIds.includes(userId)) {
//     throw new ApiError(httpStatus.FORBIDDEN, "Access to chat room denied");
//   }

//   const messages = await prisma.message.findMany({
//     where: { chatRoomId },
//     include: {
//       sender: { select: { id: true, name: true, email: true, image: true } },
//     },
//     orderBy: { createdAt: "asc" },
//   });

//   return messages;
// };

// const sendMessage = async (
//   userId: string,
//   chatRoomId: string,
//   content: string | undefined,
//   images: any | null
// ) => {
//   if (!content && !images) {
//     throw new ApiError(
//       httpStatus.BAD_REQUEST,
//       "Message content or image is required"
//     );
//   }

//   let imagesUrls: string[] = [];
//   if (images) {
//     imagesUrls = images.map((img: any) => img.location);
//   }

//   const chatRoom = await prisma.chatRoom.findUnique({
//     where: { id: chatRoomId },
//     include: { users: true },
//   });

//   if (!chatRoom || !chatRoom.userIds.includes(userId)) {
//     throw new ApiError(httpStatus.FORBIDDEN, "Access to chat room denied");
//   }

//   const message = await prisma.message.create({
//     data: {
//       chatRoomId,
//       senderId: userId,
//       content,
//       images: imagesUrls.length > 0 ? imagesUrls : undefined,
//       readBy: [userId], // Sender has read their own message
//     },
//     include: {
//       sender: { select: { id: true, name: true, email: true, image: true } },
//     },
//   });

//   // Update chat room's updatedAt timestamp
//   await prisma.chatRoom.update({
//     where: { id: chatRoomId },
//     data: { updatedAt: new Date() },
//   });

//   return message;
// };

// const markMessagesAsRead = async (userId: string, chatRoomId: string) => {
//   const chatRoom = await prisma.chatRoom.findUnique({
//     where: { id: chatRoomId },
//   });

//   if (!chatRoom || !chatRoom.userIds.includes(userId)) {
//     throw new ApiError(httpStatus.FORBIDDEN, "Access to chat room denied");
//   }

//   await prisma.message.updateMany({
//     where: {
//       chatRoomId,
//       NOT: { readBy: { has: userId } },
//     },
//     data: {
//       isRead: true,
//       readBy: { push: userId },
//     },
//   });
// };

export const ChatServices = {
  createConversationIntoDB,
  getConversationsByUserIdIntoDB,
  getMessagesByConversationIntoDB,
  createMessageIntoDB,
  getChatUsersForUser,
  deleteConversation,
  countUnreadMessages,
  markMessagesAsRead,
  getMyChat,
  searchUser,
  // searchUser,
  // createChatRoom,
  // createGroupChat,
  // addUserToGroup,
  // removeUserFromGroup,
  // getUserChatRooms,
  // getMessages,
  // sendMessage,
  // markMessagesAsRead,
};
