import { Router } from "express";
import { SavingsTrackerControllers } from "./savingsTracker.controller";
import auth from "../../middleware/auth";
import validateRequest from "../../middleware/validateRequest";
import { SavingsTrackerValidations } from "./savingsTracker.validation";
const router = Router();

router
  .route("/")
  .post(
    auth(),
    validateRequest(SavingsTrackerValidations.createSavingsTrackerSchema),
    SavingsTrackerControllers.createSavingsTracker
  )
  .get(auth(), SavingsTrackerControllers.getSavingsTrackers);

router
  .route("/get-all-savings-transactions")
  .get(auth(), SavingsTrackerControllers.getAllSavingsTransactions);

router
  .route("/:id")
  .get(auth(), SavingsTrackerControllers.getSavingsTrackerById)
  .put(
    auth(),
    validateRequest(SavingsTrackerValidations.updateSavingsTrackerSchema),
    SavingsTrackerControllers.updateSavingsTracker
  )
  .delete(auth(), SavingsTrackerControllers.deleteSavingsTracker);

router
  .route("/:accountId/transactions")
  .post(
    auth(),
    validateRequest(
      SavingsTrackerValidations.addTransactionToSavingsTrackerSchema
    ),
    SavingsTrackerControllers.addTransactionToSavingsTracker
  );

router
  .route("/:accountId/transactions/:transactionId")
  .get(auth(), SavingsTrackerControllers.getTransactionById)
  .put(
    auth(),
    validateRequest(SavingsTrackerValidations.updateTransactionByIdSchema),
    SavingsTrackerControllers.updateTransactionById
  )
  .delete(auth(), SavingsTrackerControllers.deleteTransactionById);

export const SavingsTrackerRoutes = router;
