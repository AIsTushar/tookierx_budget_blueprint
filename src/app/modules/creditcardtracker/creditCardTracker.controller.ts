import { StatusCodes } from "http-status-codes";;
import catchAsync from "../../../shared/catchAsync";
import sendResponse from "../../middleware/sendResponse";
import { CreditCardTrackerServices } from "./creditCardTracker.service";

const createCreditCardTracker = catchAsync(async (req, res) => {
	const result = await CreditCardTrackerServices.createCreditCardTracker(req);
	sendResponse(res, {
		statusCode: StatusCodes.CREATED,
		success: true,
		message: "CreditCardTracker created successfully",
		data: result,
	
	});
});
const getCreditCardTrackers = catchAsync(async (req, res) => {
	const result = await CreditCardTrackerServices.getCreditCardTrackers(req);
	sendResponse(res, {
		statusCode: StatusCodes.OK,
		success: true,
		message: "CreditCardTrackers retrieved successfully",
		data: result.data,
		meta: result.meta,
	});
});

const getCreditCardTrackerById = catchAsync(async (req, res) => {
	const result = await CreditCardTrackerServices.getCreditCardTrackerById(req.params.id);
	sendResponse(res, {
		statusCode: StatusCodes.OK,
		success: true,
		message: "CreditCardTracker retrieved successfully",
		data: result,
	});
});

const updateCreditCardTracker = catchAsync(async (req, res) => {
	const result = await CreditCardTrackerServices.updateCreditCardTracker(req);
	sendResponse(res, {
		statusCode: StatusCodes.OK,
		success: true,
		message: "CreditCardTracker updated successfully",
		data: result,
	});
});

const deleteCreditCardTracker = catchAsync(async (req, res) => {
	await CreditCardTrackerServices.deleteCreditCardTracker(req);
	sendResponse(res, {
		statusCode: StatusCodes.NO_CONTENT,
		success: true,
		message: "CreditCardTracker deleted successfully",
		data: null,
	});
});

export const CreditCardTrackerControllers = {
	getCreditCardTrackers,
	getCreditCardTrackerById,
	updateCreditCardTracker,
	deleteCreditCardTracker,
	createCreditCardTracker,
};