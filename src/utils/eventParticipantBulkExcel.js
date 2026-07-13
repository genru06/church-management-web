import * as XLSX from "xlsx";
import {
  EVENT_PARTICIPANT_BULK_CHURCH_ID_KEY,
  EVENT_PARTICIPANT_BULK_COLUMNS,
  EVENT_PARTICIPANT_BULK_EVENT_ID_KEY,
  EVENT_PARTICIPANT_BULK_SIGNATURE_KEY,
  EVENT_PARTICIPANT_BULK_SHEET_NAME,
  EVENT_PARTICIPANT_BULK_TEMPLATE_SIGNATURE
} from "src/constants/eventParticipantBulkImport";

function normalizeCell(value) {
  if (value == null) return "";
  return String(value).trim();
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildTemplateFilename({ eventId, eventName, churchId, churchName }) {
  const eventSlug = slugify(eventName) || `event-${eventId}`;
  if (!churchId) {
    return `event-participant-import-${eventId}-${eventSlug}.xlsx`;
  }
  const churchSlug = slugify(churchName) || `church-${churchId}`;
  return `event-participant-import-${eventId}-${eventSlug}-church-${churchId}-${churchSlug}.xlsx`;
}

export function downloadEventParticipantBulkTemplate({
  eventId,
  eventName = null,
  churchId = null,
  churchName = null
} = {}) {
  if (!eventId) {
    throw new Error("An event identifier is required to download the participant import template.");
  }

  const headers = EVENT_PARTICIPANT_BULK_COLUMNS.map((col) => col.header);
  const sheetData = [
    [EVENT_PARTICIPANT_BULK_SIGNATURE_KEY, EVENT_PARTICIPANT_BULK_TEMPLATE_SIGNATURE],
    [EVENT_PARTICIPANT_BULK_EVENT_ID_KEY, String(eventId)],
    [EVENT_PARTICIPANT_BULK_CHURCH_ID_KEY, churchId ? String(churchId) : ""],
    headers
  ];

  const worksheet = XLSX.utils.aoa_to_sheet(sheetData);
  worksheet["!rows"] = [{ hidden: true }, { hidden: true }, { hidden: true }];
  worksheet["!cols"] = headers.map((header) => ({ wch: Math.max(header.length + 2, 14) }));

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, EVENT_PARTICIPANT_BULK_SHEET_NAME);
  XLSX.writeFile(
    workbook,
    buildTemplateFilename({ eventId, eventName, churchId, churchName })
  );
}

function getParticipantsSheet(workbook) {
  if (workbook.SheetNames.includes(EVENT_PARTICIPANT_BULK_SHEET_NAME)) {
    return workbook.Sheets[EVENT_PARTICIPANT_BULK_SHEET_NAME];
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

function resolveTemplateLayout(sheet) {
  const signatureMeta = readMetadataRow(sheet, 0);
  if (
    signatureMeta.key !== EVENT_PARTICIPANT_BULK_SIGNATURE_KEY ||
    signatureMeta.value !== EVENT_PARTICIPANT_BULK_TEMPLATE_SIGNATURE
  ) {
    throw new Error(
      "This file is not a valid LifeGroup event participant import template. Download the template from this page and use that file."
    );
  }

  const eventMeta = readMetadataRow(sheet, 1);
  if (eventMeta.key !== EVENT_PARTICIPANT_BULK_EVENT_ID_KEY) {
    throw new Error(
      "This template is missing event metadata. Download a fresh template from this page."
    );
  }

  const eventId = eventMeta.value ? Number(eventMeta.value) : null;
  if (!eventId || Number.isNaN(eventId)) {
    throw new Error("This template contains an invalid event identifier.");
  }

  const churchMeta = readMetadataRow(sheet, 2);
  if (churchMeta.key !== EVENT_PARTICIPANT_BULK_CHURCH_ID_KEY) {
    throw new Error(
      "This template is missing church metadata. Download a fresh template from this page."
    );
  }

  const churchId = churchMeta.value ? Number(churchMeta.value) : null;
  if (churchMeta.value && (!churchId || Number.isNaN(churchId))) {
    throw new Error("This template contains an invalid church identifier.");
  }

  return {
    signature: signatureMeta.value,
    eventId,
    churchId,
    dataStartRowIndex: 4
  };
}

function rowIsEmpty(row) {
  return row.every((cell) => !normalizeCell(cell));
}

export async function parseEventParticipantBulkUpload(file) {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheet = getParticipantsSheet(workbook);

  if (!sheet) {
    throw new Error("The uploaded file does not contain a worksheet.");
  }

  const layout = resolveTemplateLayout(sheet);

  const rows = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    raw: false,
    defval: ""
  });

  const dataRows = rows.slice(layout.dataStartRowIndex);
  const participants = [];

  dataRows.forEach((row, index) => {
    if (!Array.isArray(row) || rowIsEmpty(row)) return;

    const participant = {};
    EVENT_PARTICIPANT_BULK_COLUMNS.forEach((column, columnIndex) => {
      participant[column.key] = normalizeCell(row[columnIndex]);
    });

    participants.push({
      ...participant,
      rowNumber: index + layout.dataStartRowIndex + 1
    });
  });

  if (!participants.length) {
    throw new Error(
      `No participant rows were found. Add participants starting on row ${layout.dataStartRowIndex + 1} of the template.`
    );
  }

  return {
    signature: layout.signature,
    eventId: layout.eventId,
    churchId: layout.churchId,
    participants
  };
}
