// src/utils/dateUtils.js

import { parse, parseISO, isValid } from "date-fns";

/**
 * Parse a date string using multiple common formats, falling back to ISO and JS Date.
 * @param {string} dateString
 * @returns {Date|null}
 */
export function parseDateFlexible(dateString) {
  if (!dateString) return null;

  let dt = parse(dateString, "M/d/yy", new Date());
  if (!isValid(dt)) dt = parse(dateString, "M/d/yyyy", new Date());
  if (!isValid(dt)) dt = parse(dateString, "MM-dd-yyyy", new Date());
  if (!isValid(dt)) dt = parse(dateString, "yyyy-MM-dd", new Date());
  if (!isValid(dt)) dt = parse(dateString, "dd/MM/yyyy", new Date());
  if (!isValid(dt)) dt = parseISO(dateString);
  if (!isValid(dt)) dt = new Date(dateString);

  return isValid(dt) ? dt : null;
}

/**
 * Normalize a header string for auto-mapping.
 * @param {string} str
 * @returns {string}
 */
export function normalizeHeader(str) {
  return (str || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .trim();
}
