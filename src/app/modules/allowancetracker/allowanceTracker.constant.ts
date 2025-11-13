import { NestedFilter } from "../../interface/nestedFiltering";
import { rangeFilteringPrams } from "../../../utils/queryBuilder";
import { Prisma } from "@prisma/client";

// Fields for basic filtering
export const allowanceTrackerFilterFields = [];
export const allowanceTransactionFilterFields = ["isCleared", "type"];

// Fields for top-level search
export const allowanceTrackerSearchFields = [];

// Nested filtering config
export const allowanceTrackerNestedFilters: NestedFilter[] = [
  // { key: "user", searchOption: "search", queryFields: ["name"] },
  { key: "paycheck", searchOption: "enum", queryFields: ["month"] },
  { key: "paycheck", searchOption: "exact", queryFields: ["year"] },
];
export const allowanceTransactionNestedFilters: NestedFilter[] = [
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
export const allowanceTrackerSelect = {};

// Prisma include configuration
export const allowanceTrackerInclude: Prisma.AllowanceTrackerInclude = {
  paycheck: {
    select: {
      id: true,
      month: true,
      year: true,
    },
  },
};
