import { StatusCodes } from "http-status-codes";
import { prisma } from "../../../utils/prisma";
import ApiError from "../../error/ApiErrors";
import Stripe from "stripe";
import { stripe } from "../../../config/stripe";
import { createStripeCustomerAcc } from "../../helper/createStripeCustomerAcc";
import { createStripeConnectAccount } from "../../helper/createStripeConnectAccount";

const subscribeToPlanFromStripe = async (payload: {
  userId: string;
  paymentMethodId: string;
}) => {
  const findUser = await prisma.user.findUnique({
    where: {
      id: payload.userId,
    },
  });

  if (!findUser) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found!");
  }

  if (findUser?.customerId === null) {
    await createStripeCustomerAcc(findUser);
  }

  await stripe.paymentMethods.attach(payload.paymentMethodId, {
    customer: findUser.customerId as string,
  });

  await stripe.customers.update(findUser.customerId as string, {
    invoice_settings: {
      default_payment_method: payload.paymentMethodId,
    },
  });

  const priceid = process.env.STRIPE_PRICE_ID as string;

  const purchasePlan = (await stripe.subscriptions.create({
    customer: findUser.customerId as string,
    items: [{ price: priceid }],
  })) as any;

  const subscriptionItem = purchasePlan.items.data[0];

  const updateUserPlan = await prisma.subscriptionUser.upsert({
    where: {
      userId: payload.userId,
    },
    update: {
      subscriptionId: purchasePlan?.id,
      subscriptionStatus: purchasePlan.status,
      subscriptionStart: new Date(subscriptionItem.current_period_start * 1000),
      subscriptionEnd: new Date(subscriptionItem.current_period_end * 1000),
    },
    create: {
      userId: payload.userId,
      subscriptionId: purchasePlan?.id,
      subscriptionStatus: purchasePlan.status,
      subscriptionStart: new Date(subscriptionItem.current_period_start * 1000),
      subscriptionEnd: new Date(subscriptionItem.current_period_end * 1000),
    },
  });

  //   await prisma.user.update({
  //     where: {
  //       id: payload.userId,
  //     },
  //     data: {
  //       subscriptionPlan:
  //         findSubscription.name.split(" ")[0] == "Basic" ? "BASIC" : "PRO",
  //     },
  //   });

  return updateUserPlan;
};

const cancelSubscriptionFromStripe = async (payload: { userId: string }) => {
  const findUser = await prisma.user.findUnique({
    where: {
      id: payload.userId,
    },
    include: {
      subscriptionUser: true,
    },
  });

  if (!findUser) {
    throw new ApiError(StatusCodes.NOT_FOUND, "User not found!");
  }

  if (!findUser.subscriptionUser?.subscriptionId) {
    throw new ApiError(
      StatusCodes.BAD_REQUEST,
      "User does not have an active subscription!"
    );
  }

  // Cancel the subscription at Stripe
  const cancelledSubscription = await stripe.subscriptions.update(
    findUser.subscriptionUser?.subscriptionId as string,
    {
      cancel_at_period_end: true, // Cancels at end of current billing period
    }
  );

  // Update DB with status
  const updateUserSubscription = await prisma.subscriptionUser.update({
    where: {
      userId: payload.userId,
    },
    data: {
      subscriptionStatus: cancelledSubscription.status, // should be "active" but set to cancel later
    },
  });

  return cancelledSubscription;
};

export const paymentService = {
  subscribeToPlanFromStripe,
  cancelSubscriptionFromStripe,
};
