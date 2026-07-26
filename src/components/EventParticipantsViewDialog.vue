<template>
  <q-dialog
    :model-value="modelValue"
    maximized
    @update:model-value="$emit('update:modelValue', $event)"
    @show="onShow"
    @hide="onHide"
  >
    <q-card class="participants-view-dialog">
      <header class="participants-view-dialog__header">
        <div class="participants-view-dialog__heading">
          <q-btn flat dense round icon="arrow_back" color="grey-7" @click="close" />
          <div>
            <h2 class="participants-view-dialog__title">Participants</h2>
            <p class="participants-view-dialog__subtitle">
              {{ event?.name || "Event" }} · {{ participants.length }} participant(s)
            </p>
          </div>
        </div>

        <div class="participants-view-dialog__toolbar">
          <q-btn-toggle
            v-model="viewMode"
            no-caps
            unelevated
            toggle-color="primary"
            color="white"
            text-color="grey-8"
            :options="viewModeOptions"
            class="participants-view-dialog__toggle"
          />
          <q-btn flat round dense icon="close" color="grey-7" @click="close" />
        </div>
      </header>

      <q-separator />

      <q-card-section class="participants-view-dialog__body">
        <div v-if="!participants.length && !reservations.length" class="participants-view-dialog__empty">
          <q-icon name="groups" size="32px" color="grey-5" />
          <p>No participants yet.</p>
        </div>

        <template v-else-if="viewMode === 'all'">
          <div v-if="!participants.length" class="participants-view-dialog__empty">
            <q-icon name="groups" size="32px" color="grey-5" />
            <p>No participants yet.</p>
          </div>
          <q-table
            v-else
            :rows="sortedParticipants"
            :columns="allColumns"
            row-key="id"
            flat
            dense
            :filter="participantFilter"
            :filter-method="filterParticipants"
            :pagination="{ rowsPerPage: 25, sortBy: 'displayLastName', descending: false }"
            class="participants-view-dialog__table entity-table entity-page__panel"
          >
            <template #top>
              <div class="entity-table__toolbar">
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
              </div>
            </template>

            <template #body-cell-churchName="props">
              <q-td :props="props">
                <span class="entity-table__muted">{{ props.row.displayChurch || "—" }}</span>
              </q-td>
            </template>

            <template #body-cell-lifegroupName="props">
              <q-td :props="props">
                <span class="entity-table__muted">{{ props.row.lifegroupName || "—" }}</span>
              </q-td>
            </template>

            <template #body-cell-registrationPaid="props">
              <q-td :props="props">
                <q-badge
                  :color="props.row.registrationPaid ? 'positive' : 'warning'"
                  :label="props.row.registrationPaid ? 'Paid' : 'Unpaid'"
                />
              </q-td>
            </template>

            <template #body-cell-attendedAt="props">
              <q-td :props="props">
                <q-badge
                  :color="props.row.attendedAt ? 'positive' : 'grey'"
                  :label="props.row.attendedAt ? 'Present' : 'Absent'"
                />
              </q-td>
            </template>

            <template #no-data>
              <div class="full-width row flex-center q-pa-md text-grey-6">
                {{
                  participantFilter
                    ? "No participants match your search."
                    : "No participants yet."
                }}
              </div>
            </template>
          </q-table>
        </template>

        <template v-else>
          <div v-if="!churchGroups.length && !guestReservations.length" class="participants-view-dialog__empty">
            <q-icon name="church" size="32px" color="grey-5" />
            <p>No churches to show yet.</p>
          </div>

          <div v-else>
            <section
              v-if="guestReservations.length"
              class="participants-view-dialog__reservation-section"
            >
              <div class="participants-view-dialog__reservation-section-header">
                <div>
                  <h3 class="participants-view-dialog__reservation-section-title">
                    Guest reservations
                  </h3>
                  <p class="participants-view-dialog__reservation-section-meta">
                    Expected guests who are not members of any registered church ·
                    {{ guestReservationTotal }} reserved ·
                    {{ guestReservationRegisteredTotal }} registered
                  </p>
                </div>
              </div>

              <div class="row q-col-gutter-md participants-view-dialog__cards">
                <div
                  v-for="(reservation, index) in guestReservations"
                  :key="reservation.key"
                  class="col-12 col-sm-6 col-md-4 col-lg-3"
                >
                  <q-card
                    flat
                    bordered
                    class="participants-view-dialog__stat-card"
                    :class="{ 'participants-view-dialog__stat-card--active': selectedKey === reservation.key }"
                    @click="selectGroup(reservation)"
                  >
                    <q-card-section class="row items-center no-wrap">
                      <q-avatar
                        :color="cardColor(index + 2)"
                        text-color="white"
                        icon="groups"
                      />
                      <div class="q-ml-md participants-view-dialog__stat-text">
                        <div class="participants-view-dialog__stat-label">
                          {{ reservation.label }}
                        </div>
                        <div class="participants-view-dialog__stat-value">
                          {{ reservation.participants.length }}
                          <span class="participants-view-dialog__stat-reserved">
                            / {{ reservation.reservedCount }} reserved
                          </span>
                        </div>
                      </div>
                    </q-card-section>
                  </q-card>
                </div>
              </div>
            </section>

            <div class="row q-col-gutter-md participants-view-dialog__cards">
              <div
                v-for="(group, index) in churchGroups"
                :key="group.key"
                class="col-12 col-sm-6 col-md-4 col-lg-3"
              >
                <q-card
                  flat
                  bordered
                  class="participants-view-dialog__stat-card"
                  :class="{ 'participants-view-dialog__stat-card--active': selectedKey === group.key }"
                  @click="selectGroup(group)"
                >
                  <q-card-section class="row items-center no-wrap">
                    <q-avatar :color="cardColor(index)" text-color="white" icon="church" />
                    <div class="q-ml-md participants-view-dialog__stat-text">
                      <div class="participants-view-dialog__stat-label">{{ group.churchName }}</div>
                      <div class="participants-view-dialog__stat-value">{{ group.participants.length }}</div>
                      <div v-if="group.kidsCount" class="participants-view-dialog__stat-breakdown">
                        <span>{{ group.adultCount }} adults</span>
                        <span>{{ group.kidsCount }} kids</span>
                      </div>
                    </div>
                  </q-card-section>
                </q-card>
              </div>
            </div>

            <section v-if="selectedGroup" class="participants-view-dialog__detail entity-page__panel">
              <div class="participants-view-dialog__detail-header">
                <div>
                  <h3 class="participants-view-dialog__detail-title">{{ selectedGroup.title }}</h3>
                  <p class="participants-view-dialog__detail-meta">
                    {{ selectedGroup.participants.length }} participant(s)
                    <span v-if="selectedGroup.isReservation">
                      · {{ selectedGroup.reservedCount }} reserved
                    </span>
                    <span v-if="selectedGroup.kidsCount">
                      · {{ selectedGroup.adultCount }} adults · {{ selectedGroup.kidsCount }} kids
                    </span>
                    <span v-if="selectedGroup.attendedCount"> · {{ selectedGroup.attendedCount }} attended</span>
                  </p>
                </div>
                <div class="participants-view-dialog__detail-actions">
                  <q-btn
                    v-if="canLinkSelectedGroup"
                    dense
                    outline
                    no-caps
                    color="secondary"
                    icon="link"
                    label="Link to members"
                    :loading="linkingMembers"
                    :disable="linkingMembers"
                    @click="linkToMembers"
                  />
                  <q-btn
                    dense
                    outline
                    no-caps
                    color="primary"
                    icon="print"
                    label="Print sheet"
                    :disable="!selectedGroup.participants.length"
                    @click="printGroup(selectedGroup)"
                  />
                  <q-btn
                    dense
                    unelevated
                    no-caps
                    color="primary"
                    icon="download"
                    label="Export Excel"
                    :disable="!selectedGroup.participants.length"
                    @click="exportGroup(selectedGroup)"
                  />
                </div>
              </div>

              <q-table
                :rows="selectedGroup.participants"
                :columns="churchColumns"
                row-key="id"
                flat
                dense
                :pagination="{ rowsPerPage: 25, sortBy: 'displayLastName', descending: false }"
                class="participants-view-dialog__table entity-table"
              >
                <template #body-cell-lifegroupName="props">
                  <q-td :props="props">
                    <span class="entity-table__muted">{{ props.row.lifegroupName || "—" }}</span>
                  </q-td>
                </template>

                <template #body-cell-attendedAt="props">
                  <q-td :props="props">
                    <q-badge
                      :color="props.row.attendedAt ? 'positive' : 'grey'"
                      :label="props.row.attendedAt ? 'Present' : 'Absent'"
                    />
                  </q-td>
                </template>

                <template #body-cell-qrCode="props">
                  <q-td :props="props">
                    <div class="participants-view-dialog__qr">
                      <img
                        v-if="qrByParticipant[props.row.id]"
                        :src="qrByParticipant[props.row.id]"
                        :alt="`QR for ${props.row.fullName}`"
                      />
                      <q-spinner v-else size="20px" color="primary" />
                    </div>
                  </q-td>
                </template>

                <template #no-data>
                  <div class="full-width row flex-center q-pa-md text-grey-6">
                    {{
                      selectedGroup.isReservation
                        ? "No registered participants for this reservation list yet."
                        : "No registered participants for this church yet."
                    }}
                  </div>
                </template>
              </q-table>
            </section>
          </div>
        </template>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { api } from "src/boot/axios";
import { buildCheckInPayload, generateQrDataUrl } from "src/utils/eventQr";
import { exportParticipantsToExcel } from "src/utils/eventParticipantExcel";
import { getAttendancePrintUrl } from "src/utils/eventAttendancePrint";
import { compareChurchNamesMainFirst } from "src/utils/churchDisplay";

const CARD_COLORS = ["primary", "secondary", "accent", "positive", "orange", "purple"];

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  eventId: { type: [String, Number], default: null },
  event: { type: Object, default: null },
  participants: { type: Array, default: () => [] },
  reservations: { type: Array, default: () => [] },
  hasRegistrationFee: { type: Boolean, default: false },
  initialView: { type: String, default: "all" }
});

const emit = defineEmits(["update:modelValue", "linked"]);

const $q = useQuasar();
const router = useRouter();
const viewMode = ref("all");
const qrByParticipant = ref({});
const selectedKey = ref(null);
const participantFilter = ref("");
const linkingMembers = ref(false);

const viewModeOptions = [
  { label: "All participants", value: "all" },
  { label: "By church", value: "church" }
];

const sortedParticipants = computed(() =>
  [...props.participants]
    .map((participant) => ({
      ...participant,
      displayLastName: participant.lastName || participant.fullName || "—",
      displayFirstName:
        participant.firstName ||
        (participant.lastName || !participant.fullName ? "—" : ""),
      displayChurch: participant.churchName || participant.reservationLabel || "—"
    }))
    .sort((a, b) => {
      const last = (a.displayLastName || "").localeCompare(b.displayLastName || "");
      if (last !== 0) return last;
      return (a.displayFirstName || "").localeCompare(b.displayFirstName || "");
    })
);

function filterParticipants(rows, terms) {
  const needle = String(terms || "")
    .trim()
    .toLowerCase();
  if (!needle) return rows;

  return rows.filter((row) => {
    const haystack = [
      row.firstName,
      row.lastName,
      row.fullName,
      row.displayFirstName,
      row.displayLastName,
      row.churchName,
      row.reservationLabel,
      row.lifegroupName,
      row.email,
      row.phone,
      ...(Array.isArray(row.tags) ? row.tags : [])
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(needle);
  });
}

const allColumns = computed(() => {
  const columns = [
    { name: "displayLastName", label: "Last name", field: "displayLastName", align: "left", sortable: true },
    { name: "displayFirstName", label: "First name", field: "displayFirstName", align: "left", sortable: true },
    { name: "churchName", label: "Church / List", field: "displayChurch", align: "left", sortable: true },
    { name: "lifegroupName", label: "LifeGroup", field: "lifegroupName", align: "left", sortable: true }
  ];

  if (props.hasRegistrationFee) {
    columns.push({
      name: "registrationPaid",
      label: "Paid",
      field: "registrationPaid",
      align: "left"
    });
  }

  columns.push({
    name: "attendedAt",
    label: "Status",
    field: "attendedAt",
    align: "left"
  });

  return columns;
});

const churchColumns = [
  { name: "displayLastName", label: "Last name", field: "displayLastName", align: "left", sortable: true },
  { name: "displayFirstName", label: "First name", field: "displayFirstName", align: "left", sortable: true },
  { name: "lifegroupName", label: "LifeGroup", field: "lifegroupName", align: "left" },
  { name: "attendedAt", label: "Status", field: "attendedAt", align: "left" },
  { name: "qrCode", label: "QR code", field: "qrCode", align: "center" }
];

function mapParticipantRow(participant) {
  return {
    ...participant,
    displayLastName: participant.lastName || participant.fullName || "—",
    displayFirstName:
      participant.firstName ||
      (participant.lastName || !participant.fullName ? "—" : "")
  };
}

function sortParticipantRows(participants) {
  return [...participants].sort((a, b) => {
    const last = (a.displayLastName || "").localeCompare(b.displayLastName || "");
    if (last !== 0) return last;
    return (a.displayFirstName || "").localeCompare(b.displayFirstName || "");
  });
}

const churchGroups = computed(() => {
  const map = new Map();

  props.participants.forEach((participant) => {
    if (participant.reservationId && !participant.churchId) return;

    const key = participant.churchId ?? "unassigned";
    const churchName = participant.churchName || "Unassigned";

    if (!map.has(key)) {
      map.set(key, {
        key,
        churchId: participant.churchId ?? null,
        churchName,
        title: churchName,
        isReservation: false,
        participants: [],
        attendedCount: 0,
        kidsCount: 0
      });
    }

    const group = map.get(key);
    group.participants.push(mapParticipantRow(participant));
    if (participant.attendedAt) {
      group.attendedCount += 1;
    }
    if (participant.isKid) {
      group.kidsCount += 1;
    }
  });

  return Array.from(map.values())
    .map((group) => ({
      ...group,
      adultCount: group.participants.length - group.kidsCount,
      participants: sortParticipantRows(group.participants)
    }))
    .sort((a, b) => compareChurchNamesMainFirst(a.churchName, b.churchName));
});

const guestReservations = computed(() => {
  const participantsByReservation = new Map();

  props.participants.forEach((participant) => {
    if (!participant.reservationId || participant.churchId) return;
    const key = Number(participant.reservationId);
    const list = participantsByReservation.get(key) || [];
    list.push(mapParticipantRow(participant));
    participantsByReservation.set(key, list);
  });

  return [...(props.reservations || [])]
    .filter((row) => !row.churchId)
    .map((reservation) => {
      const participants = sortParticipantRows(
        participantsByReservation.get(Number(reservation.id)) || []
      );
      const attendedCount = participants.filter((row) => row.attendedAt).length;
      const kidsCount = participants.filter((row) => row.isKid).length;

      return {
        key: `reservation-${reservation.id}`,
        id: reservation.id,
        reservationId: reservation.id,
        label: reservation.label,
        title: reservation.label,
        isReservation: true,
        reservedCount: Number(reservation.reservedCount || 0),
        participants,
        attendedCount,
        kidsCount,
        adultCount: participants.length - kidsCount
      };
    })
    .sort((a, b) =>
      String(a.label || "").localeCompare(String(b.label || ""), undefined, { sensitivity: "base" })
    );
});

const guestReservationTotal = computed(() =>
  guestReservations.value.reduce((sum, row) => sum + Number(row.reservedCount || 0), 0)
);

const guestReservationRegisteredTotal = computed(() =>
  guestReservations.value.reduce((sum, row) => sum + row.participants.length, 0)
);

const selectedGroup = computed(() => {
  if (!selectedKey.value) return null;
  return (
    churchGroups.value.find((group) => group.key === selectedKey.value) ||
    guestReservations.value.find((group) => group.key === selectedKey.value) ||
    null
  );
});

const unlinkedInSelectedGroup = computed(() => {
  if (!selectedGroup.value) return [];
  return selectedGroup.value.participants.filter((participant) => !participant.memberLinked && !participant.memberId);
});

const canLinkSelectedGroup = computed(() => unlinkedInSelectedGroup.value.length > 0);

function cardColor(index) {
  return CARD_COLORS[index % CARD_COLORS.length];
}

function close() {
  emit("update:modelValue", false);
}

function selectGroup(group) {
  selectedKey.value = group.key;
  loadQrCodes(group.participants);
}

function exportGroup(group) {
  exportParticipantsToExcel(group.participants, {
    churchName: group.title,
    eventName: props.event?.name
  });
  $q.notify({ type: "positive", message: `Exported ${group.title} participants.` });
}

function printGroup(group) {
  router.push(getAttendancePrintUrl(props.eventId, { churchKey: group.key }));
}

async function linkToMembers() {
  if (!props.eventId || !canLinkSelectedGroup.value || linkingMembers.value) return;

  const participantIds = unlinkedInSelectedGroup.value.map((participant) => participant.id);
  const count = participantIds.length;

  linkingMembers.value = true;
  try {
    const { data } = await api.post(`/events/${props.eventId}/participants/link-members`, {
      participantIds
    });

    const linked = Number(data?.linked) || 0;
    const unmatched = Number(data?.unmatched) || 0;
    const skipped = Number(data?.skipped) || 0;

    if (linked > 0) {
      $q.notify({
        type: "positive",
        message: `Linked ${linked} of ${count} participant(s) to existing members.`
      });
    } else {
      $q.notify({
        type: "warning",
        message: "No matching members were found for the selected participants."
      });
    }

    if (unmatched > 0 || skipped > 0) {
      const parts = [];
      if (unmatched > 0) parts.push(`${unmatched} unmatched`);
      if (skipped > 0) parts.push(`${skipped} already registered as members`);
      $q.notify({ type: "info", message: parts.join(" · ") });
    }

    emit("linked", data);
  } catch (err) {
    $q.notify({
      type: "negative",
      message: err?.response?.data?.message || err?.message || "Failed to link participants to members."
    });
  } finally {
    linkingMembers.value = false;
  }
}

async function loadQrCodes(participants) {
  if (!props.eventId || !participants.length) {
    qrByParticipant.value = {};
    return;
  }

  const entries = await Promise.all(
    participants.map(async (participant) => {
      const payload = buildCheckInPayload(props.eventId, participant);
      const dataUrl = await generateQrDataUrl(payload);
      return [participant.id, dataUrl];
    })
  );

  qrByParticipant.value = Object.fromEntries(entries);
}

function onShow() {
  viewMode.value = props.initialView === "church" ? "church" : "all";
  if (viewMode.value === "church") {
    const firstGroup = churchGroups.value[0] || guestReservations.value[0];
    if (firstGroup) selectGroup(firstGroup);
  }
}

function onHide() {
  selectedKey.value = null;
  qrByParticipant.value = {};
}

watch(viewMode, (mode) => {
  if (mode === "church" && !selectedKey.value) {
    const firstGroup = churchGroups.value[0] || guestReservations.value[0];
    if (firstGroup) selectGroup(firstGroup);
  }
  if (mode === "all") {
    selectedKey.value = null;
    qrByParticipant.value = {};
  }
});

watch(
  () => props.participants,
  () => {
    if (viewMode.value !== "church" || !selectedKey.value) return;
    const group =
      churchGroups.value.find((item) => item.key === selectedKey.value) ||
      guestReservations.value.find((item) => item.key === selectedKey.value);
    if (group) {
      loadQrCodes(group.participants);
      return;
    }
    const firstGroup = churchGroups.value[0] || guestReservations.value[0];
    if (firstGroup) {
      selectGroup(firstGroup);
    } else {
      selectedKey.value = null;
      qrByParticipant.value = {};
    }
  }
);
</script>

<style scoped lang="scss">
.participants-view-dialog {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f7fa;
}

.participants-view-dialog__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  background: #fff;
}

.participants-view-dialog__heading {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
}

.participants-view-dialog__title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a1a2e;
}

.participants-view-dialog__subtitle {
  margin: 2px 0 0;
  font-size: 0.8rem;
  color: #6b7280;
}

.participants-view-dialog__toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.participants-view-dialog__toggle {
  border: 1px solid #e4e8ef;
  border-radius: 8px;
}

.participants-view-dialog__body {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  min-height: 0;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}

.participants-view-dialog__cards {
  margin-bottom: 16px;
}

.participants-view-dialog__stat-card {
  cursor: pointer;
  border-radius: 8px;
  background: #fff;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(26, 26, 46, 0.08);
  }
}

.participants-view-dialog__stat-card--active {
  border-color: #1976d2;
  box-shadow: 0 0 0 1px #1976d2;
}

.participants-view-dialog__stat-card--static {
  cursor: default;
}

.participants-view-dialog__stat-text {
  min-width: 0;
}

.participants-view-dialog__stat-label {
  font-size: 0.82rem;
  font-weight: 500;
  color: #2d3340;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.participants-view-dialog__stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a2e;
  line-height: 1.2;
}

.participants-view-dialog__stat-reserved {
  font-size: 0.75rem;
  font-weight: 500;
  color: #8b93a1;
}

.participants-view-dialog__stat-breakdown {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 10px;
  margin-top: 2px;
  font-size: 0.68rem;
  font-weight: 500;
  color: #5f6b7a;
  line-height: 1.25;
}

.participants-view-dialog__reservation-section {
  margin: 0 0 16px;
  padding: 14px;
  background: #fff;
  border: 1px solid #e4e8ef;
  border-radius: 8px;
}

.participants-view-dialog__reservation-section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.participants-view-dialog__reservation-section-title {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1a1a2e;
}

.participants-view-dialog__reservation-section-meta {
  margin: 2px 0 0;
  font-size: 0.75rem;
  color: #6b7280;
}

.participants-view-dialog__detail {
  overflow: hidden;
}

.participants-view-dialog__detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid #eef1f6;
  background: #fafbfc;
}

.participants-view-dialog__detail-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.participants-view-dialog__detail-title {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 600;
  color: #1a1a2e;
}

.participants-view-dialog__detail-meta {
  margin: 2px 0 0;
  font-size: 0.75rem;
  color: #6b7280;
}

.participants-view-dialog__qr img {
  width: 64px;
  height: 64px;
  display: block;
}

.participants-view-dialog__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 240px;
  color: #8b93a1;
  font-size: 0.9rem;

  p {
    margin: 0;
  }
}

@media (max-width: 599px) {
  .participants-view-dialog__header {
    flex-wrap: wrap;
  }

  .participants-view-dialog__toolbar {
    width: 100%;
    justify-content: space-between;
  }

  .participants-view-dialog__detail-header {
    flex-wrap: wrap;
  }
}
</style>
