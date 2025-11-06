import { Router } from "express";
import { userRoutes } from "../modules/user/user.routes";
import { authRoutes } from "../modules/auth/auth.routes";
import { ChatRoutes } from "../modules/chat/chat.Routes";

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
    path: "/chats",
    component: ChatRoutes,
  },
];

routes.forEach((route) => router.use(route.path, route.component));
export default router;
