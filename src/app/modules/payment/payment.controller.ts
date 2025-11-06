import { Request, Response } from "express";
import catchAsync from "../../../shared/catchAsync";
import { paymentService } from "./payment.service";
import sendResponse from "../../middleware/sendResponse";
import { StatusCodes } from "http-status-codes";

const subscribeController = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const body = { userId, ...req.body };
  const result = await paymentService.subscribeToPlanFromStripe({
    ...body,
  });
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Subscription created successfully",
    data: result,
  });
});

export const paymentController = { subscribeController };
