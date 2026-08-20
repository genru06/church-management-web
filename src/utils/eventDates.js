export function toDateOnly(value) {
  if (!value) return null;
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed.slice(0, 10) : null;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  return null;
}

export function eventSessions(event) {
  if (Array.isArray(event?.sessions) && event.sessions.length) {
    return event.sessions
      .map((session, index) => ({
        id: session.id != null ? Number(session.id) : null,
        eventId: session.eventId != null ? Number(session.eventId) : null,
        sessionDate: toDateOnly(session.sessionDate) || toDateOnly(session.date),
        sortOrder: Number(session.sortOrder || index + 1),
        label: session.label || `Day ${index + 1}`
      }))
      .filter((session) => !!session.sessionDate)
      .sort((a, b) => String(a.sessionDate).localeCompare(String(b.sessionDate)));
  }

  const dates = Array.isArray(event?.eventDates)
    ? event.eventDates
    : event?.eventDate
      ? [event.eventDate]
      : [];

  return [...new Set(dates.map(toDateOnly).filter(Boolean))]
    .sort()
    .map((sessionDate, index) => ({
      id: null,
      eventId: event?.id != null ? Number(event.id) : null,
      sessionDate,
      sortOrder: index + 1,
      label: `Day ${index + 1}`
    }));
}

export function eventDateValues(event) {
  return eventSessions(event).map((session) => session.sessionDate);
}

export function formatEventDate(value) {
  const dateOnly = toDateOnly(value);
  if (!dateOnly) return "—";
  const date = new Date(`${dateOnly}T00:00:00`);
  if (Number.isNaN(date.getTime())) return dateOnly;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function formatEventDates(event, emptyLabel = "—") {
  const sessions = eventSessions(event);
  if (!sessions.length) return emptyLabel;
  if (sessions.length === 1) return formatEventDate(sessions[0].sessionDate);
  const first = formatEventDate(sessions[0].sessionDate);
  const last = formatEventDate(sessions[sessions.length - 1].sessionDate);
  return `${first} – ${last} (${sessions.length} days)`;
}

export function formatSessionOption(session, { includeDate = true } = {}) {
  if (!session) return "Day";
  const label = session.label || "Day";
  if (!includeDate) return label;
  return `${label} · ${formatEventDate(session.sessionDate)}`;
}

export function pickDefaultSession(sessions, preferredId = null) {
  const list = sessions || [];
  if (!list.length) return null;
  if (preferredId != null && preferredId !== "") {
    const match = list.find((session) => String(session.id) === String(preferredId));
    if (match) return match;
  }
  const today = new Date().toISOString().slice(0, 10);
  const todaySession = list.find((session) => session.sessionDate === today);
  if (todaySession) return todaySession;
  const pastOrToday = list.filter((session) => session.sessionDate <= today);
  if (pastOrToday.length) return pastOrToday[pastOrToday.length - 1];
  return list[0];
}

export function attendanceForSession(participant, sessionId) {
  if (sessionId == null || sessionId === "") return participant?.attendedAt || null;
  const rows = Array.isArray(participant?.attendance) ? participant.attendance : [];
  const match = rows.find((row) => String(row.sessionId) === String(sessionId));
  return match?.attendedAt || null;
}

export function withSessionAttendance(participants, sessionId) {
  return (participants || []).map((participant) => ({
    ...participant,
    attendedAt: attendanceForSession(participant, sessionId)
  }));
}

export function sessionAttendanceCounts(participants, sessions) {
  const total = (participants || []).length;
  return (sessions || []).map((session) => {
    const attendedCount = (participants || []).filter((participant) =>
      attendanceForSession(participant, session.id)
    ).length;
    return {
      ...session,
      attendedCount,
      absentCount: Math.max(total - attendedCount, 0),
      attendanceRate: total ? Math.round((attendedCount / total) * 100) : 0
    };
  });
}

export function lastEventDate(event) {
  const dates = eventDateValues(event);
  return dates.length ? dates[dates.length - 1] : toDateOnly(event?.eventDate);
}
