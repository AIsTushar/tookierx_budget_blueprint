import { Router } from "express";
import { AllowanceTrackerControllers } from "./allowanceTracker.controller";
import auth from "../../middleware/auth";
import { Role } from "@prisma/client";
import { parseBodyMiddleware } from "../../middleware/parseBodyData";;
import validateRequest from "../../middleware/validateRequest"
import { AllowanceTrackerValidations } from "./allowanceTracker.validation";
const router = Router();

router.route("/")
 	.post(
		auth(),
		parseBodyMiddleware,
		validateRequest(AllowanceTrackerValidations.createAllowanceTrackerSchema),
		AllowanceTrackerControllers.createAllowanceTracker
	)
  .get(AllowanceTrackerControllers.getAllowanceTrackers);

router
	.route("/:id")
	.get(AllowanceTrackerControllers.getAllowanceTrackerById)
	.put(
		auth(),
		parseBodyMiddleware,
		validateRequest(AllowanceTrackerValidations.updateAllowanceTrackerSchema),
	    AllowanceTrackerControllers.updateAllowanceTracker)
	.delete(AllowanceTrackerControllers.deleteAllowanceTracker);

export const AllowanceTrackerRoutes = router;