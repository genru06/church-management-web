import * as XLSX from "xlsx";
import { attendanceForSession, eventSessions, formatEventDate } from "./eventDates";

const EXPORT_COLUMNS = [
  { key: "lastName", header: "Last name" },
  { key: "firstName", header: "First name" },
  { key: "lifegroupName", header: "LifeGroup" },
  { key: "email", header: "Email" },
  { key: "phone", header: "Phone" }
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

export function exportParticipantsToExcel(participants, { churchName, eventName, event } = {}) {
  const sessions = eventSessions(event);
  const headers = EXPORT_COLUMNS.map((col) => col.header);
  if (sessions.length > 1) {
    sessions.forEach((session) => {
      headers.push(`${session.label} (${formatEventDate(session.sessionDate)})`);
    });
  } else {
    headers.push("Attended", "Attended at");
  }

  const rows = participants.map((participant) => {
    const base = [
      participant.lastName || "",
      participant.firstName || "",
      participant.lifegroupName || "",
      participant.email || "",
      participant.phone || ""
    ];
    if (sessions.length > 1) {
      return [
        ...base,
        ...sessions.map((session) => (attendanceForSession(participant, session.id) ? "Yes" : "No"))
      ];
    }
    return [...base, participant.attendedAt ? "Yes" : "No", formatAttendedAt(participant.attendedAt)];
  });

  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  worksheet["!cols"] = headers.map((header) => ({ wch: Math.max(header.length + 2, 14) }));

  const workbook = XLSX.utils.book_new();
  const sheetName = (churchName || "Participants").slice(0, 31);
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  const filename = `${sanitizeFilename(eventName || "event")}-${sanitizeFilename(churchName || "participants")}.xlsx`;
  XLSX.writeFile(workbook, filename);
}
