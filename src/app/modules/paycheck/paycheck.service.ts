import { Request } from "express";
import { prisma } from "../../../utils/prisma";
import QueryBuilder from "../../../utils/queryBuilder";
import {
  paycheckFilterFields,
  paycheckInclude,
  paycheckNestedFilters,
  paycheckRangeFilter,
  paycheckSearchFields,
  paycheckMultiSelectNestedArrayFilters,
  paycheckArrayFilterFields,
  paycheckSelect,
} from "./paycheck.constant";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../error/ApiErrors";
import { Prisma } from "@prisma/client";

const createPaycheck = async (req: Request) => {
  const payload = req.body;
  const userId = req.user?.id;
  if (userId) {
    payload.userId = userId;
  }
  // ckeck if coverageEnd is after coverageStart
  const coverageStart = new Date(payload.coverageStart);
  const coverageEnd = new Date(payload.coverageEnd);
  if (coverageEnd <= coverageStart) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Coverage end date must be after coverage start date"
    );
  }

  // check if user has another paycheck with overlapping coverage period
  const overlappingPaycheck = await prisma.paycheck.findFirst({
    where: {
      userId: userId,
      AND: [
        {
          coverageStart: {
            lte: coverageEnd,
          },
        },
        {
          coverageEnd: {
            gte: coverageStart,
          },
        },
      ],
    },
  });
  if (overlappingPaycheck) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Overlapping coverage period with another paycheck"
    );
  }
  //prevent duplicate paycheck for same coverage period
  const existingPaycheck = await prisma.paycheck.findUnique({
    where: {
      userId_coverageStart_coverageEnd: {
        userId: userId,
        coverageStart: coverageStart,
        coverageEnd: coverageEnd,
      },
    },
  });

  if (existingPaycheck) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Paycheck already exists for this coverage period"
    );
  }

  const paycheck = await prisma.paycheck.create({ data: payload });
  return paycheck;
};

const getPaychecks = async (req: Request) => {
  const userId = req.user?.id;
  const queryBuilder = new QueryBuilder(req.query, prisma.paycheck);
  const results = await queryBuilder
    .filter(paycheckFilterFields)
    .search(paycheckSearchFields)
    .paginate()
    .select(paycheckSelect)
    .fields()
    .rawFilter({ userId })
    .filterByRange(paycheckRangeFilter)
    .execute();

  const meta = await queryBuilder.countTotal();
  return { data: results, meta };
};

const getPaycheckById = async (id: string) => {
  return prisma.paycheck.findUnique({
    where: { id },
    include: paycheckInclude,
  });
};

const getLatestPaycheck = async () => {
  const paycheck = await prisma.paycheck.findFirst({
    orderBy: { createdAt: "desc" },
  });
  return paycheck;
};

const updatePaycheck = async (req: Request) => {
  const { id } = req.params;
  const data = req.body;
  const user = req.user;
  const role = user?.role;

  const whereClause: Prisma.PaycheckWhereUniqueInput = {
    id,
    ...(role === "-----" ? { userId: user.id } : {}),
  };

  const existing = await prisma.paycheck.findUnique({ where: whereClause });
  if (!existing) {
    throw new ApiError(
      StatusCodes.NOT_FOUND,
      `Paycheck not found with this id: ${id}`
    );
  }

  return prisma.paycheck.update({
    where: whereClause,
    data: {
      ...data,
    },
  });
};

const deletePaycheck = async (req: Request) => {
  await prisma.paycheck.delete({ where: { id: req.params.id } });
};

export const PaycheckServices = {
  getPaychecks,
  getPaycheckById,
  getLatestPaycheck,
  updatePaycheck,
  deletePaycheck,
  createPaycheck,
};
