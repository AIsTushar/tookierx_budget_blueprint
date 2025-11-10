import { Request } from "express";
import { prisma } from "../../../utils/prisma";
import QueryBuilder from "../../../utils/queryBuilder";
import {
  creditCardTrackerFilterFields,
  creditCardTrackerInclude,
  creditCardTrackerNestedFilters,
  creditCardTrackerRangeFilter,
  creditCardTrackerSearchFields,
  creditCardTrackerMultiSelectNestedArrayFilters,
  creditCardTrackerArrayFilterFields,
  creditCardTrackerSelect,
} from "./creditCardTracker.constant";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../error/ApiErrors";
import { Prisma } from "@prisma/client";

const createCreditCardTracker = async (req: Request) => {
  const userId = req.user?.id;
  const payload = req.body;
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
  const data = await queryBuilder
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

  // Compute total balances
  let totalBalance = 0;
  let totalClearedBalance = 0;

  const results = data.map((card: any) => {
    totalBalance += card.currentBalance || 0;
    totalClearedBalance += card.clearedBalance || 0;

    return {
      id: card.id,
      cardName: card.cardName,
      limit: card.limit,
      startingBalance: card.startingBalance,
      currentBalance: card.currentBalance,
      clearedBalance: card.clearedBalance,
    };
  });

  const meta = await queryBuilder.countTotal();

  return {
    data: { results, totalBalance, totalClearedBalance },
    meta,
  };
};

const getCreditCardTrackerById = async (id: string) => {
  return prisma.creditCardTracker.findUnique({ where: { id } });
};

const updateCreditCardTracker = async (req: Request) => {
  const { id } = req.params;
  const data = req.body;
  const user = req.user;
  const role = user?.role;

  const whereClause: Prisma.CreditCardTrackerWhereUniqueInput = {
    id,
    ...(role === "-----" ? { userId: user.id } : {}),
  };

  const existing = await prisma.creditCardTracker.findUnique({
    where: whereClause,
  });
  if (!existing) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      `CreditCardTracker not found with this id: ${id}`
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

export const CreditCardTrackerServices = {
  getCreditCardTrackers,
  getCreditCardTrackerById,
  updateCreditCardTracker,
  deleteCreditCardTracker,
  createCreditCardTracker,
};
