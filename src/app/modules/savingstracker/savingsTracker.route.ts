import { Router } from "express";
import { SavingsTrackerControllers } from "./savingsTracker.controller";
import auth from "../../middleware/auth";
import { Role } from "@prisma/client";
import { parseBodyMiddleware } from "../../middleware/parseBodyData";
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
  .route("/:id")
  .get(auth(), SavingsTrackerControllers.getSavingsTrackerById)
  .put(
    auth(),
    validateRequest(SavingsTrackerValidations.updateSavingsTrackerSchema),
    SavingsTrackerControllers.updateSavingsTracker
  )
  .delete(auth(), SavingsTrackerControllers.deleteSavingsTracker);

export const SavingsTrackerRoutes = router;
