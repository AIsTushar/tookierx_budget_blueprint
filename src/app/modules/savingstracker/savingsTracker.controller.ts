import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../middleware/sendResponse";
import { SavingsTrackerServices } from "./savingsTracker.service";

const createSavingsTracker = catchAsync(async (req, res) => {
  const result = await SavingsTrackerServices.createSavingsTracker(req);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "SavingsTracker created successfully",
    data: result,
  });
});
const getSavingsTrackers = catchAsync(async (req, res) => {
  const result = await SavingsTrackerServices.getSavingsTrackers(req);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "SavingsTrackers retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getSavingsTrackerById = catchAsync(async (req, res) => {
  const result = await SavingsTrackerServices.getSavingsTrackerById(req);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "SavingsTracker retrieved successfully",
    data: result,
  });
});

const updateSavingsTracker = catchAsync(async (req, res) => {
  const result = await SavingsTrackerServices.updateSavingsTracker(req);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "SavingsTracker updated successfully",
    data: result,
  });
});

const deleteSavingsTracker = catchAsync(async (req, res) => {
  await SavingsTrackerServices.deleteSavingsTracker(req);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "SavingsTracker deleted successfully",
    data: null,
  });
});

// Transaction Controllers
const addTransactionToSavingsTracker = catchAsync(async (req, res) => {
  const result = await SavingsTrackerServices.addTransactionToSavingsTracker(
    req
  );
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Transaction added to SavingsTracker successfully",
    data: result,
  });
});

const getTransactionById = catchAsync(async (req, res) => {
  const result = await SavingsTrackerServices.getTransactionById(req);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Transaction retrieved successfully",
    data: result,
  });
});

const updateTransactionById = catchAsync(async (req, res) => {
  const result = await SavingsTrackerServices.updateTransactionById(req);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Transaction updated successfully",
    data: result,
  });
});

const deleteTransactionById = catchAsync(async (req, res) => {
  await SavingsTrackerServices.deleteTransactionById(req);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Transaction deleted successfully",
    data: null,
  });
});

const getAllSavingsTransactions = catchAsync(async (req, res) => {
  const data = await SavingsTrackerServices.getAllSavingsTransactions(req);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Transactions retrieved successfully",
    data: data.data,
    meta: data.meta,
  });
});

export const SavingsTrackerControllers = {
  getSavingsTrackers,
  getSavingsTrackerById,
  updateSavingsTracker,
  deleteSavingsTracker,
  createSavingsTracker,

  getAllSavingsTransactions,
  addTransactionToSavingsTracker,
  getTransactionById,
  updateTransactionById,
  deleteTransactionById,
};
