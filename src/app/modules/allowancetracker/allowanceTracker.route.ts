import { Router } from "express";
import { AllowanceTrackerControllers } from "./allowanceTracker.controller";
import auth from "../../middleware/auth";
import validateRequest from "../../middleware/validateRequest";
import { AllowanceTrackerValidations } from "./allowanceTracker.validation";
const router = Router();

router.route("/").get(auth(), AllowanceTrackerControllers.getAllowanceTrackers);
router
  .route("/latest")
  .get(auth(), AllowanceTrackerControllers.getLatestAllowanceTracker);

router
  .route("/:id")
  .get(auth(), AllowanceTrackerControllers.getAllowanceTrackerById)
  .put(
    auth(),
    validateRequest(AllowanceTrackerValidations.updateAllowanceTrackerSchema),
    AllowanceTrackerControllers.updateAllowanceTracker
  );

router
  .route("/:id/transactions")
  .post(auth(), AllowanceTrackerControllers.addTransactionToAllowanceTracker);

router
  .route("/:id/transactions/:transactionId")
  .get(auth(), AllowanceTrackerControllers.getTransactionById)
  .put(auth(), AllowanceTrackerControllers.updateTransactionById)
  .delete(auth(), AllowanceTrackerControllers.deleteTransactionById);

export const AllowanceTrackerRoutes = router;
