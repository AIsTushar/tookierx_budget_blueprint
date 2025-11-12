import { Request } from "express";
import { prisma } from "../../../utils/prisma";
import QueryBuilder from "../../../utils/queryBuilder";
import {
  allowanceTrackerFilterFields,
  allowanceTrackerInclude,
  allowanceTrackerNestedFilters,
  allowanceTrackerRangeFilter,
  allowanceTrackerSearchFields,
  allowanceTrackerMultiSelectNestedArrayFilters,
  allowanceTrackerArrayFilterFields,
  allowanceTrackerSelect,
} from "./allowanceTracker.constant";

import { StatusCodes } from "http-status-codes";
import ApiError from "../../error/ApiErrors";
import { Prisma } from "@prisma/client";

const recalculateAllowanceBalances = async (allowanceId: string) => {
  const allowance = await prisma.allowanceTracker.findUnique({
    where: { id: allowanceId },
    include: { transactions: true },
  });

  if (!allowance) return;

  const totalSpent = allowance.transactions.reduce(
    (sum, txn) => sum + txn.amount,
    0
  );
  const totalCleared = allowance.transactions
    .filter((txn) => txn.isCleared)
    .reduce((sum, txn) => sum + txn.amount, 0);

  const newCurrentBalance = allowance.assignedAmount - totalSpent;
  const newClearedBalance = allowance.assignedAmount - totalCleared;

  await prisma.allowanceTracker.update({
    where: { id: allowanceId },
    data: {
      currentBalance: newCurrentBalance,
      clearedBalance: newClearedBalance,
    },
  });
};

const getAllowanceTrackers = async (req: Request) => {
  const userId = req.user?.id;
  const queryBuilder = new QueryBuilder(req.query, prisma.allowanceTracker);
  const results = await queryBuilder
    .search(allowanceTrackerSearchFields)
    .filter()
    .paginate()
    .sort()
    .rawFilter({ userId })
    .execute();

  const meta = await queryBuilder.countTotal();

  return { data: results, meta };
};

const getLatestAllowanceTracker = async (req: Request) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Unauthorized");
  }

  const allowanceTracker = await prisma.allowanceTracker.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return allowanceTracker;
};

const getAllowanceTrackerById = async (id: string) => {
  return prisma.allowanceTracker.findUnique({ where: { id } });
};

const updateAllowanceTracker = async (req: Request) => {
  const { id } = req.params;
  const data = req.body;
  const userId = req.user.id;

  const whereClause: Prisma.AllowanceTrackerWhereUniqueInput = {
    id,
  };

  const existing = await prisma.allowanceTracker.findUnique({
    where: whereClause,
    include: { paycheck: true, transactions: true },
  });

  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, `AllowanceTracker not found`);
  }

  if (existing.userId !== userId) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "You do not have permission to update this allowance"
    );
  }

  const paycheck = existing.paycheck;
  const newAssignedAmount = data.assignedAmount ?? existing.assignedAmount;
  const totalBills = paycheck.totalBills ?? 0;
  const paycheckAmount = paycheck.amount ?? 0;

  const totalSpent = existing.transactions.reduce(
    (sum, txn) => sum + txn.amount,
    0
  );
  const totalCleared = existing.transactions
    .filter((txn) => txn.isCleared)
    .reduce((sum, txn) => sum + txn.amount, 0);

  if (newAssignedAmount < totalSpent) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      `Assigned allowance amount (${newAssignedAmount}) cannot be less than the total spent amount (${totalSpent}). Please review your transactions.`
    );
  }

  if (newAssignedAmount + totalBills > paycheckAmount) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Allowance amount and total bills cannot exceed the paycheck amount. Please adjust your allowance or bills."
    );
  }

  const newCurrentBalance = newAssignedAmount - totalSpent;
  const newClearedBalance = newAssignedAmount - totalCleared;

  const updatedTracker = await prisma.allowanceTracker.update({
    where: { id },
    data: {
      ...data,
      assignedAmount: newAssignedAmount,
      currentBalance: newCurrentBalance,
      clearedBalance: newClearedBalance,
    },
  });

  const updatedSavings = paycheckAmount - totalBills - newAssignedAmount;

  const updatedPaycheck = await prisma.paycheck.update({
    where: { id: paycheck.id },
    data: {
      allowanceAmount: newAssignedAmount,
      savingsAmount: updatedSavings,
    },
  });

  return updatedTracker;
};

// Allowance Tracker Transactions Services

const addTransactionToAllowanceTracker = async (req: Request) => {
  const { id } = req.params;
  const userId = req.user.id;
  const data = req.body;

  const allowance = await prisma.allowanceTracker.findUnique({
    where: { id },
    include: { paycheck: true, transactions: true },
  });

  if (!allowance) {
    throw new ApiError(StatusCodes.NOT_FOUND, "AllowanceTracker not found");
  }

  if (allowance.userId !== userId) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "You do not have permission to add a transaction here"
    );
  }

  const totalSpent = allowance.transactions.reduce(
    (sum, txn) => sum + txn.amount,
    0
  );

  const newTotal = totalSpent + data.amount;

  if (newTotal > allowance.assignedAmount) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Transaction exceeds your assigned allowance amount"
    );
  }

  const transaction = await prisma.allowanceTransaction.create({
    data: {
      ...data,
      allowanceId: id,
    },
  });

  await recalculateAllowanceBalances(id);

  return transaction;
};
const getTransactionById = async (id: string) => {
  const transaction = await prisma.allowanceTransaction.findUnique({
    where: { id },
  });

  if (!transaction) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Transaction not found");
  }

  return transaction;
};

const updateTransactionById = async (req: Request) => {
  const { id } = req.params;
  const userId = req.user.id;
  const data = req.body;

  const existing = await prisma.allowanceTransaction.findUnique({
    where: { id },
    include: { allowance: true },
  });

  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Transaction not found");
  }

  if (existing.allowance.userId !== userId) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "You do not have permission to update this transaction"
    );
  }

  const updatedTransaction = await prisma.allowanceTransaction.update({
    where: { id },
    data,
  });

  await recalculateAllowanceBalances(existing.allowanceId);

  return updatedTransaction;
};
const deleteTransactionById = async (req: Request) => {
  const { id } = req.params; // transactionId
  const userId = req.user.id;

  const existing = await prisma.allowanceTransaction.findUnique({
    where: { id },
    include: { allowance: true },
  });

  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Transaction not found");
  }

  if (existing.allowance.userId !== userId) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "You do not have permission to delete this transaction"
    );
  }

  await prisma.allowanceTransaction.delete({
    where: { id },
  });

  await recalculateAllowanceBalances(existing.allowanceId);

  return true;
};

export const AllowanceTrackerServices = {
  getAllowanceTrackers,
  getLatestAllowanceTracker,
  getAllowanceTrackerById,
  updateAllowanceTracker,
  addTransactionToAllowanceTracker,
  getTransactionById,
  updateTransactionById,
  deleteTransactionById,
};
