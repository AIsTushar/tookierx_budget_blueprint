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
  const userId = req.user?.id;

  const existing = await prisma.paycheck.findUnique({
    where: { id },
    include: { allowanceTracker: true },
  });

  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Paycheck not found");
  }

  let allowanceData = null;

  if (data.allowanceAmount !== undefined) {
    const prevAmount = existing.allowanceTracker?.allowanceAmount || 0;
    const newAmount = data.allowanceAmount;

    allowanceData = await prisma.allowanceTracker.upsert({
      where: { paycheckId: id },
      create: {
        userId,
        paycheckId: id,
        allowanceAmount: newAmount,
        currentBalance: newAmount,
      },
      update: {
        allowanceAmount: newAmount,
        currentBalance: {
          increment: newAmount - prevAmount,
        },
      },
    });
  }

  const totalBills = data.totalBills ?? existing.totalBills ?? 0;
  const netIncome = data.amount ?? existing.amount ?? 0;
  const allowance =
    data.allowanceAmount ?? existing.allowanceTracker?.allowanceAmount ?? 0;

  const savingsTarget = netIncome - totalBills - allowance;

  const updated = await prisma.paycheck.update({
    where: { id },
    data: {
      ...data,
      allowanceAmount: allowance,
      savingsTarget,
    },
    include: { allowanceTracker: true },
  });

  return { updated };
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
