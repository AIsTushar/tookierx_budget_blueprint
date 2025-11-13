import { z } from "zod";

const createBillSchema = z.object({
  paycheckId: z.string().min(1, "Paycheck ID is required"),
  name: z.string().min(1, "Bill name is required"),
  amount: z
    .number({
      required_error: "Amount is required",
      invalid_type_error: "Amount must be a number",
    })
    .positive("Amount must be greater than 0"),
  dueDate: z.string({
    required_error: "Due date is required",
  }),

  notes: z.string().optional(),
});
const updateBillSchema = z.object({
  name: z.string().min(1, "Bill name is required").optional(),
  amount: z
    .number({
      required_error: "Amount is required",
      invalid_type_error: "Amount must be a number",
    })
    .positive("Amount must be greater than 0")
    .optional(),
  dueDate: z
    .string({
      required_error: "Due date is required",
    })
    .optional(),
  notes: z.string().optional(),
});

export const BillValidations = {
  createBillSchema,
  updateBillSchema,
};
