import { Router } from "express";
import { BillControllers } from "./bill.controller";
import auth from "../../middleware/auth";
import { Role } from "@prisma/client";
import { parseBodyMiddleware } from "../../middleware/parseBodyData";;
import validateRequest from "../../middleware/validateRequest"
import { BillValidations } from "./bill.validation";
const router = Router();

router.route("/")
 	.post(
		auth(),
		parseBodyMiddleware,
		validateRequest(BillValidations.createBillSchema),
		BillControllers.createBill
	)
  .get(BillControllers.getBills);

router
	.route("/:id")
	.get(BillControllers.getBillById)
	.put(
		auth(),
		parseBodyMiddleware,
		validateRequest(BillValidations.updateBillSchema),
	    BillControllers.updateBill)
	.delete(BillControllers.deleteBill);

export const BillRoutes = router;