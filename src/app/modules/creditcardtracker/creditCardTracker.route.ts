import { Router } from "express";
import { CreditCardTrackerControllers } from "./creditCardTracker.controller";
import auth from "../../middleware/auth";
import { parseBodyMiddleware } from "../../middleware/parseBodyData";
import validateRequest from "../../middleware/validateRequest";
import { CreditCardTrackerValidations } from "./creditCardTracker.validation";
const router = Router();

router
  .route("/")
  .post(
    auth(),
    validateRequest(CreditCardTrackerValidations.createCreditCardTrackerSchema),
    CreditCardTrackerControllers.createCreditCardTracker
  )
  .get(auth(), CreditCardTrackerControllers.getCreditCardTrackers);

router
  .route("/get-all-credit-card-transactions")
  .get(auth(), CreditCardTrackerControllers.getAllCreditCardTransactions);

router
  .route("/:id")
  .get(auth(), CreditCardTrackerControllers.getCreditCardTrackerById)
  .put(
    auth(),
    validateRequest(CreditCardTrackerValidations.updateCreditCardTrackerSchema),
    CreditCardTrackerControllers.updateCreditCardTracker
  )
  .delete(auth(), CreditCardTrackerControllers.deleteCreditCardTracker);

router
  .route("/:cardId/transactions")
  .post(
    auth(),
    validateRequest(
      CreditCardTrackerValidations.addTransactionToCreditCardSchema
    ),
    CreditCardTrackerControllers.addTransactionToCreditCard
  );

router
  .route("/:cardId/transactions/:transactionId")
  .get(auth(), CreditCardTrackerControllers.getTransactionById)
  .put(
    auth(),
    validateRequest(CreditCardTrackerValidations.updateCreditCardTrackerSchema),
    CreditCardTrackerControllers.updateTransactionById
  )
  .delete(auth(), CreditCardTrackerControllers.deleteTransactionById);

export const CreditCardTrackerRoutes = router;
