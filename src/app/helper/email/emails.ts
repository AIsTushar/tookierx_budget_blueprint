import { stripe } from "../../../config/stripe";
import { prisma } from "../../../utils/prisma";
import { transporter, ADMIN_EMAIL, COMPANY_NAME } from "./config";
import { generateAccountLinkEmail, otpEmailTemplate } from "./emailTemplates";

export const sendEmailFn = async (email: string, otp: number) => {
  const findUser = await prisma.user.findUnique({
    where: { email },
  });

  const userName = findUser?.name || "User";

  const htmlContent = otpEmailTemplate(userName, otp, COMPANY_NAME);

  const mailOptions = {
    from: `"no-reply" <${ADMIN_EMAIL}>`,
    to: email,
    subject: "Your OTP Code",
    html: htmlContent,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP email sent to ${email}`);
  } catch (error) {
    console.error("Error sending OTP email:", error);
    throw new Error("Failed to send OTP email.");
  }
};

export const StripeConnectAccEmail = async (user: any) => {
  const accountLink = await stripe.accountLinks.create({
    account: user.connectAccountId as string,
    refresh_url: "https://success-page-xi.vercel.app/not-success",
    return_url: "https://success-page-xi.vercel.app/success",
    type: "account_onboarding",
  });

  const htmlContent = generateAccountLinkEmail(user.name, accountLink.url);

  const mailOptions = {
    from: `"no-reply" <${ADMIN_EMAIL}>`,
    to: user.email,
    subject: "Complete Your Stripe Onboarding",
    html: htmlContent,
  };

  await transporter.sendMail(mailOptions);
};
