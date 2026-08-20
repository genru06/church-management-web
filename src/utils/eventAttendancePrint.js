import { normalizeTagList } from "./participantTags";

export function getAttendancePrintUrl(
  eventId,
  {
    churchKey,
    tags,
    search,
    excludeTags = false,
    attendanceStatus,
    lifeGroupId,
    source,
    sessionId
  } = {}
) {
  const base = `/events/${eventId}/attendance/print`;
  const params = new URLSearchParams();

  if (source) {
    params.set("source", String(source));
  }

  if (sessionId != null && sessionId !== "") {
    params.set("session", String(sessionId));
  }

  if (churchKey) {
    params.set("church", String(churchKey));
  }

  if (lifeGroupId != null && lifeGroupId !== "") {
    params.set("lifeGroupId", String(lifeGroupId));
  }

  normalizeTagList(tags).forEach((tag) => {
    params.append("tag", tag);
  });

  if (excludeTags && normalizeTagList(tags).length) {
    params.set("excludeTags", "1");
  }

  const searchTerm = String(search || "").trim();
  if (searchTerm) {
    params.set("search", searchTerm);
  }

  const status = String(attendanceStatus || "all").toLowerCase();
  if (status === "present" || status === "absent") {
    params.set("attendance", status);
  }

  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}
