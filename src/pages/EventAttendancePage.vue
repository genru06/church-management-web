<template>
  <q-page class="entity-page">
    <header class="entity-page__header">
      <div class="entity-page__heading">
        <q-btn flat dense round icon="arrow_back" color="grey-7" @click="router.push(`/events/${eventId}`)" />
        <h1 class="entity-page__title">Attendance sheet</h1>
      </div>
      <div class="entity-page__actions">
        <q-btn
          dense
          outline
          no-caps
          color="primary"
          icon="print"
          label="Print sheet"
          :disable="!filteredParticipants.length"
          @click="printFiltered"
        />
        <q-btn
          dense
          unelevated
          no-caps
          color="primary"
          icon="qr_code_scanner"
          label="Open scanner"
          @click="router.push(`/events/${eventId}/scan`)"
        />
      </div>
    </header>

    <q-inner-loading :showing="loading">
      <q-spinner size="36px" color="primary" />
    </q-inner-loading>

    <section v-if="event" class="entity-page__panel q-mb-md">
      <div class="attendance-sheet__event">
        <h2>{{ event.name }}</h2>
        <p>{{ formatDate(event.eventDate) }} · {{ formatEventTime(event.eventTime) }} · {{ event.location }}</p>
      </div>
    </section>

    <section class="entity-page__panel">
      <q-table
        :rows="filteredParticipants"
        :columns="columns"
        row-key="id"
        flat
        dense
        :filter="participantFilter"
        :filter-method="filterParticipants"
        :pagination="{ rowsPerPage: 25 }"
        class="entity-table"
      >
        <template #top>
          <div class="attendance-sheet__toolbar">
            <q-input
              v-model="participantFilter"
              dense
              borderless
              clearable
              placeholder="Search participants…"
              class="entity-table__search"
            >
              <template #prepend>
                <q-icon name="search" size="18px" color="grey-6" />
              </template>
            </q-input>

            <AppSelect
              v-model="groupSource"
              :options="groupSourceOptions"
              dense
              borderless
              clearable
              emit-value
              map-options
              placeholder="Church / Reserved guest"
              class="attendance-sheet__select"
            >
              <template #prepend>
                <q-icon name="filter_list" size="18px" color="grey-6" />
              </template>
            </AppSelect>

            <AppSelect
              v-if="groupSource === 'church'"
              v-model="selectedChurchId"
              :options="churchOptions"
              dense
              borderless
              clearable
              emit-value
              map-options
              placeholder="Select church"
              class="attendance-sheet__select"
            >
              <template #prepend>
                <q-icon name="church" size="18px" color="grey-6" />
              </template>
            </AppSelect>

            <AppSelect
              v-if="groupSource === 'church'"
              v-model="selectedLifeGroupId"
              :options="lifeGroupOptions"
              dense
              borderless
              clearable
              emit-value
              map-options
              placeholder="Select LifeGroup"
              :disable="!selectedChurchId"
              class="attendance-sheet__select"
            >
              <template #prepend>
                <q-icon name="groups" size="18px" color="grey-6" />
              </template>
            </AppSelect>

            <AppSelect
              v-if="groupSource === 'reservation'"
              v-model="selectedReservationId"
              :options="reservationOptions"
              dense
              borderless
              clearable
              emit-value
              map-options
              placeholder="Select reserved group"
              class="attendance-sheet__select"
            >
              <template #prepend>
                <q-icon name="groups" size="18px" color="grey-6" />
              </template>
            </AppSelect>

            <q-btn-toggle
              v-model="attendanceStatus"
              no-caps
              unelevated
              dense
              toggle-color="primary"
              color="white"
              text-color="grey-8"
              :options="attendanceStatusOptions"
              class="attendance-sheet__status-mode"
            />
            <q-btn-toggle
              v-model="tagMode"
              no-caps
              unelevated
              dense
              toggle-color="primary"
              color="white"
              text-color="grey-8"
              :options="tagModeOptions"
              :disable="!tagFilter.length"
              class="attendance-sheet__tag-mode"
            />
            <AppSelect
              v-model="tagFilter"
              :options="tagOptions"
              dense
              borderless
              clearable
              multiple
              use-chips
              emit-value
              map-options
              placeholder="Filter by tags"
              class="attendance-sheet__tag-select"
            >
              <template #prepend>
                <q-icon name="sell" size="18px" color="grey-6" />
              </template>
            </AppSelect>
          </div>
        </template>

        <template #body-cell-fullName="props">
          <q-td :props="props">
            <button type="button" class="entity-table__link" @click="openParticipantQrDialog(props.row)">
              {{ props.row.fullName }}
            </button>
          </q-td>
        </template>

        <template #body-cell-churchName="props">
          <q-td :props="props">
            <span class="entity-table__muted">{{ participantGroupLabel(props.row) }}</span>
          </q-td>
        </template>

        <template #body-cell-lifegroupName="props">
          <q-td :props="props">
            <span class="entity-table__muted">{{ props.row.lifegroupName || "—" }}</span>
          </q-td>
        </template>

        <template #body-cell-tags="props">
          <q-td :props="props">
            <div v-if="displayTags(props.row).length" class="attendance-sheet__tags">
              <q-badge
                v-for="tag in displayTags(props.row)"
                :key="tag"
                :outline="!isPaymentTag(tag)"
                :color="tagColor(tag)"
                :label="tag"
              />
            </div>
            <span v-else class="entity-table__muted">—</span>
          </q-td>
        </template>

        <template #body-cell-attendedAt="props">
          <q-td :props="props">
            <q-badge :color="props.row.attendedAt ? 'positive' : 'grey'" :label="props.row.attendedAt ? 'Present' : 'Absent'" />
          </q-td>
        </template>

        <template #body-cell-checkedInAt="props">
          <q-td :props="props">
            <span class="entity-table__muted">{{ formatDateTime(props.row.attendedAt) }}</span>
          </q-td>
        </template>

        <template #body-cell-qrCode="props">
          <q-td :props="props">
            <div class="attendance-sheet__qr">
              <img v-if="qrByParticipant[props.row.id]" :src="qrByParticipant[props.row.id]" :alt="`QR for ${props.row.fullName}`" />
              <q-spinner v-else size="20px" color="primary" />
            </div>
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props" class="entity-table__actions">
            <q-btn
              v-if="!props.row.attendedAt"
              flat
              dense
              no-caps
              size="sm"
              color="primary"
              label="Mark present"
              @click="manualCheckIn(props.row)"
            />
            <q-btn
              v-else
              flat
              dense
              no-caps
              size="sm"
              color="negative"
              label="Revoke as present"
              @click="revokePresent(props.row)"
            />
          </q-td>
        </template>

        <template #no-data>
          <div class="full-width row flex-center q-pa-md text-grey-6">
            {{
              hasActiveFilters
                ? "No participants match your search."
                : "No participants yet."
            }}
          </div>
        </template>
      </q-table>
    </section>

    <q-dialog v-model="qrDialogOpen" @hide="resetParticipantQrDialog">
      <q-card class="entity-dialog attendance-qr-dialog">
        <header class="entity-dialog__header">
          <div>
            <h2 class="entity-dialog__title">Participant QR</h2>
            <p class="entity-dialog__subtitle">{{ event?.name || "Attendance sheet" }}</p>
          </div>
          <q-btn flat round dense icon="close" color="grey-7" @click="qrDialogOpen = false" />
        </header>

        <q-separator />

        <q-card-section class="entity-dialog__body attendance-qr-dialog__body">
          <div v-if="selectedParticipant" class="attendance-qr-dialog__content">
            <div class="attendance-qr-dialog__qr-wrap">
              <img
                v-if="selectedQrUrl"
                :src="selectedQrUrl"
                :alt="`QR for ${selectedParticipant.fullName}`"
                class="attendance-qr-dialog__qr"
              />
              <q-spinner v-else size="32px" color="primary" />
            </div>
            <p class="attendance-qr-dialog__id">ID #{{ participantDisplayId(selectedParticipant) }}</p>
            <h3 class="attendance-qr-dialog__name">{{ selectedParticipant.fullName }}</h3>
            <p class="attendance-qr-dialog__group">{{ participantGroupLabel(selectedParticipant) }}</p>
          </div>
        </q-card-section>

        <q-separator />

        <footer class="entity-dialog__footer">
          <q-btn flat no-caps label="Close" color="grey-8" @click="qrDialogOpen = false" />
        </footer>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { api } from "src/boot/axios";
import AppSelect from "src/components/AppSelect.vue";
import { compareChurchNamesMainFirst } from "src/utils/churchDisplay";
import { getAttendancePrintUrl } from "src/utils/eventAttendancePrint";
import { buildCheckInPayload, generateQrDataUrl } from "src/utils/eventQr";
import { formatEventTime } from "src/utils/eventTime";
import {
  eventHasRegistrationFee,
  filterParticipantsByAttendance,
  filterParticipantsByGroup,
  filterParticipantsBySearch,
  filterParticipantsByTags,
  isPaymentTag,
  participantTagNames,
  paymentTagColor,
  uniqueParticipantTags
} from "src/utils/participantTags";

const props = defineProps({
  id: { type: [String, Number], required: true }
});

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const eventId = props.id || route.params.id;

const loading = ref(false);
const event = ref(null);
const participants = ref([]);
const reservations = ref([]);
const qrByParticipant = ref({});
const participantFilter = ref("");
const tagFilter = ref([]);
const tagMode = ref("include");
const attendanceStatus = ref("all");
const groupSource = ref(null);
const selectedChurchId = ref(null);
const selectedLifeGroupId = ref(null);
const selectedReservationId = ref(null);
const qrDialogOpen = ref(false);
const selectedParticipant = ref(null);
const selectedQrUrl = ref("");

const tagModeOptions = [
  { label: "Include", value: "include" },
  { label: "Exclude", value: "exclude" }
];

const attendanceStatusOptions = [
  { label: "All", value: "all" },
  { label: "Present", value: "present" },
  { label: "Absent", value: "absent" }
];

const groupSourceOptions = [
  { label: "Church", value: "church" },
  { label: "Reserved guest", value: "reservation" }
];

const tagNameOptions = computed(() => ({
  hasRegistrationFee: eventHasRegistrationFee(event.value)
}));

const tagOptions = computed(() =>
  uniqueParticipantTags(participants.value, tagNameOptions.value).map((tag) => ({
    label: tag,
    value: tag
  }))
);

const churchOptions = computed(() => {
  const map = new Map();
  participants.value.forEach((participant) => {
    if (!participant.churchId) return;
    const id = Number(participant.churchId);
    if (map.has(id)) return;
    map.set(id, {
      label: participant.churchName || `Church ${id}`,
      value: id
    });
  });
  return Array.from(map.values()).sort((a, b) => compareChurchNamesMainFirst(a.label, b.label));
});

const lifeGroupOptions = computed(() => {
  if (!selectedChurchId.value) return [];
  const map = new Map();
  participants.value.forEach((participant) => {
    if (String(participant.churchId) !== String(selectedChurchId.value)) return;
    if (!participant.lifegroupId) return;
    const id = Number(participant.lifegroupId);
    if (map.has(id)) return;
    map.set(id, {
      label: participant.lifegroupName || `LifeGroup ${id}`,
      value: id
    });
  });
  return Array.from(map.values()).sort((a, b) =>
    String(a.label || "").localeCompare(String(b.label || ""), undefined, { sensitivity: "base" })
  );
});

const reservationOptions = computed(() =>
  [...(reservations.value || [])]
    .filter((row) => !row.churchId)
    .map((row) => ({
      label: row.label,
      value: Number(row.id)
    }))
    .sort((a, b) =>
      String(a.label || "").localeCompare(String(b.label || ""), undefined, { sensitivity: "base" })
    )
);

const filteredParticipants = computed(() => {
  let rows = filterParticipantsByGroup(participants.value, {
    source: groupSource.value,
    churchId: selectedChurchId.value,
    lifeGroupId: selectedLifeGroupId.value,
    reservationId: selectedReservationId.value
  });
  rows = filterParticipantsByTags(rows, tagFilter.value, {
    exclude: tagMode.value === "exclude",
    hasRegistrationFee: tagNameOptions.value.hasRegistrationFee
  });
  return filterParticipantsByAttendance(rows, attendanceStatus.value);
});

const hasActiveFilters = computed(
  () =>
    !!participantFilter.value ||
    tagFilter.value.length > 0 ||
    attendanceStatus.value !== "all" ||
    !!groupSource.value
);

const columns = [
  { name: "fullName", label: "Participant", field: "fullName", align: "left", sortable: true },
  { name: "churchName", label: "Church / List", field: "churchName", align: "left", sortable: true },
  { name: "lifegroupName", label: "LifeGroup", field: "lifegroupName", align: "left", sortable: true },
  { name: "tags", label: "Tags", field: "tags", align: "left" },
  { name: "email", label: "Email", field: "email", align: "left" },
  { name: "attendedAt", label: "Status", field: "attendedAt", align: "left" },
  { name: "checkedInAt", label: "Checked in at", field: "attendedAt", align: "left" },
  { name: "qrCode", label: "QR code", field: "qrCode", align: "center" },
  { name: "actions", label: "", field: "actions", align: "right" }
];

function filterParticipants(rows, terms) {
  return filterParticipantsBySearch(rows, terms, tagNameOptions.value);
}

function displayTags(participant) {
  return participantTagNames(participant, tagNameOptions.value);
}

function participantDisplayId(participant) {
  const memberId = Number(participant?.memberId);
  if (Number.isFinite(memberId) && memberId > 0) return memberId;
  return participant?.id || "—";
}

function participantGroupLabel(participant) {
  return participant?.churchName || participant?.reservationLabel || "—";
}

let qrDialogSeq = 0;

async function openParticipantQrDialog(participant) {
  const seq = ++qrDialogSeq;
  selectedParticipant.value = participant;
  selectedQrUrl.value = qrByParticipant.value[participant.id] || "";
  qrDialogOpen.value = true;

  try {
    const payload = buildCheckInPayload(eventId, participant);
    const dataUrl = await generateQrDataUrl(payload, 280);
    if (seq === qrDialogSeq) selectedQrUrl.value = dataUrl;
  } catch {
    if (seq === qrDialogSeq && !selectedQrUrl.value) {
      $q.notify({ type: "negative", message: "Failed to generate QR code." });
    }
  }
}

function resetParticipantQrDialog() {
  qrDialogSeq += 1;
  selectedParticipant.value = null;
  selectedQrUrl.value = "";
}

function tagColor(tag) {
  return paymentTagColor(tag) || "grey-7";
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function printFiltered() {
  let churchKey = null;
  if (groupSource.value === "church" && selectedChurchId.value != null) {
    churchKey = selectedChurchId.value;
  } else if (groupSource.value === "reservation" && selectedReservationId.value != null) {
    churchKey = `reservation-${selectedReservationId.value}`;
  }

  router.push(
    getAttendancePrintUrl(eventId, {
      source: groupSource.value || undefined,
      churchKey,
      lifeGroupId: groupSource.value === "church" ? selectedLifeGroupId.value : null,
      tags: tagFilter.value,
      search: participantFilter.value,
      excludeTags: tagMode.value === "exclude",
      attendanceStatus: attendanceStatus.value
    })
  );
}

async function loadQrCodes(rows) {
  const entries = await Promise.all(
    rows.map(async (participant) => {
      const payload = buildCheckInPayload(eventId, participant);
      const dataUrl = await generateQrDataUrl(payload);
      return [participant.id, dataUrl];
    })
  );
  qrByParticipant.value = Object.fromEntries(entries);
}

async function manualCheckIn(participant) {
  try {
    const { data } = await api.post(`/events/${eventId}/checkin`, {
      participantId: participant.id,
      token: participant.qrToken
    });
    const index = participants.value.findIndex((p) => p.id === participant.id);
    if (index >= 0) participants.value[index] = data;
    $q.notify({ type: "positive", message: `${participant.fullName} marked present.` });
  } catch {
    $q.notify({ type: "negative", message: "Failed to check in participant." });
  }
}

async function revokePresent(participant) {
  try {
    const { data } = await api.post(`/events/${eventId}/checkin/${participant.id}/cancel`);
    const index = participants.value.findIndex((p) => p.id === participant.id);
    if (index >= 0) participants.value[index] = data;
    $q.notify({ type: "positive", message: `${participant.fullName} marked absent.` });
  } catch {
    $q.notify({ type: "negative", message: "Failed to revoke attendance." });
  }
}

async function loadAttendance() {
  loading.value = true;
  try {
    const [eventRes, participantsRes, reservationsRes] = await Promise.all([
      api.get(`/events/${eventId}`),
      api.get(`/events/${eventId}/participants`),
      api.get(`/events/${eventId}/reservations`)
    ]);
    event.value = eventRes.data;
    participants.value = participantsRes.data;
    reservations.value = reservationsRes.data || [];
    await loadQrCodes(participantsRes.data);
  } catch {
    $q.notify({ type: "negative", message: "Failed to load attendance sheet." });
    router.push(`/events/${eventId}`);
  } finally {
    loading.value = false;
  }
}

watch(tagFilter, (tags) => {
  if (!tags.length && tagMode.value === "exclude") {
    tagMode.value = "include";
  }
});

watch(groupSource, () => {
  selectedChurchId.value = null;
  selectedLifeGroupId.value = null;
  selectedReservationId.value = null;
});

watch(selectedChurchId, () => {
  selectedLifeGroupId.value = null;
});

onMounted(loadAttendance);
</script>

<style scoped lang="scss">
.attendance-sheet__event {
  padding: 12px;

  h2 {
    margin: 0 0 4px;
    font-size: 0.95rem;
    font-weight: 600;
  }

  p {
    margin: 0;
    font-size: 0.8rem;
    color: #6b7280;
  }
}

.attendance-sheet__toolbar {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.attendance-sheet__tag-mode,
.attendance-sheet__status-mode {
  flex-shrink: 0;
  border: 1px solid #e4e8ef;
  border-radius: 6px;

  :deep(.q-btn) {
    min-height: 30px;
    padding: 0 10px;
    font-size: 0.75rem;
  }
}

.attendance-sheet__select,
.attendance-sheet__tag-select {
  min-width: 180px;
  max-width: 320px;
  flex: 1 1 180px;

  :deep(.q-field__control) {
    min-height: 30px;
    padding: 2px 8px;
    background: #f5f7fa;
    border-radius: 6px;
  }

  :deep(.q-field__native),
  :deep(.q-field__input) {
    font-size: 0.8rem;
    padding: 0;
    min-height: 24px;
  }

  :deep(.q-chip) {
    margin: 1px 2px;
    font-size: 0.72rem;
  }
}

.attendance-sheet__tag-select {
  min-width: 200px;
  max-width: 420px;
  flex: 1 1 220px;
}

.attendance-sheet__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.attendance-sheet__qr img {
  width: 72px;
  height: 72px;
  display: block;
}

.attendance-qr-dialog {
  width: min(380px, 92vw);
}

.attendance-qr-dialog__body {
  text-align: center;
}

.attendance-qr-dialog__content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.attendance-qr-dialog__qr-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 260px;
}

.attendance-qr-dialog__qr {
  width: min(260px, 70vw);
  height: auto;
  aspect-ratio: 1;
  display: block;
  background: #fff;
  border: 1px solid #e4e8ef;
  border-radius: 8px;
}

.attendance-qr-dialog__id {
  margin: 12px 0 0;
  font-size: 0.78rem;
  color: #8b93a1;
}

.attendance-qr-dialog__name {
  margin: 4px 0 0;
  font-size: 1.05rem;
  font-weight: 600;
  line-height: 1.3;
  color: #1a1a2e;
}

.attendance-qr-dialog__group {
  margin: 4px 0 0;
  font-size: 0.85rem;
  color: #6b7280;
}
</style>
