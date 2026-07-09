import * as XLSX from "xlsx";
import {
  MEMBER_BULK_COLUMNS,
  MEMBER_BULK_SIGNATURE_KEY,
  MEMBER_BULK_SHEET_NAME,
  MEMBER_BULK_TEMPLATE_SIGNATURE
} from "src/constants/memberBulkImport";

const TEMPLATE_FILENAME = "member-bulk-import-template.xlsx";

function formatCellDate(value) {
  if (!value) return "";
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  return String(value).trim();
}

function normalizeCell(value) {
  if (value == null) return "";
  return String(value).trim();
}

export function downloadMemberBulkTemplate() {
  const headers = MEMBER_BULK_COLUMNS.map((col) => col.header);
  const sheetData = [
    [MEMBER_BULK_SIGNATURE_KEY, MEMBER_BULK_TEMPLATE_SIGNATURE],
    headers
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  worksheet["!rows"] = [{ hidden: true }];
  worksheet["!cols"] = headers.map((header) => ({ wch: Math.max(header.length + 2, 14) }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, MEMBER_BULK_SHEET_NAME);
  XLSX.writeFile(workbook, TEMPLATE_FILENAME);
}

function getMembersSheet(workbook) {
  if (workbook.SheetNames.includes(MEMBER_BULK_SHEET_NAME)) {
    return workbook.Sheets[MEMBER_BULK_SHEET_NAME];
  }
  return workbook.Sheets[workbook.SheetNames[0]];
}

function readSignature(sheet) {
  const keyCell = sheet[XLSX.utils.encode_cell({ r: 0, c: 0 })];
  const valueCell = sheet[XLSX.utils.encode_cell({ r: 0, c: 1 })];
  return {
    key: normalizeCell(keyCell?.v),
    signature: normalizeCell(valueCell?.v)
  };
}

function rowIsEmpty(row) {
  return row.every((cell) => !normalizeCell(cell));
}

export async function parseMemberBulkUpload(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheet = getMembersSheet(workbook);

  if (!sheet) {
    throw new Error("The uploaded file does not contain a worksheet.");
  }

  const { key, signature } = readSignature(sheet);
  if (key !== MEMBER_BULK_SIGNATURE_KEY || signature !== MEMBER_BULK_TEMPLATE_SIGNATURE) {
    throw new Error(
      "This file is not a valid LifeGroup member import template. Download the template from this page and use that file."
    );
  }

  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    defval: "",
    dateNF: "yyyy-mm-dd"
  });

  const dataRows = rows.slice(2);
  const members = [];

  dataRows.forEach((row, index) => {
    if (!Array.isArray(row) || rowIsEmpty(row)) return;

    const member = {};
    MEMBER_BULK_COLUMNS.forEach((column, columnIndex) => {
      const raw = row[columnIndex];
      if (column.key === "dateOfBirth") {
        member[column.key] = formatCellDate(raw);
      } else {
        member[column.key] = normalizeCell(raw);
      }
    });

    members.push({
      ...member,
      rowNumber: index + 3
    });
  });

  if (!members.length) {
    throw new Error("No member rows were found. Add members starting on row 3 of the template.");
  }

  return {
    signature: MEMBER_BULK_TEMPLATE_SIGNATURE,
    members
  };
}
