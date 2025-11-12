import { Router } from "express";
import { userRoutes } from "../modules/user/user.routes";
import { authRoutes } from "../modules/auth/auth.routes";
import { paymentRoutes } from "../modules/payment/payment.routes";
import { PaycheckRoutes } from "../modules/paycheck/paycheck.route";
import { BillRoutes } from "../modules/bill/bill.route";
import { CreditCardTrackerRoutes } from "../modules/creditcardtracker/creditCardTracker.route";
import { AllowanceTrackerRoutes } from "../modules/allowancetracker/allowanceTracker.route";

const router = Router();
const routes = [
  {
    path: "/user",
    component: userRoutes,
  },
  {
    path: "/auth",
    component: authRoutes,
  },
  {
    path: "/payments",
    component: paymentRoutes,
  },
  {
    path: "/paychecks",
    component: PaycheckRoutes,
  },
  {
    path: "/bills",
    component: BillRoutes,
  },
  {
    path: "/allowance",
    component: AllowanceTrackerRoutes,
  },
  {
    path: "/credit-cards",
    component: CreditCardTrackerRoutes,
  },
];

routes.forEach((route) => router.use(route.path, route.component));
export default router;
