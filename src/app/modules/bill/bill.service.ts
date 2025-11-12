import { Request } from "express";
import { prisma } from "../../../utils/prisma";
import QueryBuilder from "../../../utils/queryBuilder";
import {
  billFilterFields,
  billInclude,
  billNestedFilters,
  billRangeFilter,
  billSearchFields,
  billMultiSelectNestedArrayFilters,
  billArrayFilterFields,
  billSelect,
} from "./bill.constant";
import config from "../../../config";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../error/ApiErrors";
import { Prisma } from "@prisma/client";

const createBill = async (req: Request) => {
  const payload = req.body;
  const userId = req.user?.id;
  const paycheckId = payload.paycheckId;

  const paycheck = await prisma.paycheck.findUnique({
    where: { id: paycheckId },
  });

  if (!paycheck) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Paycheck not found");
  }

  if (paycheck.userId !== userId) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "You do not have permission to add a bill to this paycheck"
    );
  }

  const billDueDate = new Date(payload.dueDate);
  if (
    billDueDate < paycheck.coverageStart ||
    billDueDate > paycheck.coverageEnd
  ) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Bill due date must be within the paycheck coverage period"
    );
  }

  if (billDueDate < paycheck.paycheckDate) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Bill due date must be after paycheck date"
    );
  }

  const bill = await prisma.bill.create({ data: payload });
  const updatedTotalBills = paycheck.totalBills + payload.amount;

  const updatedSavings =
    (paycheck.amount ?? 0) -
    updatedTotalBills -
    (paycheck.allowanceAmount ?? 0);

  const updatedPaycheck = await prisma.paycheck.update({
    where: { id: paycheckId },
    data: {
      totalBills: updatedTotalBills,
    },
  });

  return { bill, updatedPaycheck };
};

const getBills = async (req: Request) => {
  const paycheckId = req.body.paycheckId;
  const queryBuilder = new QueryBuilder(req.query, prisma.bill);
  const results = await queryBuilder
    .filter(billFilterFields)
    .search(billSearchFields)
    .arrayFieldHasSome(billArrayFilterFields)
    .multiSelectNestedArray(billMultiSelectNestedArrayFilters)
    .nestedFilter(billNestedFilters)
    .sort()
    .paginate()
    // .select(billSelect)
    //.include(billInclude)
    .fields()
    .rawFilter({ paycheckId })
    .filterByRange(billRangeFilter)
    .execute();

  const meta = await queryBuilder.countTotal();
  return { data: results, meta };
};

const getBillById = async (id: string) => {
  return prisma.bill.findUnique({ where: { id } });
};

const updateBill = async (req: Request) => {
  const { id } = req.params;
  const payload = req.body;
  const userId = req.user?.id;

  // Find the existing bill
  const existingBill = await prisma.bill.findUnique({
    where: { id },
    include: { paycheck: true },
  });

  if (!existingBill) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Bill not found");
  }

  // Check ownership
  if (existingBill.paycheck.userId !== userId) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "You do not have permission to update this bill"
    );
  }

  // If dueDate is being updated, validate it
  if (payload.dueDate) {
    const newDueDate = new Date(payload.dueDate);
    if (
      newDueDate < existingBill.paycheck.coverageStart ||
      newDueDate > existingBill.paycheck.coverageEnd
    ) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Bill due date must be within the paycheck coverage period"
      );
    }
  }

  // Update the bill
  const updatedBill = await prisma.bill.update({
    where: { id },
    data: payload,
  });

  // Recalculate totalBills for the paycheck
  const allBills = await prisma.bill.findMany({
    where: { paycheckId: existingBill.paycheckId },
  });

  const updatedTotalBills = allBills.reduce((sum, b) => sum + b.amount, 0);

  // Update savingsTarget
  const paycheck = existingBill.paycheck;
  const updatedSavings =
    (paycheck.amount ?? 0) -
    updatedTotalBills -
    (paycheck.allowanceAmount ?? 0);

  const updatedPaycheck = await prisma.paycheck.update({
    where: { id: paycheck.id },
    data: {
      totalBills: updatedTotalBills,
    },
  });

  return { updatedBill, updatedPaycheck };
};

const deleteBill = async (req: Request) => {
  const { id } = req.params; // bill id
  const userId = req.user?.id;

  // Fetch the bill along with its paycheck
  const bill = await prisma.bill.findUnique({
    where: { id },
    include: {
      paycheck: true,
    },
  });

  if (!bill) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Bill not found");
  }

  if (bill.paycheck.userId !== userId) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "You do not have permission to delete this bill"
    );
  }

  // Delete the bill
  await prisma.bill.delete({
    where: { id },
  });

  // Update paycheck savings
  const paycheck = bill.paycheck;

  const allowance = paycheck.allowanceAmount ?? 0;
  const totalBills = paycheck.totalBills - bill.amount;
  const savingsTarget = paycheck.amount - totalBills - allowance;

  await prisma.paycheck.update({
    where: { id: paycheck.id },
    data: {
      totalBills,
    },
  });

  return { success: true, message: "Bill deleted successfully" };
};

export const BillServices = {
  getBills,
  getBillById,
  updateBill,
  deleteBill,
  createBill,
};
