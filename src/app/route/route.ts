import { Router } from "express";
import { userRoutes } from "../modules/user/user.routes";
import { authRoutes } from "../modules/auth/auth.routes";
import { paymentRoutes } from "../modules/payment/payment.routes";
import { PaycheckRoutes } from "../modules/paycheck/paycheck.route";
import { BillRoutes } from "../modules/bill/bill.route";

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
];

routes.forEach((route) => router.use(route.path, route.component));
export default router;
