export function normalizeTagList(value) {
  if (value == null || value === "") return [];
  const raw = Array.isArray(value) ? value : [value];
  const seen = new Set();
  const tags = [];

  raw.forEach((entry) => {
    String(entry)
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .forEach((tag) => {
        const key = tag.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        tags.push(tag);
      });
  });

  return tags;
}

export function participantTagNames(participant) {
  return Array.isArray(participant?.tags) ? participant.tags.filter(Boolean).map(String) : [];
}

export function participantHasAnyTag(participant, tags) {
  const selected = normalizeTagList(tags);
  if (!selected.length) return true;

  const haystack = new Set(participantTagNames(participant).map((tag) => tag.toLowerCase()));
  return selected.some((tag) => haystack.has(tag.toLowerCase()));
}

export function filterParticipantsByTags(participants, tags, { exclude = false } = {}) {
  const selected = normalizeTagList(tags);
  if (!selected.length) return participants || [];
  return (participants || []).filter((participant) => {
    const hasTag = participantHasAnyTag(participant, selected);
    return exclude ? !hasTag : hasTag;
  });
}

export function uniqueParticipantTags(participants) {
  const seen = new Set();
  const tags = [];

  (participants || []).forEach((participant) => {
    participantTagNames(participant).forEach((tag) => {
      const key = tag.toLowerCase();
      if (seen.has(key)) return;
      seen.add(key);
      tags.push(tag);
    });
  });

  return tags.sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

export function filterParticipantsBySearch(participants, search) {
  const needle = String(search || "")
    .trim()
    .toLowerCase();
  if (!needle) return participants || [];

  return (participants || []).filter((row) => {
    const haystack = [
      row.firstName,
      row.lastName,
      row.fullName,
      row.displayFirstName,
      row.displayLastName,
      row.churchName,
      row.reservationLabel,
      row.displayChurch,
      row.lifegroupName,
      row.email,
      row.phone,
      ...participantTagNames(row)
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(needle);
  });
}

export function filterParticipantsByAttendance(participants, status) {
  const mode = String(status || "all").toLowerCase();
  if (mode === "present") {
    return (participants || []).filter((row) => !!row.attendedAt);
  }
  if (mode === "absent") {
    return (participants || []).filter((row) => !row.attendedAt);
  }
  return participants || [];
}

export function filterParticipantsByGroup(
  participants,
  { source = null, churchId = null, lifeGroupId = null, reservationId = null } = {}
) {
  let rows = participants || [];

  if (source === "church") {
    rows = rows.filter((row) => {
      if (row.reservationId && !row.churchId) return false;
      return row.churchId != null;
    });

    if (churchId != null && churchId !== "") {
      rows = rows.filter((row) => String(row.churchId) === String(churchId));
    }

    if (lifeGroupId != null && lifeGroupId !== "") {
      rows = rows.filter((row) => String(row.lifegroupId) === String(lifeGroupId));
    }

    return rows;
  }

  if (source === "reservation") {
    rows = rows.filter((row) => row.reservationId && !row.churchId);

    if (reservationId != null && reservationId !== "") {
      rows = rows.filter((row) => String(row.reservationId) === String(reservationId));
    }

    return rows;
  }

  return rows;
}
