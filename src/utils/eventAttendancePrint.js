export function getAttendancePrintUrl(eventId, { churchKey } = {}) {
  const base = `/events/${eventId}/attendance/print`;
  if (!churchKey) return base;
  return `${base}?church=${encodeURIComponent(churchKey)}`;
}
