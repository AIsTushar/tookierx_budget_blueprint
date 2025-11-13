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
  const paycheck = await prisma.paycheck.findUnique({
    where: { id },
    include: paycheckInclude,
  });

  if (!paycheck) {
    throw new ApiError(StatusCodes.NOT_FOUND, "Paycheck not found");
  }

  return paycheck;
};

const getLatestPaycheck = async (req: Request) => {
  const userId = req.user?.id;
  const paycheck = await prisma.paycheck.findFirst({
    where: { userId },
    select: {
      id: true,
      paycheckDate: true,
      amount: true,
    },
    orderBy: { createdAt: "desc" },
  });
  return paycheck;
};

const getMonthlyOverview = async (req: Request) => {
  const userId = req.user?.id;
  const queryBuilder = new QueryBuilder(req.query, prisma.paycheck);
  const data = await queryBuilder
    .filter(paycheckFilterFields)
    .select(paycheckSelect)
    .fields()
    .rawFilter({ userId })
    .execute();

  const summaryMap = new Map<
    string,
    {
      year: number;
      month: string;
      totalPaycheck: number;
      totalBills: number;
      totalAllowance: number;
      totalSavings: number;
      billsPercentage?: number;
      allowancePercentage?: number;
      savingsPercentage?: number;
    }
  >();

  for (const item of data) {
    const key = `${item.year}-${item.month}`;
    const existing = summaryMap.get(key) || {
      year: item.year,
      month: item.month,
      totalPaycheck: 0,
      totalBills: 0,
      totalAllowance: 0,
      totalSavings: 0,
    };

    existing.totalPaycheck += Number(item.amount) || 0;
    existing.totalBills += Number(item.totalBills) || 0;
    existing.totalAllowance += Number(item.allowanceAmount) || 0;
    existing.totalSavings += Number(item.savingsAmount) || 0;

    summaryMap.set(key, existing);
  }

  const summary = Array.from(summaryMap.values())
    .map((item) => {
      const { totalPaycheck, totalBills, totalAllowance, totalSavings } = item;

      const billsPercentage =
        totalPaycheck > 0 ? (totalBills / totalPaycheck) * 100 : 0;
      const allowancePercentage =
        totalPaycheck > 0 ? (totalAllowance / totalPaycheck) * 100 : 0;
      const savingsPercentage =
        totalPaycheck > 0 ? (totalSavings / totalPaycheck) * 100 : 0;

      return {
        ...item,
        billsPercentage: Number(billsPercentage.toFixed(2)),
        allowancePercentage: Number(allowancePercentage.toFixed(2)),
        savingsPercentage: Number(savingsPercentage.toFixed(2)),
      };
    })
    .sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year;
      return a.month.localeCompare(b.month);
    });

  return { data: summary };
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

  const paycheckAmount = data.amount;

  if (paycheckAmount < existing.totalBills + existing.allowanceAmount) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "Paycheck amount must cover both your total bills and allowance."
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
      notes: data.notes ?? existing.notes,
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
  getMonthlyOverview,
  updatePaycheck,
  deletePaycheck,
  createPaycheck,
};
