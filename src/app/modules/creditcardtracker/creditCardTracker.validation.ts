import { z } from "zod";

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

export const CreditCardTrackerValidations = {
  createCreditCardTrackerSchema,
  updateCreditCardTrackerSchema,
};
