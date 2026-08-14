<template>
  <q-page class="attendance-print-page">
    <div class="attendance-print-page__toolbar no-print">
      <q-btn flat dense round icon="arrow_back" color="grey-7" @click="goBack" />
      <div class="attendance-print-page__toolbar-title">Print attendance sheet</div>
      <q-btn
        dense
        unelevated
        no-caps
        color="primary"
        icon="print"
        label="Print"
        :disable="!participants.length || loading"
        @click="printSheet"
      />
    </div>

    <q-inner-loading :showing="loading">
      <q-spinner size="36px" color="primary" />
    </q-inner-loading>

    <article v-if="event && !loading" class="attendance-print-page__sheet">
      <header class="attendance-print-page__header">
        <div class="attendance-print-page__heading">
          <h1 class="attendance-print-page__title">Attendance Sheet</h1>
          <h2 class="attendance-print-page__event">{{ event.name }}</h2>
        </div>
        <p class="attendance-print-page__meta">
          {{ formatDate(event.eventDate) }} · {{ formatEventTime(event.eventTime) }} · {{ event.location }}
          <template v-if="groupFilterLabel"> · {{ groupFilterLabel }}</template>
          <template v-if="tagLabel">
            · {{ excludeTags ? "Excluding tag" : "Tag" }}{{ tagFilter.length > 1 ? "s" : "" }}: {{ tagLabel }}
          </template>
          <template v-if="searchFilter"> · Search: {{ searchFilter }}</template>
          <template v-if="attendanceStatusLabel"> · {{ attendanceStatusLabel }}</template>
          · {{ participants.length }} participant(s)
        </p>
      </header>

      <table class="attendance-print-page__table">
        <thead>
          <tr>
            <th class="attendance-print-page__col-qr">QR Code</th>
            <th>Last Name</th>
            <th>First Name</th>
            <th>Church</th>
            <th>LifeGroup</th>
            <th v-if="hasRegistrationFee">Paid</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="participant in participants" :key="participant.id">
            <td class="attendance-print-page__col-qr">
              <img
                v-if="qrByParticipant[participant.id]"
                :src="qrByParticipant[participant.id]"
                :alt="`QR for ${participant.fullName}`"
                class="attendance-print-page__qr"
              />
            </td>
            <td>{{ participant.lastName || "—" }}</td>
            <td>{{ participant.firstName || "—" }}</td>
            <td>{{ participant.churchName || participant.reservationLabel || "—" }}</td>
            <td>{{ participant.lifegroupName || "—" }}</td>
            <td v-if="hasRegistrationFee">{{ participant.registrationPaid ? "Paid" : "Unpaid" }}</td>
          </tr>
        </tbody>
      </table>
    </article>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { api } from "src/boot/axios";
import { buildCheckInPayload, generateQrDataUrl } from "src/utils/eventQr";
import { formatEventTime } from "src/utils/eventTime";
import {
  eventHasRegistrationFee,
  filterParticipantsByAttendance,
  filterParticipantsByGroup,
  filterParticipantsBySearch,
  filterParticipantsByTags,
  normalizeTagList
} from "src/utils/participantTags";

const props = defineProps({
  id: { type: [String, Number], required: true }
});

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const eventId = props.id || route.params.id;
const churchKey = computed(() => route.query.church || null);
const sourceFilter = computed(() => {
  const raw = route.query.source;
  if (raw == null) return null;
  const value = String(Array.isArray(raw) ? raw[0] : raw).toLowerCase();
  return value === "church" || value === "reservation" ? value : null;
});
const lifeGroupFilterId = computed(() => {
  const raw = route.query.lifeGroupId;
  if (raw == null || raw === "") return null;
  const value = Number(Array.isArray(raw) ? raw[0] : raw);
  return Number.isInteger(value) && value > 0 ? value : null;
});
const tagFilter = computed(() => normalizeTagList(route.query.tag));
const excludeTags = computed(() => {
  const raw = route.query.excludeTags;
  if (raw == null) return false;
  const value = String(Array.isArray(raw) ? raw[0] : raw).toLowerCase();
  return value === "1" || value === "true";
});
const searchFilter = computed(() => {
  const raw = route.query.search;
  if (raw == null) return "";
  return String(Array.isArray(raw) ? raw[0] : raw).trim();
});
const attendanceStatus = computed(() => {
  const raw = route.query.attendance;
  if (raw == null) return "all";
  const value = String(Array.isArray(raw) ? raw[0] : raw).toLowerCase();
  return value === "present" || value === "absent" ? value : "all";
});
const reservationFilterId = computed(() => {
  const key = String(churchKey.value || "");
  const match = key.match(/^reservation-(\d+)$/);
  return match ? Number(match[1]) : null;
});
const churchFilterId = computed(() => {
  if (!churchKey.value || reservationFilterId.value) return null;
  if (churchKey.value === "unassigned") return null;
  const value = Number(churchKey.value);
  return Number.isInteger(value) && value > 0 ? value : null;
});

const loading = ref(false);
const event = ref(null);
const allParticipants = ref([]);
const qrByParticipant = ref({});
const hasRegistrationFee = computed(() => eventHasRegistrationFee(event.value));

const participants = computed(() => {
  let rows = [...allParticipants.value];

  const inferredSource =
    sourceFilter.value ||
    (reservationFilterId.value ? "reservation" : churchKey.value || lifeGroupFilterId.value ? "church" : null);

  if (inferredSource === "church" || inferredSource === "reservation") {
    rows = filterParticipantsByGroup(rows, {
      source: inferredSource,
      churchId: churchFilterId.value,
      lifeGroupId: lifeGroupFilterId.value,
      reservationId: reservationFilterId.value
    });
  } else if (reservationFilterId.value) {
    rows = rows.filter(
      (participant) => Number(participant.reservationId) === reservationFilterId.value
    );
  } else if (churchKey.value) {
    rows = rows.filter((participant) => {
      if (participant.reservationId && !participant.churchId) return false;
      const key = participant.churchId ?? "unassigned";
      return String(key) === String(churchKey.value);
    });
  }

  rows = filterParticipantsByTags(rows, tagFilter.value, {
    exclude: excludeTags.value,
    hasRegistrationFee: hasRegistrationFee.value
  });
  rows = filterParticipantsBySearch(rows, searchFilter.value, {
    hasRegistrationFee: hasRegistrationFee.value
  });
  rows = filterParticipantsByAttendance(rows, attendanceStatus.value);

  return rows.sort((a, b) => {
    const last = (a.lastName || a.fullName || "").localeCompare(b.lastName || b.fullName || "");
    if (last !== 0) return last;
    return (a.firstName || "").localeCompare(b.firstName || "");
  });
});

const groupFilterLabel = computed(() => {
  const parts = [];

  if (sourceFilter.value === "reservation" || reservationFilterId.value) {
    const label =
      participants.value[0]?.reservationLabel ||
      (reservationFilterId.value ? `Reservation ${reservationFilterId.value}` : "Reserved guest");
    parts.push(`Reserved guest: ${label}`);
  } else if (sourceFilter.value === "church" || churchFilterId.value || lifeGroupFilterId.value) {
    const churchName =
      participants.value[0]?.churchName ||
      (churchFilterId.value ? `Church ${churchFilterId.value}` : "Church");
    parts.push(`Church: ${churchName}`);
    if (lifeGroupFilterId.value) {
      const lifeGroupName =
        participants.value.find((row) => Number(row.lifegroupId) === lifeGroupFilterId.value)
          ?.lifegroupName || `LifeGroup ${lifeGroupFilterId.value}`;
      parts.push(`LifeGroup: ${lifeGroupName}`);
    }
  } else if (churchKey.value) {
    const prefix = reservationFilterId.value ? "Reservation list" : "Church";
    const label =
      reservationFilterId.value
        ? participants.value[0]?.reservationLabel || `Reservation ${reservationFilterId.value}`
        : churchKey.value === "unassigned"
          ? "Unassigned"
          : participants.value[0]?.churchName || churchKey.value;
    parts.push(`${prefix}: ${label}`);
  }

  return parts.join(" · ");
});

const tagLabel = computed(() => tagFilter.value.join(", "));

const attendanceStatusLabel = computed(() => {
  if (attendanceStatus.value === "present") return "Present only";
  if (attendanceStatus.value === "absent") return "Absent only";
  return "";
});

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function goBack() {
  router.push(`/events/${eventId}/attendance`);
}

function printSheet() {
  window.print();
}

async function loadQrCodes(rows) {
  const entries = await Promise.all(
    rows.map(async (participant) => {
      const payload = buildCheckInPayload(eventId, participant);
      const dataUrl = await generateQrDataUrl(payload, 200);
      return [participant.id, dataUrl];
    })
  );
  qrByParticipant.value = Object.fromEntries(entries);
}

async function loadPrintSheet() {
  loading.value = true;
  try {
    const [eventRes, participantsRes] = await Promise.all([
      api.get(`/events/${eventId}`),
      api.get(`/events/${eventId}/participants`)
    ]);
    event.value = eventRes.data;
    allParticipants.value = participantsRes.data;
    await loadQrCodes(participants.value);
  } catch {
    $q.notify({ type: "negative", message: "Failed to load attendance sheet for printing." });
    router.push(`/events/${eventId}`);
  } finally {
    loading.value = false;
  }
}

onMounted(loadPrintSheet);
</script>

<style scoped lang="scss">
.attendance-print-page {
  padding: 12px 16px 24px;
  max-width: 1100px;
  margin: 0 auto;
}

.attendance-print-page__toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.attendance-print-page__toolbar-title {
  flex: 1;
  font-size: 0.95rem;
  font-weight: 600;
  color: #1a1a2e;
}

.attendance-print-page__sheet {
  background: #fff;
  border: 1px solid #e4e8ef;
  border-radius: 8px;
  padding: 12px 16px;
}

.attendance-print-page__header {
  margin-bottom: 10px;
}

.attendance-print-page__heading {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6px 10px;
}

.attendance-print-page__title {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: #1a1a2e;
}

.attendance-print-page__event {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1a1a2e;
}

.attendance-print-page__meta {
  margin: 2px 0 0;
  font-size: 0.75rem;
  line-height: 1.35;
  color: #4b5563;
}

.attendance-print-page__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
  color: #1a1a2e;

  th,
  td {
    border: 1px solid #9ca3af;
    padding: 8px 10px;
    text-align: left;
    vertical-align: middle;
  }

  th {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    background: #f3f4f6;
  }

  tbody tr:nth-child(even) td {
    background: #fafbfc;
  }
}

.attendance-print-page__col-qr {
  width: 88px;
  text-align: center;
}

.attendance-print-page__qr {
  width: 72px;
  height: 72px;
  display: block;
  margin: 0 auto;
}

@media print {
  :global(body) {
    background: #fff !important;
  }

  :global(.q-header),
  :global(.q-drawer),
  :global(.q-footer) {
    display: none !important;
  }

  :global(.q-page-container) {
    padding: 0 !important;
  }

  .no-print {
    display: none !important;
  }

  .attendance-print-page {
    padding: 0;
    max-width: none;
  }

  .attendance-print-page__sheet {
    border: none;
    border-radius: 0;
    padding: 0;
  }

  .attendance-print-page__table {
    page-break-inside: auto;

    tr {
      page-break-inside: avoid;
      page-break-after: auto;
    }

    thead {
      display: table-header-group;
    }
  }
}
</style>
