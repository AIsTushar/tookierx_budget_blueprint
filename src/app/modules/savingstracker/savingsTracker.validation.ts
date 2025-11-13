import { date, z } from "zod";

const createSavingsTrackerSchema = z.object({
  accountName: z.string().min(1, "Saving account name is required"),
  currentBalance: z
    .number()
    .min(0, "Current balance must be at least 0")
    .optional(),
});
const updateSavingsTrackerSchema = z.object({
  accountName: z.string().min(1, "Saving account name is required").optional(),
});
const addTransactionToSavingsTrackerSchema = z.object({
  amount: z.number().min(0.01, "Amount must be at least 0.01"),
  type: z.enum(["CREDIT", "DEBIT"], {
    required_error: "Transaction type is required",
  }),
  description: z.string().optional(),
  date: z.string().optional(),
  isCleared: z.boolean().optional(),
});

const updateTransactionByIdSchema = z.object({
  amount: z.number().min(0.01, "Amount must be at least 0.01").optional(),
  type: z
    .enum(["CREDIT", "DEBIT"], {
      required_error: "Transaction type is required",
    })
    .optional(),
  description: z.string().optional(),
  date: z.string().optional(),
  isCleared: z.boolean().optional(),
});

export const SavingsTrackerValidations = {
  createSavingsTrackerSchema,
  updateSavingsTrackerSchema,
  addTransactionToSavingsTrackerSchema,
  updateTransactionByIdSchema,
};
