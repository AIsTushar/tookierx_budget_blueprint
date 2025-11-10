
import { NestedFilter } from "../../interface/nestedFiltering";
import { rangeFilteringPrams } from "../../../utils/queryBuilder";

// Fields for basic filtering
export const creditCardTrackerFilterFields = [];

// Fields for top-level search
export const creditCardTrackerSearchFields = [];

// Nested filtering config
export const creditCardTrackerNestedFilters: NestedFilter[] = [
	// { key: "user", searchOption: "search", queryFields: ["name"] },

];

// Array-based filtering
export const creditCardTrackerArrayFilterFields = [];

// Array-based filtering with multiple select not array
export const creditCardTrackerMultiSelectNestedArrayFilters = [
  // {
  //   field: "option",
  //   relation: "option",
  //   matchField: "name",
  // },
];

// Range-based filtering config
export const creditCardTrackerRangeFilter: rangeFilteringPrams[] = [
	{
		field: "createdAt",
		maxQueryKey: "maxDate",
		minQueryKey: "minDate",
		dataType: "date",
	},
];

// Prisma select configuration
export const creditCardTrackerSelect = {
 
};

// Prisma include configuration
export const creditCardTrackerInclude = {
	
};
