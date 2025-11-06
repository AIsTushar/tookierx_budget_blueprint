import { Router } from "express";
import { userRoutes } from "../modules/user/user.routes";
import { authRoutes } from "../modules/auth/auth.routes";
import { paymentRoutes } from "../modules/payment/payment.routes";

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
];

routes.forEach((route) => router.use(route.path, route.component));
export default router;
