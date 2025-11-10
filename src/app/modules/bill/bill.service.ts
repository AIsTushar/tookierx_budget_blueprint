import { Request } from "express";
import { prisma } from "../../../utils/prisma";
import QueryBuilder from "../../../utils/queryBuilder";
import {
	billFilterFields,
	billInclude,
	billNestedFilters,
	billRangeFilter,
	billSearchFields,
	billMultiSelectNestedArrayFilters,
	billArrayFilterFields,
  billSelect

} from "./bill.constant";
import config from "../../../config";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../error/ApiErrors";
import { Prisma } from "@prisma/client";


const createBill = async (req: Request) => {
	const payload = req.body;

	const bill = await prisma.bill.create({ data: payload });

	return bill;
};

const getBills = async (req: Request) => {
	const queryBuilder = new QueryBuilder(req.query, prisma.bill);
	const results = await queryBuilder
		.filter(billFilterFields)
		.search(billSearchFields)
		.arrayFieldHasSome(billArrayFilterFields)
    .multiSelectNestedArray(billMultiSelectNestedArrayFilters)
		.nestedFilter(billNestedFilters)
		.sort()
		.paginate()
		.select(billSelect)
		//.include(billInclude)
		.fields()
		.filterByRange(billRangeFilter)
		.execute();

	const meta = await queryBuilder.countTotal();
	return { data: results, meta };
};

const getBillById = async (id: string) => {
	return prisma.bill.findUnique({ where: { id } });
};

const updateBill = async (req: Request) => {
	const { id } = req.params;
	const data= req.body;
	const user = req.user;
	const role = user?.role;

	const whereClause: Prisma.BillWhereUniqueInput = {
		id,
		...(role === "-----" ? { userId: user.id } : {}),
	};

	const existing = await prisma.bill.findUnique({ where: whereClause });
	if (!existing) {
		throw new ApiError(StatusCodes.NOT_FOUND, `Bill not found with this id: ${id}`);
	}

	return prisma.bill.update({
		where: whereClause,
		data: {
			...data,
		},
	});
};

const deleteBill = async (req: Request) => {
	await prisma.bill.delete({ where: { id: req.params.id } });
};

export const BillServices = {
	getBills,
	getBillById,
	updateBill,
	deleteBill,
	createBill
};