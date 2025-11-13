import { User } from "@prisma/client";
import ApiError from "../../error/ApiErrors";
import { StatusCodes } from "http-status-codes";
import { compare, hash } from "bcrypt";
import { OTPFn } from "../../helper/OTPFn";
import { prisma } from "../../../utils/prisma";
import { sendMessageToAdmin } from "../../helper/email/emails";
import { Request } from "express";

const createUserIntoDB = async (payload: User) => {
  const findUser = await prisma.user.findUnique({
    where: {
      email: payload.email,
    },
  });
  if (findUser && findUser?.isVerified) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "User already exists");
  }
  if (findUser && !findUser?.isVerified) {
    await OTPFn(payload.email);
    return;
  }

  const newPass = await hash(payload.password, 10);

  const result = await prisma.user.create({
    data: {
      ...payload,
      password: newPass,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  OTPFn(payload.email);
  return result;
};

const changePasswordIntoDB = async (id: string, payload: any) => {
  const findUser = await prisma.user.findUnique({
    where: {
      id,
    },
    select: {
      password: true,
    },
  });
  if (!findUser) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }
  const comparePassword = await compare(payload.oldPassword, findUser.password);
  if (!comparePassword) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, "Invalid password");
  }

  const hashedPassword = await hash(payload.newPassword, 10);
  const result = await prisma.user.update({
    where: {
      id,
    },
    data: {
      password: hashedPassword,
    },
  });
  return result;
};

const updateUserIntoDB = async (id: string, payload: any, image: any) => {
  const findUser = await prisma.user.findUnique({
    where: {
      id,
    },
  });
  if (!findUser) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  const result = await prisma.user.update({
    where: {
      id,
    },
    data: {
      ...payload,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return result;
};

const getMyProfile = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      yearlySalary: true,
      netPay: true,
      frequency: true,
      status: true,
    },
  });

  if (!user) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found");
  }

  return user;
};

const sendMessage = async (req: any) => {
  const body = req.body;
  await sendMessageToAdmin(body);
  return true;
};

const deleteUser = async (req: Request) => {
  const userId = req.user?.id;
  const result = await prisma.$transaction(async (tx) => {
    await tx.allowanceTransaction.deleteMany({
      where: { allowance: { userId } },
    });

    await tx.allowanceTracker.deleteMany({ where: { userId } });

    await tx.savingsTransaction.deleteMany({
      where: { savings: { userId } },
    });

    await tx.savingsTracker.deleteMany({ where: { userId } });

    await tx.creditCardTransaction.deleteMany({
      where: { creditCard: { userId } },
    });

    await tx.creditCardTracker.deleteMany({ where: { userId } });

    await tx.bill.deleteMany({
      where: { paycheck: { userId } },
    });

    await tx.paycheck.deleteMany({ where: { userId } });

    const user = await tx.user.delete({ where: { id: userId } });
    return user;
  });

  return true;
};

export const userServices = {
  createUserIntoDB,
  updateUserIntoDB,
  changePasswordIntoDB,
  getMyProfile,
  sendMessage,
  deleteUser,
};
