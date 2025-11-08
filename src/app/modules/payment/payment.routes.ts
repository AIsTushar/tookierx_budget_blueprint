import { Router } from "express";
import auth from "../../middleware/auth";
import { Role } from "@prisma/client";
import { paymentController } from "./payment.controller";

const route = Router();

route.post("/subscribe", auth(), paymentController.subscribeController);
route.post(
  "/cancel-subscription",
  auth(),
  paymentController.cancelSubscriptionController
);

export const paymentRoutes = route;
