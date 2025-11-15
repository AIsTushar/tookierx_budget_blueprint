import { PrismaClient } from "@prisma/client";
import crypto from "crypto";
import { sendEmailFn } from "./email/emails";

const prisma = new PrismaClient();

export const OTPFn = async (email: string) => {
  const OTP_EXPIRY_TIME = 5 * 60 * 1000; // OTP valid for 5 minutes
  const expiry = new Date(Date.now() + OTP_EXPIRY_TIME);
  const otp = crypto.randomInt(100000, 999999);
  await sendEmailFn(email, otp);

  const updateOTP = await prisma.otp.upsert({
    where: {
      email: email,
    },
    update: {
      otp: otp,
      expiry: expiry,
    },
    create: {
      email: email,
      otp: otp,
      expiry: expiry,
    },
  });

  return updateOTP;
};
