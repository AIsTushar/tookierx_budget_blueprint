import { date, z } from "zod";

const createCreditCardTrackerSchema = z.object({
  cardName: z.string().min(1, "Card name is required"),
  currentBalance: z
    .number()
    .min(0, "Current balance must be at least 0")
    .optional(),
});
const updateCreditCardTrackerSchema = z.object({
  cardName: z.string().min(1, "Card name is required").optional(),
  currentBalance: z
    .number()
    .min(0, "Current balance must be at least 0")
    .optional(),
});

const addTransactionToCreditCardSchema = z.object({
  type: z.enum(["CREDIT", "DEBIT"], {
    required_error: "Transaction type is required",
  }),
  amount: z.number().min(0.01, "Amount must be at least 0.01"),
  description: z.string().min(1, "Description is required").optional(),
  date: z.string().optional(),
  isCleared: z.boolean().optional(),
});

const updateTransactionByIdSchema = z.object({
  type: z
    .enum(["CREDIT", "DEBIT"], {
      required_error: "Transaction type is required",
    })
    .optional(),
  amount: z.number().min(0.01, "Amount must be at least 0.01").optional(),
  description: z.string().min(1, "Description is required").optional(),
  date: z.string().optional(),
  isCleared: z.boolean().optional(),
});

export const CreditCardTrackerValidations = {
  createCreditCardTrackerSchema,
  updateCreditCardTrackerSchema,
  addTransactionToCreditCardSchema,
  updateTransactionByIdSchema,
};
