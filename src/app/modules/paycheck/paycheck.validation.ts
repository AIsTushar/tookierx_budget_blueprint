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

  coverageStart: z.string({
    required_error: "Coverage start date is required",
  }),

  coverageEnd: z.string({
    required_error: "Coverage end date is required",
  }),

  month: z.enum(
    [
      "JANUARY",
      "FEBRUARY",
      "MARCH",
      "APRIL",
      "MAY",
      "JUNE",
      "JULY",
      "AUGUST",
      "SEPTEMBER",
      "OCTOBER",
      "NOVEMBER",
      "DECEMBER",
    ],
    {
      required_error: "Month is required",
      invalid_type_error:
        "Month must be one of JANUARY, FEBRUARY, MARCH, APRIL, MAY, JUNE, JULY, AUGUST, SEPTEMBER, OCTOBER, NOVEMBER, DECEMBER",
    }
  ),

  year: z
    .number({
      required_error: "Year is required",
      invalid_type_error: "Year must be a number",
    })
    .int("Year must be an integer"),
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

  coverageStart: z
    .string({
      required_error: "Coverage start date is required",
    })
    .optional(),

  coverageEnd: z
    .string({
      required_error: "Coverage end date is required",
    })
    .optional(),

  month: z
    .enum(
      [
        "JANUARY",
        "FEBRUARY",
        "MARCH",
        "APRIL",
        "MAY",
        "JUNE",
        "JULY",
        "AUGUST",
        "SEPTEMBER",
        "OCTOBER",
        "NOVEMBER",
        "DECEMBER",
      ],
      {
        required_error: "Month is required",
        invalid_type_error:
          "Month must be one of JANUARY, FEBRUARY, MARCH, APRIL, MAY, JUNE, JULY, AUGUST, SEPTEMBER, OCTOBER, NOVEMBER, DECEMBER",
      }
    )
    .optional(),

  year: z
    .number({
      required_error: "Year is required",
      invalid_type_error: "Year must be a number",
    })
    .int("Year must be an integer")
    .optional(),

  notes: z.string().optional(),
});

export const PaycheckValidations = {
  createPaycheckSchema,
  updatePaycheckSchema,
};
