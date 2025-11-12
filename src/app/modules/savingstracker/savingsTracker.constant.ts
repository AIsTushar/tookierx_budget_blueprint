
import { NestedFilter } from "../../interface/nestedFiltering";
import { rangeFilteringPrams } from "../../../utils/queryBuilder";

// Fields for basic filtering
export const savingsTrackerFilterFields = [];

// Fields for top-level search
export const savingsTrackerSearchFields = [];

// Nested filtering config
export const savingsTrackerNestedFilters: NestedFilter[] = [
	// { key: "user", searchOption: "search", queryFields: ["name"] },

];

// Array-based filtering
export const savingsTrackerArrayFilterFields = [];

// Array-based filtering with multiple select not array
export const savingsTrackerMultiSelectNestedArrayFilters = [
  // {
  //   field: "option",
  //   relation: "option",
  //   matchField: "name",
  // },
];

// Range-based filtering config
export const savingsTrackerRangeFilter: rangeFilteringPrams[] = [
	{
		field: "createdAt",
		maxQueryKey: "maxDate",
		minQueryKey: "minDate",
		dataType: "date",
	},
];

// Prisma select configuration
export const savingsTrackerSelect = {
 
};

// Prisma include configuration
export const savingsTrackerInclude = {
	
};
