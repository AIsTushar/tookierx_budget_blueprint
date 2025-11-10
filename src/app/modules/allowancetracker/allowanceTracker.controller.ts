import { StatusCodes } from "http-status-codes";;
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../middleware/sendResponse";
import { AllowanceTrackerServices } from "./allowanceTracker.service";

const createAllowanceTracker = catchAsync(async (req, res) => {
	const result = await AllowanceTrackerServices.createAllowanceTracker(req);
	sendResponse(res, {
		statusCode: StatusCodes.CREATED,
		success: true,
		message: "AllowanceTracker created successfully",
		data: result,
	
	});
});
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

const getAllowanceTrackerById = catchAsync(async (req, res) => {
	const result = await AllowanceTrackerServices.getAllowanceTrackerById(req.params.id);
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

const deleteAllowanceTracker = catchAsync(async (req, res) => {
	await AllowanceTrackerServices.deleteAllowanceTracker(req);
	sendResponse(res, {
		statusCode: StatusCodes.NO_CONTENT,
		success: true,
		message: "AllowanceTracker deleted successfully",
		data: null,
	});
});

export const AllowanceTrackerControllers = {
	getAllowanceTrackers,
	getAllowanceTrackerById,
	updateAllowanceTracker,
	deleteAllowanceTracker,
	createAllowanceTracker,
};