import { Request } from "express";
import { prisma } from "../../../utils/prisma";
import QueryBuilder from "../../../utils/queryBuilder";
import {
  savingsTrackerFilterFields,
  savingsTrackerInclude,
  savingsTrackerNestedFilters,
  savingsTrackerRangeFilter,
  savingsTrackerSearchFields,
  savingsTrackerMultiSelectNestedArrayFilters,
  savingsTrackerArrayFilterFields,
  savingsTrackerSelect,
} from "./savingsTracker.constant";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../error/ApiErrors";
import { Prisma } from "@prisma/client";

const createSavingsTracker = async (req: Request) => {
  const payload = req.body;

  const savingsTracker = await prisma.savingsTracker.create({ data: payload });

  return savingsTracker;
};

const getSavingsTrackers = async (req: Request) => {
  const queryBuilder = new QueryBuilder(req.query, prisma.savingsTracker);
  const results = await queryBuilder
    .filter(savingsTrackerFilterFields)
    .search(savingsTrackerSearchFields)
    .arrayFieldHasSome(savingsTrackerArrayFilterFields)
    .multiSelectNestedArray(savingsTrackerMultiSelectNestedArrayFilters)
    .nestedFilter(savingsTrackerNestedFilters)
    .sort()
    .paginate()
    .select(savingsTrackerSelect)
    //.include(savingstrackerInclude)
    .fields()
    .filterByRange(savingsTrackerRangeFilter)
    .execute();

  const meta = await queryBuilder.countTotal();
  return { data: results, meta };
};

const getSavingsTrackerById = async (id: string) => {
  return prisma.savingsTracker.findUnique({ where: { id } });
};

const updateSavingsTracker = async (req: Request) => {
  const { id } = req.params;
  const data = req.body;
  const user = req.user;
  const role = user?.role;

  const whereClause: Prisma.SavingsTrackerWhereUniqueInput = {
    id,
    ...(role === "-----" ? { userId: user.id } : {}),
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

  return prisma.savingsTracker.update({
    where: whereClause,
    data: {
      ...data,
    },
  });
};

const deleteSavingsTracker = async (req: Request) => {
  await prisma.savingsTracker.delete({ where: { id: req.params.id } });
};

export const SavingsTrackerServices = {
  getSavingsTrackers,
  getSavingsTrackerById,
  updateSavingsTracker,
  deleteSavingsTracker,
  createSavingsTracker,
};
