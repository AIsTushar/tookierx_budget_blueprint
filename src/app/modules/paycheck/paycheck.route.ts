import { Router } from "express";
import { PaycheckControllers } from "./paycheck.controller";
import auth from "../../middleware/auth";
import validateRequest from "../../middleware/validateRequest";
import { PaycheckValidations } from "./paycheck.validation";
const router = Router();

router
  .route("/")
  .post(
    auth(),
    validateRequest(PaycheckValidations.createPaycheckSchema),
    PaycheckControllers.createPaycheck
  )
  .get(auth(), PaycheckControllers.getPaychecks);

router.route("/latest").get(auth(), PaycheckControllers.getLatestPaycheck);
router
  .route("/monthly-overview")
  .get(auth(), PaycheckControllers.getMonthlyOverview);

router
  .route("/:id")
  .get(PaycheckControllers.getPaycheckById)
  .put(
    auth(),
    validateRequest(PaycheckValidations.updatePaycheckSchema),
    PaycheckControllers.updatePaycheck
  )
  .delete(PaycheckControllers.deletePaycheck);

export const PaycheckRoutes = router;
