import { z } from "zod";

const createSavingsTrackerSchema = z.object({
  accountName: z.string().min(1, "Card name is required"),
  currentBalance: z
    .number()
    .min(0, "Current balance must be at least 0")
    .optional(),
});
const updateSavingsTrackerSchema = z.object({
  accountName: z.string().min(1, "Card name is required").optional(),
  currentBalance: z
    .number()
    .min(0, "Current balance must be at least 0")
    .optional(),
});

export const SavingsTrackerValidations = {
  createSavingsTrackerSchema,
  updateSavingsTrackerSchema,
};
