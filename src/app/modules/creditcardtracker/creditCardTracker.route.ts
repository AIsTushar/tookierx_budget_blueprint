import { Router } from "express";
import { CreditCardTrackerControllers } from "./creditCardTracker.controller";
import auth from "../../middleware/auth";
import { Role } from "@prisma/client";
import { parseBodyMiddleware } from "../../middleware/parseBodyData";
import validateRequest from "../../middleware/validateRequest";
import { CreditCardTrackerValidations } from "./creditCardTracker.validation";
const router = Router();

router
  .route("/")
  .post(
    auth(),
    parseBodyMiddleware,
    validateRequest(CreditCardTrackerValidations.createCreditCardTrackerSchema),
    CreditCardTrackerControllers.createCreditCardTracker
  )
  .get(auth(), CreditCardTrackerControllers.getCreditCardTrackers);

router
  .route("/:id")
  .get(auth(), CreditCardTrackerControllers.getCreditCardTrackerById)
  .put(
    auth(),
    parseBodyMiddleware,
    validateRequest(CreditCardTrackerValidations.updateCreditCardTrackerSchema),
    CreditCardTrackerControllers.updateCreditCardTracker
  )
  .delete(auth(), CreditCardTrackerControllers.deleteCreditCardTracker);

router
  .route("/:id/transactions")
  .post(CreditCardTrackerControllers.addTransactionToCreditCard);

router
  .route("/:id/transactions/:id")
  .get(auth(), CreditCardTrackerControllers.getTransactionById)
  .put(auth(), CreditCardTrackerControllers.updateTransactionById)
  .delete(auth(), CreditCardTrackerControllers.deleteTransactionById);

export const CreditCardTrackerRoutes = router;
