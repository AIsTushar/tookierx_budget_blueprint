
import { NestedFilter } from "../../interface/nestedFiltering";
import { rangeFilteringPrams } from "../../../utils/queryBuilder";

// Fields for basic filtering
export const allowanceTrackerFilterFields = [];

// Fields for top-level search
export const allowanceTrackerSearchFields = [];

// Nested filtering config
export const allowanceTrackerNestedFilters: NestedFilter[] = [
	// { key: "user", searchOption: "search", queryFields: ["name"] },

];

// Array-based filtering
export const allowanceTrackerArrayFilterFields = [];

// Array-based filtering with multiple select not array
export const allowanceTrackerMultiSelectNestedArrayFilters = [
  // {
  //   field: "option",
  //   relation: "option",
  //   matchField: "name",
  // },
];

// Range-based filtering config
export const allowanceTrackerRangeFilter: rangeFilteringPrams[] = [
	{
		field: "createdAt",
		maxQueryKey: "maxDate",
		minQueryKey: "minDate",
		dataType: "date",
	},
];

// Prisma select configuration
export const allowanceTrackerSelect = {
 
};

// Prisma include configuration
export const allowanceTrackerInclude = {
	
};
