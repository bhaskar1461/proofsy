const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const xlsx = require("xlsx");

const MAX_ROW_LIMIT = 5000;
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

// Formula injection triggers in spreadsheets: =, +, -, @, tab (\t), carriage return (\r)
const FORMULA_INJECTION_REGEX = /^[=+\-@\t\r]/;

/**
 * Sanitize a string against CSV/Excel formula injection.
 * If the field starts with an injection character, prepend a single quote (') so spreadsheets
 * treat it as a literal string rather than an executable formula or DDE command.
 * @param {string} val
 * @returns {string}
 */
function sanitizeFormulaInjection(val) {
  if (typeof val !== "string") return val;
  if (/^[=+\-@\t\r]/.test(val)) {
    return `'${val}`;
  }
  const trimmed = val.trim();
  if (/^[=+\-@]/.test(trimmed)) {
    return `'${trimmed}`;
  }
  return trimmed;
}

/**
 * Basic email format validator
 * @param {string} email
 * @returns {boolean}
 */
function isValidEmail(email) {
  if (!email || typeof email !== "string") return false;
  // Standard RFC-compliant relaxed regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(email) && email.length <= 320;
}

/**
 * Normalize header names to identify name and email columns
 * @param {string} header
 * @returns {string|null}
 */
function normalizeHeader(header) {
  if (!header) return null;
  const clean = String(header).toLowerCase().replace(/[^a-z0-9]/g, "");
  if (["name", "fullname", "recipientname", "participantname", "studentname"].includes(clean)) {
    return "name";
  }
  if (["email", "emailaddress", "recipientemail", "participantemail", "studentemail", "mail"].includes(clean)) {
    return "email";
  }
  return clean;
}

/**
 * Parse and validate uploaded CSV or XLSX file
 * @param {string} filePath Absolute path to temporary uploaded file
 * @param {string} originalName Original filename from client
 * @param {number} [maxRows=MAX_ROW_LIMIT]
 * @returns {Promise<{ validRows: Array<{ name: string, email: string, originalRow: number }>, errors: Array<{ row: number, error: string }>, totalRows: number }>}
 */
async function parseAndValidateRecipientFile(filePath, originalName, maxRows = MAX_ROW_LIMIT) {
  const ext = path.extname(originalName || filePath).toLowerCase();

  if (ext !== ".csv" && ext !== ".xlsx" && ext !== ".xls") {
    throw new Error("Unsupported file format. Please upload a CSV (.csv) or Excel (.xlsx) file.");
  }

  const stats = fs.statSync(filePath);
  if (stats.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File size exceeds 5MB limit (${Math.round(stats.size / 1024 / 1024)}MB uploaded).`);
  }

  let rawRows = [];

  if (ext === ".xlsx" || ext === ".xls") {
    // Parse Excel workbook
    const workbook = xlsx.readFile(filePath, { cellDates: true });
    const firstSheetName = workbook.SheetNames[0];
    if (!firstSheetName) {
      throw new Error("The uploaded Excel workbook contains no sheets.");
    }
    const worksheet = workbook.Sheets[firstSheetName];
    rawRows = xlsx.utils.sheet_to_json(worksheet, { defval: "" });
  } else {
    // Parse CSV
    rawRows = await new Promise((resolve, reject) => {
      const results = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on("data", (data) => results.push(data))
        .on("end", () => resolve(results))
        .on("error", (err) => reject(new Error("Failed to parse CSV file: " + err.message)));
    });
  }

  if (!rawRows || rawRows.length === 0) {
    throw new Error("File is empty. Please provide a file with recipient data.");
  }

  if (rawRows.length > maxRows) {
    throw new Error(`File exceeds maximum limit of ${maxRows} rows (uploaded file contains ${rawRows.length} rows).`);
  }

  // Detect column mapping from the first row's keys
  const sampleKeys = Object.keys(rawRows[0] || {});
  let nameKey = null;
  let emailKey = null;

  for (const k of sampleKeys) {
    const norm = normalizeHeader(k);
    if (norm === "name" && !nameKey) nameKey = k;
    if (norm === "email" && !emailKey) emailKey = k;
  }

  if (!nameKey || !emailKey) {
    throw new Error("Missing required columns: File must have headers for 'name' and 'email'.");
  }

  const validRows = [];
  const errors = [];
  const seenEmails = new Set();

  rawRows.forEach((row, idx) => {
    const rowNumber = idx + 2; // +1 for 0-index, +1 for header row
    const rawName = String(row[nameKey] || "").trim();
    const rawEmail = String(row[emailKey] || "").trim().toLowerCase();

    // Check for empty name
    if (!rawName) {
      errors.push({ row: rowNumber, error: "Missing or empty recipient name" });
      return;
    }

    // Check for name length
    if (rawName.length > 200) {
      errors.push({ row: rowNumber, error: "Recipient name exceeds 200 characters" });
      return;
    }

    // Check for empty or invalid email
    if (!rawEmail) {
      errors.push({ row: rowNumber, error: "Missing or empty email address" });
      return;
    }

    if (!isValidEmail(rawEmail)) {
      errors.push({ row: rowNumber, error: `Invalid email address format: "${rawEmail}"` });
      return;
    }

    // Check for duplicates within the same file
    if (seenEmails.has(rawEmail)) {
      errors.push({ row: rowNumber, error: `Duplicate email address in file: "${rawEmail}"` });
      return;
    }

    seenEmails.add(rawEmail);

    // Sanitize values against formula injection
    const sanitizedName = sanitizeFormulaInjection(rawName);
    const sanitizedEmail = sanitizeFormulaInjection(rawEmail);

    validRows.push({
      name: sanitizedName,
      email: sanitizedEmail,
      originalRow: rowNumber,
    });
  });

  return {
    validRows,
    errors,
    totalRows: rawRows.length,
  };
}

module.exports = {
  parseAndValidateRecipientFile,
  sanitizeFormulaInjection,
  isValidEmail,
  MAX_ROW_LIMIT,
  MAX_FILE_SIZE_BYTES,
};
