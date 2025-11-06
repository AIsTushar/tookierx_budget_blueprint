import { z } from 'zod';

const createChatRoomSchema = z.object({
  recipientId: z.string().nonempty('Recipient ID is required'),
});

const createGroupChatSchema = z.object({
  userIds: z
    .array(z.string().nonempty())
    .min(1, 'At least one user ID is required'),
  name: z.string().trim().nonempty('Group name is required'),
});

const addUserToGroupSchema = z.object({
  body: z.object({
    chatRoomId: z.string().nonempty('Chat room ID is required'),
    userId: z.string().nonempty('User ID is required'),
  }),
});

const removeUserFromGroupSchema = z.object({
  body: z.object({
    chatRoomId: z.string().nonempty('Chat room ID is required'),
    userId: z.string().nonempty('User ID is required'),
  }),
});

const sendMessageSchema = z.object({
  chatRoomId: z.string().nonempty('Chat room ID is required'),
  content: z.string().optional(),
});

export const ChatValidation = {
  createChatRoomSchema,
  createGroupChatSchema,
  addUserToGroupSchema,
  removeUserFromGroupSchema,
  sendMessageSchema,
};
