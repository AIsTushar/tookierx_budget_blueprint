import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../middleware/sendResponse";
import { PaycheckServices } from "./paycheck.service";

const createPaycheck = catchAsync(async (req, res) => {
  const result = await PaycheckServices.createPaycheck(req);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Paycheck created successfully",
    data: result,
  });
});

const getPaychecks = catchAsync(async (req, res) => {
  const result = await PaycheckServices.getPaychecks(req);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Paychecks retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getLatestPaycheck = catchAsync(async (req, res) => {
  const result = await PaycheckServices.getLatestPaycheck();
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Latest paycheck retrieved successfully",
    data: result,
  });
});

const getPaycheckById = catchAsync(async (req, res) => {
  const result = await PaycheckServices.getPaycheckById(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Paycheck retrieved successfully",
    data: result,
  });
});

const updatePaycheck = catchAsync(async (req, res) => {
  const result = await PaycheckServices.updatePaycheck(req);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Paycheck updated successfully",
    data: result,
  });
});

const deletePaycheck = catchAsync(async (req, res) => {
  await PaycheckServices.deletePaycheck(req);
  sendResponse(res, {
    statusCode: StatusCodes.NO_CONTENT,
    success: true,
    message: "Paycheck deleted successfully",
    data: null,
  });
});

export const PaycheckControllers = {
  getPaychecks,
  getPaycheckById,
  getLatestPaycheck,
  updatePaycheck,
  deletePaycheck,
  createPaycheck,
};
