// src/utils/planCalculations.js

import { differenceInYears } from "date-fns";
import { parseDateFlexible } from "./dateUtils";

// HCE thresholds by plan year
export const HCE_THRESHOLDS = {
  2016: 120000, 2017: 120000, 2018: 120000, 2019: 120000,
  2020: 125000, 2021: 130000, 2022: 130000, 2023: 135000,
  2024: 150000, 2025: 155000,
};

// Key-employee compensation thresholds by plan year
export const KEY_EMPLOYEE_THRESHOLDS = {
  2010: 160000, 2011: 160000, 2012: 165000, 2013: 165000, 2014: 170000,
  2015: 170000, 2016: 170000, 2017: 175000, 2018: 175000, 2019: 180000,
  2020: 185000, 2021: 185000, 2022: 200000, 2023: 200000, 2024: 215000,
  2025: 220000,
};

/**
 * Calculate years of service as of Dec 31 of the plan year.
 * @param {string} dohString – date of hire string
 * @param {number|string} planYear
 * @returns {number}
 */
export function calculateYearsOfService(dohString, planYear) {
  const hireDate = parseDateFlexible(dohString);
  if (!hireDate || !planYear) return 0;
  const yearEnd = new Date(Number(planYear), 11, 31);
  return differenceInYears(yearEnd, hireDate);
}

/**
 * Determine if someone is HCE based on compensation threshold.
 * @param {string|number} compensation
 * @param {number|string} planYear
 * @returns {"Yes"|"No"}
 */
export function isHCE(compensation, planYear) {
  const comp = parseFloat(compensation || 0);
  const threshold = HCE_THRESHOLDS[planYear] || 0;
  return comp >= threshold ? "Yes" : "No";
}

/**
 * Determine if someone is a Key Employee based on multiple criteria.
 * @param {object} row – CSV row object
 * @param {object} columnMap – maps header names to CSV field names
 * @param {number|string} planYear
 * @returns {"Yes"|"No"}
 */
export function isKeyEmployee(row, columnMap, planYear) {
  const comp = parseFloat(row[columnMap.Compensation] || 0);
  const own = parseFloat(row[columnMap["Ownership %"]] || 0);
  const fam = (row[columnMap["Family Member"]] || "").toLowerCase();
  const emp = (row[columnMap["Employment Status"]] || "").toLowerCase();
  const thr = KEY_EMPLOYEE_THRESHOLDS[planYear] || Infinity;

  const meetsOfficerRule = comp >= thr && emp === "officer";
  const meetsOwnershipRule = own >= 5;
  const meetsFamilyRule = ["spouse","child","parent","grandparent"].includes(fam);
  const meetsSmallOwnerRule = own >= 1 && comp > 150000;

  return (meetsOfficerRule || meetsOwnershipRule || meetsSmallOwnerRule || meetsFamilyRule)
    ? "Yes"
    : "No";
}
