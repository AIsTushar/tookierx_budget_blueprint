module.exports = ({
  pascal,
  camel,
  lower,
}) => `import { Request } from "express";
import { prisma } from "../../../utils/prisma";
import QueryBuilder from "../../../utils/queryBuilder";
import {
	${camel}FilterFields,
	${camel}Include,
	${camel}NestedFilters,
	${camel}RangeFilter,
	${camel}SearchFields,
	${camel}MultiSelectNestedArrayFilters,
	${camel}ArrayFilterFields,
  ${camel}Select

} from "./${camel}.constant";
import config from "../../../config";
import { StatusCodes } from "http-status-codes";
import ApiError from "../../error/ApiErrors";
import { Prisma } from "@prisma/client";


const create${pascal} = async (req: Request) => {
	const payload = req.body;

	const ${camel} = await prisma.${camel}.create({ data: payload });

	return ${camel};
};

const get${pascal}s = async (req: Request) => {
	const queryBuilder = new QueryBuilder(req.query, prisma.${camel});
	const results = await queryBuilder
		.filter(${lower}FilterFields)
		.search(${lower}SearchFields)
		.arrayFieldHasSome(${lower}ArrayFilterFields)
    .multiSelectNestedArray(${lower}MultiSelectNestedArrayFilters)
		.nestedFilter(${lower}NestedFilters)
		.sort()
		.paginate()
		.select(${lower}Select)
		//.include(${lower}Include)
		.fields()
		.filterByRange(${lower}RangeFilter)
		.execute();

	const meta = await queryBuilder.countTotal();
	return { data: results, meta };
};

const get${pascal}ById = async (id: string) => {
	return prisma.${camel}.findUnique({ where: { id } });
};

const update${pascal} = async (req: Request) => {
	const { id } = req.params;
	const data= req.body;
	const user = req.user;
	const role = user?.role;

	const whereClause: Prisma.${pascal}WhereUniqueInput = {
		id,
		...(role === "-----" ? { userId: user.id } : {}),
	};

	const existing = await prisma.${camel}.findUnique({ where: whereClause });
	if (!existing) {
		throw new ApiError(StatusCodes.NOT_FOUND, \`${pascal} not found with this id: \${id}\`);
	}

	return prisma.${camel}.update({
		where: whereClause,
		data: {
			...data,
		},
	});
};

const delete${pascal} = async (req: Request) => {
	await prisma.${camel}.delete({ where: { id: req.params.id } });
};

export const ${pascal}Services = {
	get${pascal}s,
	get${pascal}ById,
	update${pascal},
	delete${pascal},
	create${pascal}
};`;
