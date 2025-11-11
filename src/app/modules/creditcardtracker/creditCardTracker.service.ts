import { Request } from "express";
import { prisma } from "../../../utils/prisma";
import QueryBuilder from "../../../utils/queryBuilder";
import {
  creditCardTrackerFilterFields,
  creditCardTrackerNestedFilters,
  creditCardTrackerRangeFilter,
  creditCardTrackerSearchFields,
  creditCardTrackerMultiSelectNestedArrayFilters,
  creditCardTrackerArrayFilterFields,
} from "./creditCardTracker.constant";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../error/ApiErrors";
import { Prisma } from "@prisma/client";
import { get } from "http";

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
    .arrayFieldHasSome(creditCardTrackerArrayFilterFields)
    .multiSelectNestedArray(creditCardTrackerMultiSelectNestedArrayFilters)
    .nestedFilter(creditCardTrackerNestedFilters)
    .sort()
    .paginate()
    .fields()
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
  const result = await prisma.creditCardTracker.findUnique({
    where: { id, userId },
  });

  if (!result) {
    throw new ApiError(StatusCodes.NOT_FOUND, `Credit Card not found!`);
  }

  return result;
};

const updateCreditCardTracker = async (req: Request) => {
  const { id } = req.params;
  const data = req.body;
  const user = req.user;

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
  if (existing.userId !== user?.id) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      `You do not have permission to update this credit card tracker`
    );
  }

  return prisma.creditCardTracker.update({
    where: whereClause,
    data: {
      ...data,
    },
  });
};

const deleteCreditCardTracker = async (req: Request) => {
  await prisma.creditCardTracker.delete({ where: { id: req.params.id } });
};

const addTransactionToCreditCard = async (req: Request) => {
  const creditCardId = req.params.id;
  const payload = req.body;

  const transaction = await prisma.creditCardTransaction.create({
    data: {
      ...payload,
      creditCardTrackerId: creditCardId,
    },
  });

  return transaction;
};

const getTransactionById = async (req: Request) => {
  const transactionId = req.params.id;

  return;
};

const updateTransactionById = async (req: Request) => {
  const transactionId = req.params.id;

  return;
};

const deleteTransactionById = async (req: Request) => {
  const transactionId = req.params.id;

  return;
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
};
