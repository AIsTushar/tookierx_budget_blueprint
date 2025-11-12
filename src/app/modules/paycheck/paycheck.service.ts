import { Request } from "express";
import { prisma } from "../../../utils/prisma";
import QueryBuilder from "../../../utils/queryBuilder";
import {
  paycheckFilterFields,
  paycheckInclude,
  paycheckRangeFilter,
  paycheckSearchFields,
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

  const result = await prisma.$transaction(async (tx) => {
    const paycheck = await tx.paycheck.create({
      data: {
        userId,
        amount: payload.amount,
        month: payload.month,
        year: payload.year,
        paycheckDate: new Date(payload.paycheckDate),
        coverageStart,
        coverageEnd,
        frequency: payload.frequency,
        savingsAmount: payload.amount,
      },
    });

    await tx.allowanceTracker.create({
      data: {
        userId,
        paycheckId: paycheck.id,
        currentBalance: 0,
        clearedBalance: 0,
      },
    });

    return paycheck;
  });
  return result;
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
  });

  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Paycheck not found");
  }

  if (existing.userId !== userId) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "You do not have permission to update this paycheck"
    );
  }

  const coverageStart = data.coverageStart
    ? new Date(data.coverageStart)
    : existing.coverageStart;
  const coverageEnd = data.coverageEnd
    ? new Date(data.coverageEnd)
    : existing.coverageEnd;

  if (coverageEnd <= coverageStart) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Coverage end date must be after coverage start date"
    );
  }

  const overlapping = await prisma.paycheck.findFirst({
    where: {
      userId,
      id: { not: id },
      AND: [
        { coverageStart: { lte: coverageEnd } },
        { coverageEnd: { gte: coverageStart } },
      ],
    },
  });

  if (overlapping) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Overlapping coverage period with another paycheck"
    );
  }

  const updated = await prisma.paycheck.update({
    where: { id },
    data: {
      amount: data.amount ?? existing.amount,
      paycheckDate: data.paycheckDate
        ? new Date(data.paycheckDate)
        : existing.paycheckDate,
      frequency: data.frequency ?? existing.frequency,
      coverageStart,
      coverageEnd,
      month: data.month ?? existing.month,
      year: data.year ?? existing.year,
    },
  });

  return updated;
};

const deletePaycheck = async (req: Request) => {
  const { id } = req.params;
  const userId = req.user?.id;

  const existing = await prisma.paycheck.findUnique({
    where: { id },
    include: {
      allowanceTracker: {
        select: { id: true },
      },
      bills: {
        select: { id: true },
      },
    },
  });

  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Paycheck not found");
  }

  if (existing.userId !== userId) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "You do not have permission to delete this paycheck"
    );
  }

  if (!existing) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Paycheck not found");
  }

  if (existing.userId !== userId) {
    throw new ApiError(
      StatusCodes.FORBIDDEN,
      "You do not have permission to delete this paycheck"
    );
  }
  await prisma.$transaction(async (tx) => {
    if (existing.allowanceTracker) {
      await tx.allowanceTransaction.deleteMany({
        where: { allowanceId: existing.allowanceTracker.id },
      });
      await tx.allowanceTracker.delete({
        where: { id: existing.allowanceTracker.id },
      });
    }

    if (existing.bills && existing.bills.length > 0) {
      const billIds = existing.bills.map((bill) => bill.id);
      await tx.bill.deleteMany({
        where: { id: { in: billIds } },
      });
    }

    await tx.paycheck.delete({
      where: { id },
    });
  });

  return true;
};

export const PaycheckServices = {
  getPaychecks,
  getPaycheckById,
  getLatestPaycheck,
  updatePaycheck,
  deletePaycheck,
  createPaycheck,
};
