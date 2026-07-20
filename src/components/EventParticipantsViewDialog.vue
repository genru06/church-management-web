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
        <div v-if="!participants.length" class="participants-view-dialog__empty">
          <q-icon name="groups" size="32px" color="grey-5" />
          <p>No participants yet.</p>
        </div>

        <template v-else-if="viewMode === 'all'">
          <q-table
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
                <span class="entity-table__muted">{{ props.row.churchName || "—" }}</span>
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
                @click="selectChurch(group)"
              >
                <q-card-section class="row items-center no-wrap">
                  <q-avatar :color="cardColor(index)" text-color="white" icon="church" />
                  <div class="q-ml-md participants-view-dialog__stat-text">
                    <div class="participants-view-dialog__stat-label">{{ group.churchName }}</div>
                    <div class="participants-view-dialog__stat-value">{{ group.participants.length }}</div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>

          <section v-if="selectedGroup" class="participants-view-dialog__detail entity-page__panel">
            <div class="participants-view-dialog__detail-header">
              <div>
                <h3 class="participants-view-dialog__detail-title">{{ selectedGroup.churchName }}</h3>
                <p class="participants-view-dialog__detail-meta">
                  {{ selectedGroup.participants.length }} participant(s)
                  <span v-if="selectedGroup.attendedCount"> · {{ selectedGroup.attendedCount }} attended</span>
                </p>
              </div>
              <div class="participants-view-dialog__detail-actions">
                <q-btn
                  dense
                  outline
                  no-caps
                  color="primary"
                  icon="print"
                  label="Print sheet"
                  @click="printChurch(selectedGroup)"
                />
                <q-btn
                  dense
                  unelevated
                  no-caps
                  color="primary"
                  icon="download"
                  label="Export Excel"
                  @click="exportChurch(selectedGroup)"
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
            </q-table>
          </section>
        </template>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { buildCheckInPayload, generateQrDataUrl } from "src/utils/eventQr";
import { exportParticipantsToExcel } from "src/utils/eventParticipantExcel";
import { getAttendancePrintUrl } from "src/utils/eventAttendancePrint";

const CARD_COLORS = ["primary", "secondary", "accent", "positive", "orange", "purple"];

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  eventId: { type: [String, Number], default: null },
  event: { type: Object, default: null },
  participants: { type: Array, default: () => [] },
  hasRegistrationFee: { type: Boolean, default: false },
  initialView: { type: String, default: "all" }
});

const emit = defineEmits(["update:modelValue"]);

const $q = useQuasar();
const router = useRouter();
const viewMode = ref("all");
const qrByParticipant = ref({});
const selectedKey = ref(null);
const participantFilter = ref("");

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
        (participant.lastName || !participant.fullName ? "—" : "")
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
    { name: "churchName", label: "Church", field: "churchName", align: "left", sortable: true },
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

const churchGroups = computed(() => {
  const map = new Map();

  props.participants.forEach((participant) => {
    const key = participant.churchId ?? "unassigned";
    const churchName = participant.churchName || "Unassigned";

    if (!map.has(key)) {
      map.set(key, {
        key,
        churchId: participant.churchId,
        churchName,
        participants: [],
        attendedCount: 0
      });
    }

    const group = map.get(key);
    group.participants.push({
      ...participant,
      displayLastName: participant.lastName || participant.fullName || "—",
      displayFirstName:
        participant.firstName ||
        (participant.lastName || !participant.fullName ? "—" : "")
    });
    if (participant.attendedAt) {
      group.attendedCount += 1;
    }
  });

  return Array.from(map.values())
    .map((group) => ({
      ...group,
      participants: group.participants.sort((a, b) => {
        const last = (a.displayLastName || "").localeCompare(b.displayLastName || "");
        if (last !== 0) return last;
        return (a.displayFirstName || "").localeCompare(b.displayFirstName || "");
      })
    }))
    .sort((a, b) => a.churchName.localeCompare(b.churchName));
});

const selectedGroup = computed(() => {
  if (!selectedKey.value) return null;
  return churchGroups.value.find((group) => group.key === selectedKey.value) || null;
});

function cardColor(index) {
  return CARD_COLORS[index % CARD_COLORS.length];
}

function close() {
  emit("update:modelValue", false);
}

function selectChurch(group) {
  selectedKey.value = group.key;
  loadQrCodes(group.participants);
}

function exportChurch(group) {
  exportParticipantsToExcel(group.participants, {
    churchName: group.churchName,
    eventName: props.event?.name
  });
  $q.notify({ type: "positive", message: `Exported ${group.churchName} participants.` });
}

function printChurch(group) {
  router.push(getAttendancePrintUrl(props.eventId, { churchKey: group.key }));
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
  if (viewMode.value === "church" && churchGroups.value.length) {
    selectChurch(churchGroups.value[0]);
  }
}

function onHide() {
  selectedKey.value = null;
  qrByParticipant.value = {};
}

watch(viewMode, (mode) => {
  if (mode === "church" && churchGroups.value.length && !selectedKey.value) {
    selectChurch(churchGroups.value[0]);
  }
  if (mode === "all") {
    selectedKey.value = null;
    qrByParticipant.value = {};
  }
});
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
