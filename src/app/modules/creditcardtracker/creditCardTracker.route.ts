import { Router } from "express";
import { CreditCardTrackerControllers } from "./creditCardTracker.controller";
import auth from "../../middleware/auth";
import { Role } from "@prisma/client";
import { parseBodyMiddleware } from "../../middleware/parseBodyData";;
import validateRequest from "../../middleware/validateRequest"
import { CreditCardTrackerValidations } from "./creditCardTracker.validation";
const router = Router();

router.route("/")
 	.post(
		auth(),
		parseBodyMiddleware,
		validateRequest(CreditCardTrackerValidations.createCreditCardTrackerSchema),
		CreditCardTrackerControllers.createCreditCardTracker
	)
  .get(CreditCardTrackerControllers.getCreditCardTrackers);

router
	.route("/:id")
	.get(CreditCardTrackerControllers.getCreditCardTrackerById)
	.put(
		auth(),
		parseBodyMiddleware,
		validateRequest(CreditCardTrackerValidations.updateCreditCardTrackerSchema),
	    CreditCardTrackerControllers.updateCreditCardTracker)
	.delete(CreditCardTrackerControllers.deleteCreditCardTracker);

export const CreditCardTrackerRoutes = router;