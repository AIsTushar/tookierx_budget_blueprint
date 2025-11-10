import { z } from "zod";

const createPaycheckSchema = z.object({
  amount: z
    .number({
      required_error: "Amount is required",
      invalid_type_error: "Amount must be a number",
    })
    .positive("Amount must be greater than 0"),

  paycheckDate: z
    .string({
      required_error: "Paycheck date is required",
    })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Paycheck date must be a valid date",
    }),

  frequency: z.enum(["WEEKLY", "BIWEEKLY"], {
    required_error: "Frequency is required",
    invalid_type_error: "Frequency must be one of WEEKLY, BIWEEKLY",
  }),

  coverageStart: z
    .string({
      required_error: "Coverage start date is required",
    })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Coverage start must be a valid date",
    }),

  coverageEnd: z
    .string({
      required_error: "Coverage end date is required",
    })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Coverage end must be a valid date",
    }),
});
const updatePaycheckSchema = z.object({
  amount: z
    .number({
      required_error: "Amount is required",
      invalid_type_error: "Amount must be a number",
    })
    .positive("Amount must be greater than 0")
    .optional(),

  paycheckDate: z
    .string({
      required_error: "Paycheck date is required",
    })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: "Paycheck date must be a valid date",
    })
    .optional(),

  frequency: z
    .enum(["WEEKLY", "BIWEEKLY"], {
      required_error: "Frequency is required",
      invalid_type_error: "Frequency must be one of WEEKLY, BIWEEKLY",
    })
    .optional(),

  allowanceAmount: z
    .number({
      required_error: "Allowance amount is required",
      invalid_type_error: "Allowance amount must be a number",
    })
    .positive("Allowance amount must be greater than 0")
    .optional(),
});

export const PaycheckValidations = {
  createPaycheckSchema,
  updatePaycheckSchema,
};
