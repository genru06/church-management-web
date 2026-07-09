export function formatEventTime(value) {
  if (!value) return "—";

  const trimmed = String(value).trim();
  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(am|pm)$/i);
  if (match12) {
    return `${String(Number(match12[1])).padStart(2, "0")}:${match12[2]} ${match12[3].toLowerCase()}`;
  }

  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    let hours = Number(match24[1]);
    const minutes = match24[2];
    const period = hours >= 12 ? "pm" : "am";
    hours %= 12;
    if (hours === 0) hours = 12;
    return `${String(hours).padStart(2, "0")}:${minutes} ${period}`;
  }

  return trimmed;
}

export function normalizeEventTime(value) {
  if (!value) return "";
  const formatted = formatEventTime(value);
  return formatted === "—" ? String(value).trim() : formatted;
}

export function toQuasarTimeValue(value) {
  const formatted = normalizeEventTime(value);
  if (!formatted) return null;
  const match = formatted.match(/^(\d{2}):(\d{2})\s*(am|pm)$/i);
  if (!match) return null;
  return `${match[1]}:${match[2]} ${match[3].toUpperCase()}`;
}

export function fromQuasarTimeValue(value) {
  if (!value) return "";
  const match = String(value).match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return normalizeEventTime(value);
  return `${String(Number(match[1])).padStart(2, "0")}:${match[2]} ${match[3].toLowerCase()}`;
}
