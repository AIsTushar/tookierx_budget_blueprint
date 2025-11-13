import { Request } from "express";
import { prisma } from "../../../utils/prisma";
import QueryBuilder from "../../../utils/queryBuilder";
import {
  savingsTrackerFilterFields,
  savingsTrackerRangeFilter,
  savingsTrackerSearchFields,
  savingsTrackerSelect,
} from "./savingsTracker.constant";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../error/ApiErrors";
import { Prisma } from "@prisma/client";

const createSavingsTracker = async (req: Request) => {
  const userId = req.user?.id;
  const payload = req.body;

  if (userId) {
    payload.userId = userId;
  }
  payload.clearedBalance = payload.currentBalance || 0;

  const savingsTracker = await prisma.savingsTracker.create({ data: payload });

  return savingsTracker;
};

const getSavingsTrackers = async (req: Request) => {
  const userId = req.user?.id;
  const queryBuilder = new QueryBuilder(req.query, prisma.savingsTracker);
  const results = await queryBuilder
    .filter(savingsTrackerFilterFields)
    .search(savingsTrackerSearchFields)
    .sort()
    .paginate()
    .select(savingsTrackerSelect)
    .rawFilter({ userId })
    .fields()
    .filterByRange(savingsTrackerRangeFilter)
    .execute();

  const meta = await queryBuilder.countTotal();

  const [total, clearedBalance] = await Promise.all([
    prisma.savingsTracker.aggregate({
      where: { userId },
      _sum: { currentBalance: true },
    }),

    prisma.savingsTracker.aggregate({
      where: { userId },
      _sum: { clearedBalance: true },
    }),
  ]);

  const totalBalance = total._sum.currentBalance || 0;
  const totalClearedBalance = clearedBalance._sum.clearedBalance || 0;
  return { data: { results, totalBalance, totalClearedBalance }, meta };
};

const getSavingsTrackerById = async (id: string) => {
  const result = await prisma.savingsTracker.findUnique({
    where: { id },
    select: {
      id: true,
      accountName: true,
      currentBalance: true,
      clearedBalance: true,
      transactions: {
        select: {
          id: true,
          type: true,
          amount: true,
          description: true,
          date: true,
          isCleared: true,
        },
      },
    },
  });

  if (!result) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      `SavingsTracker not found with this id: ${id}`
    );
  }

  return result;
};

const updateSavingsTracker = async (req: Request) => {
  const { id } = req.params;
  const userId = req.user?.id;
  const { accountName } = req.body;

  const whereClause: Prisma.SavingsTrackerWhereUniqueInput = {
    id,
  };

  const existing = await prisma.savingsTracker.findUnique({
    where: whereClause,
  });

  if (!existing) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      `SavingsTracker not found with this id: ${id}`
    );
  }

  if (existing.userId !== userId) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "You do not have permission to update this savings tracker"
    );
  }

  const result = await prisma.savingsTracker.update({
    where: whereClause,
    data: {
      accountName,
    },
  });

  return result;
};

const deleteSavingsTracker = async (req: Request) => {
  const userId = req.user?.id;
  const accountId = req.params.id;
  const existing = await prisma.savingsTracker.findUnique({
    where: { id: req.params.id },
  });

  if (!existing) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      `SavingsTracker not found with this id: ${req.params.id}`
    );
  }

  if (existing.userId !== userId) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "You do not have permission to delete this savings tracker"
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.savingsTransaction.deleteMany({
      where: { savingsId: accountId },
    });
    await tx.savingsTracker.delete({
      where: { id: req.params.id },
    });
  });
};

// Transaction Services
const addTransactionToSavingsTracker = async (req: Request) => {
  const userId = req.user?.id;
  const { accountId } = req.params;
  const { type, amount, description, date, isCleared } = req.body;

  const account = await prisma.savingsTracker.findUnique({
    where: {
      id: accountId,
    },
  });

  if (!account) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Savings account not found");
  }

  if (account.userId !== userId) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "You do not have access to this savings account"
    );
  }

  const transaction = await prisma.savingsTransaction.create({
    data: {
      savingsId: accountId,
      type,
      amount,
      description,
      date: date ? new Date(date) : undefined,
      isCleared,
    },
  });

  const balanceChange = type === "DEBIT" ? -amount : amount;

  const updateData: any = {
    clearedBalance: { increment: balanceChange },
  };

  if (isCleared) {
    updateData.currentBalance = { increment: balanceChange };
  }

  await prisma.savingsTracker.update({
    where: { id: accountId },
    data: updateData,
  });

  return transaction;
};
const getTransactionById = async (req: Request) => {
  const userId = req.user?.id;
  const { accountId, transactionId } = req.params;

  const account = await prisma.savingsTracker.findUnique({
    where: {
      id: accountId,
    },
  });

  if (!account) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Savings Account not found");
  }

  if (account.userId !== userId) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "You do not have access to this savings account"
    );
  }

  const transaction = await prisma.savingsTransaction.findUnique({
    where: {
      id: transactionId,
    },
  });

  if (!transaction || transaction.savingsId !== accountId) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Transaction not found");
  }

  return transaction;
};

const updateTransactionById = async (req: Request) => {
  const userId = req.user?.id;
  const { transactionId } = req.params;
  const { type, amount, description, date, isCleared } = req.body;

  const transaction = await prisma.savingsTransaction.findUnique({
    where: { id: transactionId },
    include: {
      savings: true,
    },
  });

  if (!transaction) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      `Transaction not found with id: ${transactionId}`
    );
  }

  if (transaction.savings.userId !== userId) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "You do not have access to this transaction"
    );
  }

  const oldBalanceChange =
    transaction.type === "DEBIT" ? -transaction.amount : transaction.amount;

  let currentBalanceChange = 0;
  let clearedBalanceChange = 0;

  clearedBalanceChange -= oldBalanceChange;
  if (transaction.isCleared) currentBalanceChange -= oldBalanceChange;

  const newType = type ?? transaction.type;
  const newAmount = amount ?? transaction.amount;
  const newIsCleared =
    typeof isCleared === "boolean" ? isCleared : transaction.isCleared;

  const newBalanceChange = newType === "DEBIT" ? -newAmount : newAmount;
  clearedBalanceChange += newBalanceChange; // Always
  if (newIsCleared) currentBalanceChange += newBalanceChange;

  const updatedTransaction = await prisma.creditCardTransaction.update({
    where: { id: transactionId },
    data: {
      type: newType,
      amount: newAmount,
      description,
      date: date ? new Date(date) : transaction.date,
      isCleared: newIsCleared,
    },
  });

  await prisma.creditCardTracker.update({
    where: { id: transaction.savingsId },
    data: {
      currentBalance: { increment: currentBalanceChange },
      clearedBalance: { increment: clearedBalanceChange },
    },
  });

  return updatedTransaction;
};
const deleteTransactionById = async (req: Request) => {
  const userId = req.user?.id;
  const { accountId, transactionId } = req.params;

  const savingsAccount = await prisma.savingsTracker.findUnique({
    where: { id: accountId },
  });

  if (!savingsAccount) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Credit card not found");
  }

  if (savingsAccount.userId !== userId) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "You do not own this savings account"
    );
  }

  const transaction = await prisma.savingsTransaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Transaction not found");
  }

  if (transaction.savingsId !== savingsAccount.id) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "This transaction does not belong to the specified savings account"
    );
  }

  const balanceChange =
    transaction.type === "DEBIT" ? transaction.amount : -transaction.amount;

  let currentBalanceChange = 0;
  let clearedBalanceChange = 0;

  clearedBalanceChange += balanceChange;

  if (transaction.isCleared) {
    currentBalanceChange += balanceChange;
  }

  await prisma.$transaction([
    prisma.creditCardTransaction.delete({
      where: { id: transactionId },
    }),
    prisma.creditCardTracker.update({
      where: { id: accountId },
      data: {
        currentBalance: { increment: currentBalanceChange },
        clearedBalance: { increment: clearedBalanceChange },
      },
    }),
  ]);

  return transaction;
};

export const SavingsTrackerServices = {
  getSavingsTrackers,
  getSavingsTrackerById,
  updateSavingsTracker,
  deleteSavingsTracker,
  createSavingsTracker,

  addTransactionToSavingsTracker,
  getTransactionById,
  updateTransactionById,
  deleteTransactionById,
};
