import { Request } from "express";
import { prisma } from "../../../utils/prisma";
import QueryBuilder from "../../../utils/queryBuilder";
import {
  billFilterFields,
  billNestedFilters,
  billRangeFilter,
  billSearchFields,
  billMultiSelectNestedArrayFilters,
  billArrayFilterFields,
} from "./bill.constant";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../error/ApiErrors";

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
      "Paycheck date cannot be after your bill due dates. Please adjust to ensure bills are paid on time"
    );
  }

  if (
    paycheck.totalBills + payload.amount + paycheck.allowanceAmount >
    paycheck.amount
  ) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Total bills exceeds allowed paycheck amount. Please adjust bill amount or paycheck amount"
    );
  }

  const bill = await prisma.bill.create({
    data: {
      paycheckId,
      name: payload.name,
      amount: payload.amount,
      dueDate: new Date(payload.dueDate),
      notes: payload.notes,
    },
  });

  const updatedTotalBills = paycheck.totalBills + payload.amount;

  const updatedSavings =
    (paycheck.amount ?? 0) -
    updatedTotalBills -
    (paycheck.allowanceAmount ?? 0);

  await prisma.paycheck.update({
    where: { id: paycheckId },
    data: {
      totalBills: updatedTotalBills,
      savingsAmount: updatedSavings,
    },
  });

  return bill;
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

  // Find the existing bill with paycheck info
  const existingBill = await prisma.bill.findUnique({
    where: { id },
    include: { paycheck: true },
  });

  if (!existingBill) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Bill not found");
  }

  // Check user ownership
  if (existingBill.paycheck.userId !== userId) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "You do not have permission to update this bill"
    );
  }

  const paycheck = existingBill.paycheck;

  // Validate dueDate if provided
  if (payload.dueDate) {
    const newDueDate = new Date(payload.dueDate);
    if (
      newDueDate < paycheck.coverageStart ||
      newDueDate > paycheck.coverageEnd
    ) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Bill due date must be within the paycheck coverage period"
      );
    }

    if (newDueDate < paycheck.paycheckDate) {
      throw new ApiError(
        StatusCodes.BAD_REQUEST,
        "Paycheck date cannot be after your bill due date. Please adjust to ensure bills are paid on time."
      );
    }
  }

  // Handle amount update validation before saving
  let newAmount = existingBill.amount;
  if (payload.amount !== undefined) {
    newAmount = payload.amount;
  }

  // Calculate total bills if amount changes
  const otherBills = await prisma.bill.findMany({
    where: {
      paycheckId: paycheck.id,
      id: { not: id },
    },
  });

  const otherBillsTotal = otherBills.reduce((sum, b) => sum + b.amount, 0);
  const updatedTotalBills = otherBillsTotal + newAmount;

  // Prevent exceeding paycheck limit
  if (
    updatedTotalBills + (paycheck.allowanceAmount ?? 0) >
    (paycheck.amount ?? 0)
  ) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Total bills and allowance cannot exceed the paycheck amount. Please adjust bill or paycheck values."
    );
  }

  // Update bill
  const updatedBill = await prisma.bill.update({
    where: { id },
    data: payload,
  });

  // Update paycheck (totalBills + savingsAmount)
  const updatedSavings =
    (paycheck.amount ?? 0) -
    updatedTotalBills -
    (paycheck.allowanceAmount ?? 0);

  const updatedPaycheck = await prisma.paycheck.update({
    where: { id: paycheck.id },
    data: {
      totalBills: updatedTotalBills,
      savingsAmount: updatedSavings,
    },
  });

  return updatedBill;
};

const deleteBill = async (req: Request) => {
  const { id } = req.params;
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
  const savingsAmount = paycheck.amount - totalBills - allowance;

  await prisma.paycheck.update({
    where: { id: paycheck.id },
    data: {
      totalBills,
      savingsAmount,
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
