import { Router } from "express";
import validateRequest from "../../middleware/validateRequest";
import { userController } from "./user.controller";
import { UserValidation } from "./user.validation";
import auth from "../../middleware/auth";
import { Role } from "@prisma/client";

const route = Router();

route.post(
  "/create",
  validateRequest(UserValidation.createValidation),
  userController.createUserController
);

route.put(
  "/change-password",
  auth(Role.USER || Role.ADMIN),
  validateRequest(UserValidation.changePasswordValidation),
  userController.changePasswordController
);

route.put(
  "/me",
  auth(Role.USER || Role.ADMIN),
  validateRequest(UserValidation.updateValidation),
  userController.updateUserController
);
route.get("/me", auth(), userController.getMyProfileController);

route.post("/send-message", auth(), userController.sendMessageController);
route.delete("/delete", auth(), userController.deleteUserController);

export const userRoutes = route;
