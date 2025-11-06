import { get, Server as HTTPServer } from "http";
import { Server, Socket } from "socket.io";
import { prisma } from "../../utils/prisma";
import { notificationServices } from "../modules/notifications/notification.service";
import { jwtHelpers } from "../helper/jwtHelper";
import { JwtPayload } from "jsonwebtoken";
import { ChatServices } from "../modules/chat/chat.service";

// ===== Global State =====
const userSocketMap = new Map<string, string[]>();
let io: Server;

// ===== Helper: Get socket ID from user ID =====
export const getUserSocketIds = (userId: string): string[] => {
  return userSocketMap.get(userId) || [];
};

// ===== Helper: Broadcast Online Users =====
const broadcastOnlineUsers = (excludeUserId?: string) => {
  const onlineUsers = Array.from(userSocketMap.keys()).filter(
    (userId) => userId !== excludeUserId
  );

  io.emit("onlineUsers", onlineUsers);
};

// ===== Helper: Push Notification for Offline Users =====
const sendNotificationIfInactive = async (
  senderId: string,
  receiverId: string
) => {
  const isActive = userSocketMap.get(receiverId);
  if (!isActive) {
    const senderProfile = await prisma.user.findUnique({
      where: { id: senderId },
      select: { name: true },
    });

    const notificationData = {
      title: senderProfile?.name || "New Message Received!",
      body: `${senderProfile?.name || "Someone"} has sent you a new message.`,
    };

    try {
      await notificationServices.sendSingleNotification(
        senderId,
        receiverId,
        notificationData
      );
    } catch (error: any) {
      console.error("Failed to send notification:", error.message);
    }
  }
};

// ===== JWT Socket Authentication =====
const socketAuth = (socket: Socket, next: (err?: Error) => void) => {
  try {
    const rawToken =
      socket.handshake.auth?.token ||
      socket.handshake.headers.authorization ||
      socket.handshake.query.token;

    if (!rawToken || !rawToken.toString().startsWith("Bearer ")) {
      return next(new Error("Unauthorized: Missing or invalid token"));
    }

    const token = rawToken.toString().split("Bearer ")[1];
    const user = jwtHelpers.verifyToken(token) as JwtPayload;
    socket.data.user = user;
    next();
  } catch (err) {
    next(new Error("Unauthorized"));
  }
};

// ===== Main Socket Initialization =====
export const initializeSocketIO = (server: HTTPServer) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      credentials: false,
    },
  });

  io.use(socketAuth);

  io.on("connection", (socket: Socket) => {
    const user = socket.data.user as JwtPayload;
    const userId = user.id;

    if (!userId) {
      socket.disconnect(true);
      return;
    }

    // ===== Multi-device support =====
    if (!userSocketMap.has(userId)) userSocketMap.set(userId, []);
    userSocketMap.get(userId)!.push(socket.id);

    broadcastOnlineUsers(userId);

    console.log(`User ${userId} connected`);

    // === 1. Join a conversation ===
    socket.on("joinConversation", async ({ user2Id }) => {
      const conversation = await ChatServices.createConversationIntoDB(
        userId,
        user2Id
      );

      const conversationId = conversation.id;
      socket.join(conversationId);

      const unreadCount = await ChatServices.countUnreadMessages(
        userId,
        conversationId
      );
      const messages = await ChatServices.getMessagesByConversationIntoDB(
        userId,
        user2Id
      );

      socket.emit("unreadCountUpdate", {
        conversationId,
        messages,
        unreadCount,
      });
    });

    // === 2. Send Message ===
    socket.on(
      "sendMessage",
      async ({ conversationId, receiverId, content }) => {
        try {
          const senderId = user.id;
          const message = await ChatServices.createMessageIntoDB(
            conversationId,
            senderId,
            receiverId,
            content
          );

          // Broadcast message to conversation room
          io.to(conversationId).emit("messageSent", message);

          // Update unread count for receiver
          const unreadCount = await ChatServices.countUnreadMessages(
            receiverId,
            conversationId
          );
          const receiverSockets = userSocketMap.get(receiverId) || [];
          receiverSockets.forEach((socketId) => {
            io.to(socketId).emit("unreadCountUpdate", {
              conversationId,
              unreadCount,
            });
          });

          // Send push notification if offline
          await sendNotificationIfInactive(senderId, receiverId);
        } catch (err) {
          console.error("Error sending message:", err);
          socket.emit("error", {
            code: "SEND_MESSAGE_FAILED",
            message: "Failed to send message",
          });
        }
      }
    );

    // === 3. Mark as Read ===
    socket.on("markAsRead", async ({ conversationId }) => {
      const user = socket.data.user as JwtPayload;
      const userId = user.id;

      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        select: { user1Id: true, user2Id: true },
      });

      if (!conversation) return;

      await ChatServices.markMessagesAsRead(userId, conversationId);

      const socketId = getUserSocketIds(userId);

      io.to(socketId).emit("unreadCountUpdate", {
        conversationId,
        unreadCount: 0,
      });
    });

    // === 4. Disconnect ===
    socket.on("disconnect", () => {
      const userSockets = userSocketMap.get(userId);
      if (userSockets) {
        const remainingSockets = userSockets.filter((id) => id !== socket.id);
        if (remainingSockets.length === 0) userSocketMap.delete(userId);
        else userSocketMap.set(userId, remainingSockets);
      }
      broadcastOnlineUsers();
      console.log(`User ${userId} disconnected`);
    });
  });

  console.log("Socket.IO initialized");
};
