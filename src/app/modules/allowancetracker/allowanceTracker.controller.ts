import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../middleware/sendResponse";
import { AllowanceTrackerServices } from "./allowanceTracker.service";

const getAllowanceTrackers = catchAsync(async (req, res) => {
  const result = await AllowanceTrackerServices.getAllowanceTrackers(req);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "AllowanceTrackers retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getLatestAllowanceTracker = catchAsync(async (req, res) => {
  const result = await AllowanceTrackerServices.getLatestAllowanceTracker(req);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Latest AllowanceTracker retrieved successfully",
    data: result,
  });
});

const getAllowanceTrackerById = catchAsync(async (req, res) => {
  const result = await AllowanceTrackerServices.getAllowanceTrackerById(
    req.params.id
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "AllowanceTracker retrieved successfully",
    data: result,
  });
});

const updateAllowanceTracker = catchAsync(async (req, res) => {
  const result = await AllowanceTrackerServices.updateAllowanceTracker(req);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "AllowanceTracker updated successfully",
    data: result,
  });
});

const addTransactionToAllowanceTracker = catchAsync(async (req, res) => {
  const result =
    await AllowanceTrackerServices.addTransactionToAllowanceTracker(req);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Transaction added to AllowanceTracker successfully",
    data: result,
  });
});

const getTransactionById = catchAsync(async (req, res) => {
  const result = await AllowanceTrackerServices.getTransactionById(
    req.params.transactionId
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Transaction retrieved successfully",
    data: result,
  });
});

const updateTransactionById = catchAsync(async (req, res) => {
  const result = await AllowanceTrackerServices.updateTransactionById(req);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Transaction updated successfully",
    data: result,
  });
});

const deleteTransactionById = catchAsync(async (req, res) => {
  await AllowanceTrackerServices.deleteTransactionById(req);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Transaction deleted successfully",
    data: null,
  });
});

const getAllAllowanceTransactions = catchAsync(async (req, res) => {
  const result = await AllowanceTrackerServices.getAllAllowanceTransactions(
    req
  );
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Transactions retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

export const AllowanceTrackerControllers = {
  getAllowanceTrackers,
  getLatestAllowanceTracker,
  getAllowanceTrackerById,
  updateAllowanceTracker,
  addTransactionToAllowanceTracker,
  getTransactionById,
  updateTransactionById,
  deleteTransactionById,
  getAllAllowanceTransactions,
};
