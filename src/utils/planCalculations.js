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
 * Determine if someone is HCE based on compensation, ownership, and family relationships.
 * @param {string|number} compensation – Employee's compensation
 * @param {number|string} planYear – Plan year
 * @param {object} row – CSV row object
 * @param {object} columnMap – Maps header names to CSV field names
 * @param {object} idToRow – Maps employee IDs to row objects
 * @returns {"Yes"|"No"}
 */
export function isHCE(compensation, planYear, row, columnMap, idToRow) {
  const comp = parseFloat(compensation || 0);
  const threshold = HCE_THRESHOLDS[planYear] || 0;

  // Ownership criteria: >5% ownership makes an employee an HCE
  const ownership = parseFloat(row[columnMap["OwnershipPercentage"]] || 0);
  const meetsOwnershipRule = ownership > 5;

  // Family relationship criteria: Having a spouse, child, parent, or grandparent relationship
  // where the family member is an HCE (determined by ownership > 5%)
  const familyRelationship = (row[columnMap["FamilyRelationshipToOwner"]] || "").toLowerCase();
  const familyMemberOwnerID = (row[columnMap["FamilyMemberOwnerID"]] || "").toLowerCase();
  const meetsFamilyRelationship = ["spouse", "child", "parent", "grandparent"].includes(familyRelationship);
  
  let meetsFamilyRule = false;
  if (meetsFamilyRelationship && familyMemberOwnerID) {
    const familyMemberRow = idToRow[familyMemberOwnerID];
    if (familyMemberRow) {
      const familyMemberOwnership = parseFloat(familyMemberRow["OwnershipPercentage"] || 0);
      meetsFamilyRule = familyMemberOwnership > 5;
    }
  }

  // Compensation criteria
  const meetsCompensationRule = comp >= threshold;

  console.log(`isHCE: comp=${comp}, threshold=${threshold}, ownership=${ownership}, familyRelationship=${familyRelationship}, familyMemberOwnerID=${familyMemberOwnerID}, meetsCompensationRule=${meetsCompensationRule}, meetsOwnershipRule=${meetsOwnershipRule}, meetsFamilyRule=${meetsFamilyRule}`);

  return (meetsCompensationRule || meetsOwnershipRule || meetsFamilyRule) ? "Yes" : "No";
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
  const own = parseFloat(row[columnMap["OwnershipPercentage"]] || 0);
  const fam = (row[columnMap["FamilyMemberOwnerID"]] || "").toLowerCase();
  const emp = (row[columnMap["Employment Status"]] || "").toLowerCase();
  const thr = KEY_EMPLOYEE_THRESHOLDS[planYear] || Infinity;

  const meetsOfficerRule = comp >= thr && emp === "officer";
  const meetsOwnershipRule = own >= 5;
  const meetsFamilyRule = fam !== ""; // Any family member ID indicates a relationship
  const meetsSmallOwnerRule = own >= 1 && comp > 150000;

  return (meetsOfficerRule || meetsOwnershipRule || meetsSmallOwnerRule || meetsFamilyRule)
    ? "Yes"
    : "No";
}
