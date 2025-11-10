import { Request } from "express";
import { prisma } from "../../../utils/prisma";
import QueryBuilder from "../../../utils/queryBuilder";
import {
	allowanceTrackerFilterFields,
	allowanceTrackerInclude,
	allowanceTrackerNestedFilters,
	allowanceTrackerRangeFilter,
	allowanceTrackerSearchFields,
	allowanceTrackerMultiSelectNestedArrayFilters,
	allowanceTrackerArrayFilterFields,
  allowanceTrackerSelect

} from "./allowanceTracker.constant";
import config from "../../../config";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../error/ApiErrors";
import { Prisma } from "@prisma/client";


const createAllowanceTracker = async (req: Request) => {
	const payload = req.body;

	const allowanceTracker = await prisma.allowanceTracker.create({ data: payload });

	return allowanceTracker;
};

const getAllowanceTrackers = async (req: Request) => {
	const queryBuilder = new QueryBuilder(req.query, prisma.allowanceTracker);
	const results = await queryBuilder
		.filter(allowancetrackerFilterFields)
		.search(allowancetrackerSearchFields)
		.arrayFieldHasSome(allowancetrackerArrayFilterFields)
    .multiSelectNestedArray(allowancetrackerMultiSelectNestedArrayFilters)
		.nestedFilter(allowancetrackerNestedFilters)
		.sort()
		.paginate()
		.select(allowancetrackerSelect)
		//.include(allowancetrackerInclude)
		.fields()
		.filterByRange(allowancetrackerRangeFilter)
		.execute();

	const meta = await queryBuilder.countTotal();
	return { data: results, meta };
};

const getAllowanceTrackerById = async (id: string) => {
	return prisma.allowanceTracker.findUnique({ where: { id } });
};

const updateAllowanceTracker = async (req: Request) => {
	const { id } = req.params;
	const data= req.body;
	const user = req.user;
	const role = user?.role;

	const whereClause: Prisma.AllowanceTrackerWhereUniqueInput = {
		id,
		...(role === "-----" ? { userId: user.id } : {}),
	};

	const existing = await prisma.allowanceTracker.findUnique({ where: whereClause });
	if (!existing) {
		throw new ApiError(StatusCodes.NOT_FOUND, `AllowanceTracker not found with this id: ${id}`);
	}

	return prisma.allowanceTracker.update({
		where: whereClause,
		data: {
			...data,
		},
	});
};

const deleteAllowanceTracker = async (req: Request) => {
	await prisma.allowanceTracker.delete({ where: { id: req.params.id } });
};

export const AllowanceTrackerServices = {
	getAllowanceTrackers,
	getAllowanceTrackerById,
	updateAllowanceTracker,
	deleteAllowanceTracker,
	createAllowanceTracker
};