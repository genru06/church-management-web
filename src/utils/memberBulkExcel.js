import * as XLSX from "xlsx";
import {
  MEMBER_BULK_CHURCH_ID_KEY,
  MEMBER_BULK_COLUMNS,
  MEMBER_BULK_COLUMNS_V2,
  MEMBER_BULK_SIGNATURE_KEY,
  MEMBER_BULK_SHEET_NAME,
  MEMBER_BULK_TEMPLATE_SIGNATURE,
  MEMBER_BULK_TEMPLATE_SIGNATURE_V2,
  MEMBER_BULK_TEMPLATE_SIGNATURE_V3
} from "src/constants/memberBulkImport";

const GENERAL_TEMPLATE_FILENAME = "member-bulk-import-template.xlsx";

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

function buildTemplateFilename(church) {
  if (!church?.id) return GENERAL_TEMPLATE_FILENAME;
  const slug = String(church.label || church.name || `church-${church.id}`)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `member-bulk-import-church-${church.id}${slug ? `-${slug}` : ""}.xlsx`;
}

export function downloadMemberBulkTemplate({ churchId = null, churchName = null } = {}) {
  const headers = MEMBER_BULK_COLUMNS.map((col) => col.header);
  const sheetData = [
    [MEMBER_BULK_SIGNATURE_KEY, MEMBER_BULK_TEMPLATE_SIGNATURE_V3],
    [MEMBER_BULK_CHURCH_ID_KEY, churchId ? String(churchId) : ""],
    headers
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  worksheet["!rows"] = [{ hidden: true }, { hidden: true }];
  worksheet["!cols"] = headers.map((header) => ({ wch: Math.max(header.length + 2, 14) }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, MEMBER_BULK_SHEET_NAME);
  XLSX.writeFile(
    workbook,
    buildTemplateFilename(
      churchId ? { id: churchId, label: churchName } : null
    )
  );
}

function getMembersSheet(workbook) {
  if (workbook.SheetNames.includes(MEMBER_BULK_SHEET_NAME)) {
    return workbook.Sheets[MEMBER_BULK_SHEET_NAME];
  }
  return workbook.Sheets[workbook.SheetNames[0]];
}

function readMetadataRow(sheet, rowIndex) {
  const keyCell = sheet[XLSX.utils.encode_cell({ r: rowIndex, c: 0 })];
  const valueCell = sheet[XLSX.utils.encode_cell({ r: rowIndex, c: 1 })];
  return {
    key: normalizeCell(keyCell?.v),
    value: normalizeCell(valueCell?.v)
  };
}

function readSignature(sheet) {
  return readMetadataRow(sheet, 0);
}

const VALID_TEMPLATE_SIGNATURES = new Set([
  MEMBER_BULK_TEMPLATE_SIGNATURE,
  MEMBER_BULK_TEMPLATE_SIGNATURE_V2,
  MEMBER_BULK_TEMPLATE_SIGNATURE_V3
]);

function getColumnsForSignature(signature) {
  if (signature === MEMBER_BULK_TEMPLATE_SIGNATURE_V3) return MEMBER_BULK_COLUMNS;
  return MEMBER_BULK_COLUMNS_V2;
}

function resolveTemplateLayout(sheet) {
  const { key, value: signature } = readSignature(sheet);
  if (key !== MEMBER_BULK_SIGNATURE_KEY || !VALID_TEMPLATE_SIGNATURES.has(signature)) {
    throw new Error(
      "This file is not a valid LifeGroup member import template. Download the template from this page and use that file."
    );
  }

  if (signature === MEMBER_BULK_TEMPLATE_SIGNATURE_V2 || signature === MEMBER_BULK_TEMPLATE_SIGNATURE_V3) {
    const churchMeta = readMetadataRow(sheet, 1);
    if (churchMeta.key !== MEMBER_BULK_CHURCH_ID_KEY) {
      throw new Error(
        "This template is missing church metadata. Download a fresh template from this page."
      );
    }

    const churchId = churchMeta.value ? Number(churchMeta.value) : null;
    if (churchMeta.value && (!churchId || Number.isNaN(churchId))) {
      throw new Error("This template contains an invalid church identifier.");
    }

    return {
      signature,
      churchId,
      columns: getColumnsForSignature(signature),
      dataStartRowIndex: 3
    };
  }

  return {
    signature,
    churchId: null,
    columns: MEMBER_BULK_COLUMNS_V2,
    dataStartRowIndex: 2
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

  const layout = resolveTemplateLayout(sheet);

  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    defval: "",
    dateNF: "yyyy-mm-dd"
  });

  const dataRows = rows.slice(layout.dataStartRowIndex);
  const members = [];

  dataRows.forEach((row, index) => {
    if (!Array.isArray(row) || rowIsEmpty(row)) return;

    const member = {};
    layout.columns.forEach((column, columnIndex) => {
      const raw = row[columnIndex];
      if (column.key === "dateOfBirth") {
        member[column.key] = formatCellDate(raw);
      } else {
        member[column.key] = normalizeCell(raw);
      }
    });

    members.push({
      ...member,
      rowNumber: index + layout.dataStartRowIndex + 1
    });
  });

  if (!members.length) {
    throw new Error(
      `No member rows were found. Add members starting on row ${layout.dataStartRowIndex + 1} of the template.`
    );
  }

  return {
    signature: layout.signature,
    churchId: layout.churchId,
    members
  };
}
