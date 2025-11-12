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
    include: { transactions: true },
    orderBy: { createdAt: "desc" },
  });
  return allowanceTracker;
};

const getAllowanceTrackerById = async (id: string) => {
  return prisma.allowanceTracker.findUnique({
    where: { id },
    include: { transactions: true },
  });
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
  const { id } = req.params; // allowanceTrackerId
  const userId = req.user.id;
  const data = req.body;

  const allowance = await prisma.allowanceTracker.findUnique({
    where: { id },
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

  let { currentBalance, clearedBalance } = allowance;
  const amount = Number(data.amount);
  const isCleared = Boolean(data.isCleared);
  const type = data.type as "DEBIT" | "CREDIT";

  // ✅ Apply logic correctly
  if (type === "DEBIT") {
    if (isCleared) currentBalance -= amount;
    clearedBalance -= amount; // affects future projection regardless of clearance
  } else if (type === "CREDIT") {
    if (isCleared) currentBalance += amount;
    clearedBalance += amount;
  }

  // ✅ Validation
  if (currentBalance < 0) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Insufficient allowance: cleared transaction exceeds available balance"
    );
  }
  if (clearedBalance < 0) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Insufficient allowance: projected (cleared) balance would be negative"
    );
  }

  // ✅ Save both
  const [transaction] = await prisma.$transaction([
    prisma.allowanceTransaction.create({
      data: {
        ...data,
        allowanceId: id,
      },
    }),
    prisma.allowanceTracker.update({
      where: { id },
      data: {
        currentBalance,
        clearedBalance,
      },
    }),
  ]);

  return transaction;
};

// Get transaction
const getTransactionById = async (id: string) => {
  const transaction = await prisma.allowanceTransaction.findUnique({
    where: { id },
  });
  if (!transaction)
    throw new ApiError(StatusCodes.NOT_FOUND, "Transaction not found");
  return transaction;
};

// Update transaction
const updateTransactionById = async (req: Request) => {
  const { transactionId: id } = req.params;
  const userId = req.user.id;
  const { amount, transactionType, isCleared } = req.body;

  // 1️⃣ Fetch the transaction and related tracker
  const transaction = await prisma.allowanceTransaction.findUnique({
    where: { id },
    include: { allowance: true },
  });

  if (!transaction) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Transaction not found");
  }

  const tracker = transaction.allowance;

  // 2️⃣ Check ownership
  if (tracker.userId !== userId) {
    throw new ApiError(StatusCodes.FORBIDDEN, "Unauthorized");
  }

  let newCurrentBalance = tracker.currentBalance;
  let newClearedBalance = tracker.clearedBalance;

  // 3️⃣ Rollback the old transaction effect
  if (transaction.isCleared) {
    // Only affect currentBalance if transaction was cleared
    if (transaction.type === "DEBIT") {
      newCurrentBalance += transaction.amount;
    } else {
      newCurrentBalance -= transaction.amount;
    }
  }

  // Always rollback clearedBalance (even if old transaction was not cleared)
  if (transaction.type === "DEBIT") {
    newClearedBalance += transaction.amount;
  } else {
    newClearedBalance -= transaction.amount;
  }

  // 4️⃣ Apply new transaction effect
  const newType = transactionType ?? transaction.type;
  const newAmount = amount ?? transaction.amount;
  const newIsCleared = isCleared ?? transaction.isCleared;

  if (newIsCleared) {
    // Affect currentBalance only if isCleared is true
    if (newType === "DEBIT") {
      newCurrentBalance -= newAmount;
    } else {
      newCurrentBalance += newAmount;
    }
  }

  // Always affect clearedBalance
  if (newType === "DEBIT") {
    newClearedBalance -= newAmount;
  } else {
    newClearedBalance += newAmount;
  }

  // 5️⃣ Validate currentBalance
  if (newCurrentBalance < 0) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Insufficient allowance balance"
    );
  }

  // 6️⃣ Run transactional update
  const [updatedTransaction, updatedTracker] = await prisma.$transaction([
    prisma.allowanceTransaction.update({
      where: { id },
      data: {
        amount: newAmount,
        type: newType,
        isCleared: newIsCleared,
      },
    }),
    prisma.allowanceTracker.update({
      where: { id: tracker.id },
      data: {
        currentBalance: newCurrentBalance,
        clearedBalance: newClearedBalance,
      },
    }),
  ]);

  return updatedTransaction;
};

// Delete transaction
const deleteTransactionById = async (req: Request) => {
  const { transactionId: id } = req.params;
  const userId = req.user.id;

  const existing = await prisma.allowanceTransaction.findUnique({
    where: { id },
  });
  if (!existing)
    throw new ApiError(StatusCodes.NOT_FOUND, "Transaction not found");

  const tracker = await prisma.allowanceTracker.findFirst({
    where: { id: existing.allowanceId, userId },
  });
  if (!tracker)
    throw new ApiError(StatusCodes.NOT_FOUND, "AllowanceTracker not found");

  let { currentBalance, clearedBalance } = tracker;

  if (existing.type === "DEBIT") {
    if (existing.isCleared) currentBalance += existing.amount;
    clearedBalance += existing.amount;
  } else {
    if (existing.isCleared) currentBalance -= existing.amount;
    clearedBalance -= existing.amount;
  }

  await prisma.$transaction([
    prisma.allowanceTransaction.delete({ where: { id } }),
    prisma.allowanceTracker.update({
      where: { id: tracker.id },
      data: { currentBalance, clearedBalance },
    }),
  ]);

  return { message: "Transaction deleted successfully" };
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
