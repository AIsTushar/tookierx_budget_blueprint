import { NestedFilter } from "../../interface/nestedFiltering";
import { rangeFilteringPrams } from "../../../utils/queryBuilder";
import { Prisma } from "@prisma/client";

// Fields for basic filtering
export const paycheckFilterFields = [];

// Fields for top-level search
export const paycheckSearchFields = [];

// Nested filtering config
export const paycheckNestedFilters: NestedFilter[] = [
  // { key: "user", searchOption: "search", queryFields: ["name"] },
];

// Array-based filtering
export const paycheckArrayFilterFields = [];

// Array-based filtering with multiple select not array
export const paycheckMultiSelectNestedArrayFilters = [
  // {
  //   field: "option",
  //   relation: "option",
  //   matchField: "name",
  // },
];

// Range-based filtering config
export const paycheckRangeFilter: rangeFilteringPrams[] = [
  {
    field: "createdAt",
    maxQueryKey: "maxDate",
    minQueryKey: "minDate",
    dataType: "date",
  },
];

// Prisma select configuration
export const paycheckSelect: Prisma.PaycheckSelect = {
  id: true,
  amount: true,
  paycheckDate: true,
  frequency: true,
  coverageStart: true,
  coverageEnd: true,
};

// Prisma include configuration
export const paycheckInclude: Prisma.PaycheckInclude = {
  user: {
    select: {
      id: true,
      name: true,
      email: true,
    },
  },
  bills: true,
  allowanceTracker: {
    select: {
      id: true,
      currentBalance: true,
      clearedBalance: true,
    },
  },
};
