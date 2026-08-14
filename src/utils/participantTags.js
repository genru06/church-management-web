export const PAID_TAG = "Paid";
export const UNPAID_TAG = "Unpaid";

const PAYMENT_TAG_KEYS = new Set([PAID_TAG.toLowerCase(), UNPAID_TAG.toLowerCase()]);

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

export function eventHasRegistrationFee(value) {
  if (value === true) return true;
  if (!value) return false;
  if (typeof value === "object") {
    return Number(value.registrationFee || 0) > 0;
  }
  return Number(value) > 0;
}

export function isPaymentTag(tag) {
  return PAYMENT_TAG_KEYS.has(String(tag || "").toLowerCase());
}

export function paymentTagColor(tag) {
  const key = String(tag || "").toLowerCase();
  if (key === "paid") return "positive";
  if (key === "unpaid") return "warning";
  return null;
}

export function participantPaymentTag(participant) {
  return participant?.registrationPaid ? PAID_TAG : UNPAID_TAG;
}

export function participantTagNames(participant, { hasRegistrationFee = false } = {}) {
  const stored = Array.isArray(participant?.tags) ? participant.tags.filter(Boolean).map(String) : [];
  if (!hasRegistrationFee) return stored;

  const tags = stored.filter((tag) => !isPaymentTag(tag));
  tags.push(participantPaymentTag(participant));
  return tags;
}

export function participantHasAnyTag(participant, tags, { hasRegistrationFee = false } = {}) {
  const selected = normalizeTagList(tags);
  if (!selected.length) return true;

  const haystack = new Set(
    participantTagNames(participant, { hasRegistrationFee }).map((tag) => tag.toLowerCase())
  );
  return selected.some((tag) => haystack.has(tag.toLowerCase()));
}

export function filterParticipantsByTags(participants, tags, { exclude = false, hasRegistrationFee = false } = {}) {
  const selected = normalizeTagList(tags);
  if (!selected.length) return participants || [];
  return (participants || []).filter((participant) => {
    const hasTag = participantHasAnyTag(participant, selected, { hasRegistrationFee });
    return exclude ? !hasTag : hasTag;
  });
}

export function uniqueParticipantTags(participants, { hasRegistrationFee = false } = {}) {
  const seen = new Set();
  const tags = [];

  const add = (tag) => {
    const key = String(tag || "").toLowerCase();
    if (!key || seen.has(key)) return;
    seen.add(key);
    tags.push(tag);
  };

  if (hasRegistrationFee) {
    add(PAID_TAG);
    add(UNPAID_TAG);
  }

  (participants || []).forEach((participant) => {
    participantTagNames(participant, { hasRegistrationFee }).forEach(add);
  });

  return tags.sort((a, b) => {
    if (hasRegistrationFee) {
      const rank = (tag) => {
        const key = String(tag).toLowerCase();
        if (key === "paid") return 0;
        if (key === "unpaid") return 1;
        return 2;
      };
      const diff = rank(a) - rank(b);
      if (diff !== 0) return diff;
    }
    return a.localeCompare(b, undefined, { sensitivity: "base" });
  });
}

export function filterParticipantsBySearch(participants, search, { hasRegistrationFee = false } = {}) {
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
      ...participantTagNames(row, { hasRegistrationFee })
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
