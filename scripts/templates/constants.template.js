module.exports = ({ pascal, camel }) => `
import { NestedFilter } from "../../interface/nestedFiltering";
import { rangeFilteringPrams } from "../../../utils/queryBuilder";

// Fields for basic filtering
export const ${camel}FilterFields = [];

// Fields for top-level search
export const ${camel}SearchFields = [];

// Nested filtering config
export const ${camel}NestedFilters: NestedFilter[] = [
	// { key: "user", searchOption: "search", queryFields: ["name"] },

];

// Array-based filtering
export const ${camel}ArrayFilterFields = [];

// Array-based filtering with multiple select not array
export const ${camel}MultiSelectNestedArrayFilters = [
  // {
  //   field: "option",
  //   relation: "option",
  //   matchField: "name",
  // },
];

// Range-based filtering config
export const ${camel}RangeFilter: rangeFilteringPrams[] = [
	{
		field: "createdAt",
		maxQueryKey: "maxDate",
		minQueryKey: "minDate",
		dataType: "date",
	},
];

// Prisma select configuration
export const ${camel}Select = {
 
};

// Prisma include configuration
export const ${camel}Include = {
	
};
`;
