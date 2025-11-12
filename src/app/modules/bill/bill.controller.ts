import { StatusCodes } from "http-status-codes";
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../middleware/sendResponse";
import { BillServices } from "./bill.service";

const createBill = catchAsync(async (req, res) => {
  const result = await BillServices.createBill(req);
  sendResponse(res, {
    statusCode: StatusCodes.CREATED,
    success: true,
    message: "Bill created successfully",
    data: result,
  });
});
const getBills = catchAsync(async (req, res) => {
  const result = await BillServices.getBills(req);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Bills retrieved successfully",
    data: result.data,
    meta: result.meta,
  });
});

const getBillById = catchAsync(async (req, res) => {
  const result = await BillServices.getBillById(req.params.id);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Bill retrieved successfully",
    data: result,
  });
});

const updateBill = catchAsync(async (req, res) => {
  const result = await BillServices.updateBill(req);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Bill updated successfully",
    data: result,
  });
});

const deleteBill = catchAsync(async (req, res) => {
  await BillServices.deleteBill(req);
  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: "Bill deleted successfully",
    data: null,
  });
});

export const BillControllers = {
  getBills,
  getBillById,
  updateBill,
  deleteBill,
  createBill,
};
