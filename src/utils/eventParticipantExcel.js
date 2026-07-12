import * as XLSX from "xlsx";

const EXPORT_COLUMNS = [
  { key: "lastName", header: "Last name" },
  { key: "firstName", header: "First name" },
  { key: "lifegroupName", header: "LifeGroup" },
  { key: "email", header: "Email" },
  { key: "phone", header: "Phone" },
  { key: "attended", header: "Attended" },
  { key: "attendedAt", header: "Attended at" }
];

function sanitizeFilename(value) {
  return String(value || "export")
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 50);
}

function formatAttendedAt(value) {
  if (!value) return "";
  return new Date(value).toLocaleString();
}

export function exportParticipantsToExcel(participants, { churchName, eventName }) {
  const headers = EXPORT_COLUMNS.map((col) => col.header);
  const rows = participants.map((participant) => [
    participant.lastName || "",
    participant.firstName || "",
    participant.lifegroupName || "",
    participant.email || "",
    participant.phone || "",
    participant.attendedAt ? "Yes" : "No",
    formatAttendedAt(participant.attendedAt)
  ]);

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  worksheet["!cols"] = headers.map((header) => ({ wch: Math.max(header.length + 2, 14) }));

  const workbook = XLSX.utils.book_new();
  const sheetName = (churchName || "Participants").slice(0, 31);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const filename = `${sanitizeFilename(eventName || "event")}-${sanitizeFilename(churchName || "participants")}.xlsx`;
  XLSX.writeFile(workbook, filename);
}
