import { Request } from "express";
import { prisma } from "../../../utils/prisma";
import QueryBuilder from "../../../utils/queryBuilder";
import {
  creditCardTrackerFilterFields,
  creditCardTrackerRangeFilter,
  creditCardTrackerSearchFields,
  creditCardTrackerSelect,
  creditCardTransactionFilterFields,
} from "./creditCardTracker.constant";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../error/ApiErrors";
import { Prisma } from "@prisma/client";

const createCreditCardTracker = async (req: Request) => {
  const userId = req.user?.id;
  const payload = req.body;
  payload.clearedBalance = payload.currentBalance || 0;

  if (!userId) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "User not authenticated");
  }

  if (userId) {
    payload.userId = userId;
  }

  const creditCardTracker = await prisma.creditCardTracker.create({
    data: payload,
  });

  return creditCardTracker;
};

const getCreditCardTrackers = async (req: Request) => {
  const userId = req.user?.id;

  const queryBuilder = new QueryBuilder(req.query, prisma.creditCardTracker);
  const results = await queryBuilder
    .filter(creditCardTrackerFilterFields)
    .search(creditCardTrackerSearchFields)
    .sort()
    .paginate()
    .select(creditCardTrackerSelect)
    .filterByRange(creditCardTrackerRangeFilter)
    .rawFilter({ userId })
    .execute();

  const meta = await queryBuilder.countTotal();

  const [total, clearedBalance] = await Promise.all([
    prisma.creditCardTracker.aggregate({
      where: { userId },
      _sum: { currentBalance: true },
    }),
    prisma.creditCardTracker.aggregate({
      where: { userId },
      _sum: { clearedBalance: true },
    }),
  ]);

  const totalBalance = total._sum.currentBalance || 0;
  const totalClearedBalance = clearedBalance._sum.clearedBalance || 0;

  return {
    data: { results, totalBalance, totalClearedBalance },
    meta,
  };
};

const getCreditCardTrackerById = async (req: Request) => {
  const { id } = req.params;
  const userId = req.user.id;

  const { type, isCleared } = req.query;

  const transactionFilter: any = {};

  if (type) {
    transactionFilter.type = type.toString().toUpperCase(); // CREDIT / DEBIT
  }

  if (isCleared !== undefined) {
    transactionFilter.isCleared = isCleared === "true";
  }

  const result = await prisma.creditCardTracker.findUnique({
    where: { id, userId },
    select: {
      id: true,
      cardName: true,
      currentBalance: true,
      clearedBalance: true,
      transactions: {
        where: transactionFilter,
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
    throw new ApiError(StatusCodes.NOT_FOUND, `Credit Card not found!`);
  }

  return result;
};

const updateCreditCardTracker = async (req: Request) => {
  const { id } = req.params;
  const { cardName } = req.body;
  const userId = req.user.id;

  const whereClause: Prisma.CreditCardTrackerWhereUniqueInput = {
    id,
  };

  const existing = await prisma.creditCardTracker.findUnique({
    where: whereClause,
  });
  if (!existing) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      `Credit Card not found with this id: ${id}`
    );
  }
  if (existing.userId !== userId) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      `You do not have permission to update this credit card tracker`
    );
  }

  const result = await prisma.creditCardTracker.update({
    where: whereClause,
    data: {
      cardName,
    },
  });

  return result;
};

const deleteCreditCardTracker = async (req: Request) => {
  const userId = req.user?.id;
  const existing = await prisma.creditCardTracker.findUnique({
    where: { id: req.params.id },
  });
  if (!existing) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      `Credit Card not found with this id: ${req.params.id}`
    );
  }
  if (existing.userId !== userId) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      `You do not have permission to delete this credit card tracker`
    );
  }

  const result = await prisma.$transaction([
    prisma.creditCardTransaction.deleteMany({
      where: { creditCardId: req.params.id },
    }),
    prisma.creditCardTracker.delete({ where: { id: req.params.id } }),
  ]);

  return result;
};

const addTransactionToCreditCard = async (req: Request) => {
  const userId = req.user?.id;
  const { cardId } = req.params;
  const { type, amount, description, date, isCleared } = req.body;

  const card = await prisma.creditCardTracker.findUnique({
    where: {
      id: cardId,
    },
  });

  if (!card) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Credit Card not found");
  }

  if (card.userId !== userId) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "You do not have access to this credit card"
    );
  }

  const transactions = await prisma.creditCardTransaction.create({
    data: {
      creditCardId: cardId,
      type,
      amount,
      description,
      date: date ? new Date(date) : new Date(),
      isCleared: isCleared ?? false,
    },
  });

  const balanceChange = type === "DEBIT" ? -amount : amount;

  const updateData: any = {
    clearedBalance: { increment: balanceChange },
  };

  if (isCleared) {
    updateData.currentBalance = { increment: balanceChange };
  }

  await prisma.creditCardTracker.update({
    where: { id: cardId },
    data: updateData,
  });

  return transactions;
};

const getTransactionById = async (req: Request) => {
  const transactionId = req.params.transactionId;
  const cardId = req.params.cardId;

  const transaction = await prisma.creditCardTransaction.findUnique({
    where: { id: transactionId, creditCardId: cardId },
    select: {
      id: true,
      type: true,
      amount: true,
      description: true,
      date: true,
      isCleared: true,
    },
  });

  if (!transaction) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      `Transaction not found with id: ${transactionId}`
    );
  }

  return transaction;
};

const updateTransactionById = async (req: Request) => {
  const userId = req.user?.id;
  const { transactionId } = req.params;
  const { type, amount, description, date, isCleared } = req.body;

  const transaction = await prisma.creditCardTransaction.findUnique({
    where: { id: transactionId },
    include: {
      creditCard: true,
    },
  });

  if (!transaction) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      `Transaction not found with id: ${transactionId}`
    );
  }

  if (transaction.creditCard.userId !== userId) {
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
    where: { id: transaction.creditCardId },
    data: {
      currentBalance: { increment: currentBalanceChange },
      clearedBalance: { increment: clearedBalanceChange },
    },
  });

  return updatedTransaction;
};

const deleteTransactionById = async (req: Request) => {
  const userId = req.user?.id;
  const { cardId, transactionId } = req.params;

  const card = await prisma.creditCardTracker.findUnique({
    where: { id: cardId },
  });

  if (!card) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Credit card not found");
  }

  if (card.userId !== userId) {
    throw new ApiError(StatusCodes.FORBIDDEN, "You do not own this card");
  }

  const transaction = await prisma.creditCardTransaction.findUnique({
    where: { id: transactionId },
  });

  if (!transaction) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Transaction not found");
  }

  if (transaction.creditCardId !== card.id) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "This transaction does not belong to the specified card"
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
      where: { id: cardId },
      data: {
        currentBalance: { increment: currentBalanceChange },
        clearedBalance: { increment: clearedBalanceChange },
      },
    }),
  ]);

  return transaction;
};

const getAllCreditCardTransactions = async (req: Request) => {
  const userId = req.user?.id;

  const queryBuilder = new QueryBuilder(
    req.query,
    prisma.creditCardTransaction,
    {
      creditCard: {
        userId: userId,
      },
    }
  );

  const result = await queryBuilder
    .filter(creditCardTransactionFilterFields)
    .paginate()
    .execute();

  const meta = await queryBuilder.countTotal();

  return { data: result, meta };
};

export const CreditCardTrackerServices = {
  getCreditCardTrackers,
  getCreditCardTrackerById,
  updateCreditCardTracker,
  deleteCreditCardTracker,
  createCreditCardTracker,

  addTransactionToCreditCard,
  getTransactionById,
  updateTransactionById,
  deleteTransactionById,
  getAllCreditCardTransactions,
};
