<template>
  <q-dialog
    :model-value="modelValue"
    maximized
    @update:model-value="$emit('update:modelValue', $event)"
    @show="onShow"
    @hide="onHide"
  >
    <q-card class="participants-by-church-dialog">
      <header class="participants-by-church-dialog__header">
        <div class="participants-by-church-dialog__heading">
          <q-btn flat dense round icon="arrow_back" color="grey-7" @click="close" />
          <div>
            <h2 class="participants-by-church-dialog__title">Participants by church</h2>
            <p class="participants-by-church-dialog__subtitle">
              {{ event?.name || "Event" }} · {{ participants.length }} participant(s) across {{ churchGroups.length }} church(es)
            </p>
          </div>
        </div>
        <q-btn flat round dense icon="close" color="grey-7" @click="close" />
      </header>

      <q-separator />

      <q-card-section class="participants-by-church-dialog__body">
        <div v-if="!churchGroups.length" class="participants-by-church-dialog__empty">
          <q-icon name="groups" size="32px" color="grey-5" />
          <p>No participants yet.</p>
        </div>

        <template v-else>
          <div class="row q-col-gutter-md participants-by-church-dialog__cards">
            <div
              v-for="(group, index) in churchGroups"
              :key="group.key"
              class="col-12 col-sm-6 col-md-4 col-lg-3"
            >
              <q-card
                flat
                bordered
                class="participants-by-church-dialog__stat-card"
                :class="{ 'participants-by-church-dialog__stat-card--active': selectedKey === group.key }"
                @click="selectChurch(group)"
              >
                <q-card-section class="row items-center no-wrap">
                  <q-avatar :color="cardColor(index)" text-color="white" icon="church" />
                  <div class="q-ml-md participants-by-church-dialog__stat-text">
                    <div class="participants-by-church-dialog__stat-label">{{ group.churchName }}</div>
                    <div class="participants-by-church-dialog__stat-value">{{ group.participants.length }}</div>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>

          <section v-if="selectedGroup" class="participants-by-church-dialog__detail entity-page__panel">
            <div class="participants-by-church-dialog__detail-header">
              <div>
                <h3 class="participants-by-church-dialog__detail-title">{{ selectedGroup.churchName }}</h3>
                <p class="participants-by-church-dialog__detail-meta">
                  {{ selectedGroup.participants.length }} participant(s)
                  <span v-if="selectedGroup.attendedCount"> · {{ selectedGroup.attendedCount }} attended</span>
                </p>
              </div>
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

            <q-table
              :rows="selectedGroup.participants"
              :columns="participantColumns"
              row-key="id"
              flat
              dense
              :pagination="{ rowsPerPage: 25 }"
              class="participants-by-church-dialog__table entity-table"
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
                  <div class="participants-by-church-dialog__qr">
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
import { computed, ref } from "vue";
import { useQuasar } from "quasar";
import { buildCheckInPayload, generateQrDataUrl } from "src/utils/eventQr";
import { exportParticipantsToExcel } from "src/utils/eventParticipantExcel";

const CARD_COLORS = ["primary", "secondary", "accent", "positive", "orange", "purple"];

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  eventId: { type: [String, Number], default: null },
  event: { type: Object, default: null },
  participants: { type: Array, default: () => [] }
});

const emit = defineEmits(["update:modelValue"]);

const $q = useQuasar();
const qrByParticipant = ref({});
const selectedKey = ref(null);

const participantColumns = [
  { name: "lastName", label: "Last name", field: "lastName", align: "left", sortable: true },
  { name: "firstName", label: "First name", field: "firstName", align: "left", sortable: true },
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
    group.participants.push(participant);
    if (participant.attendedAt) {
      group.attendedCount += 1;
    }
  });

  return Array.from(map.values())
    .map((group) => ({
      ...group,
      participants: group.participants.sort((a, b) => {
        const last = (a.lastName || "").localeCompare(b.lastName || "");
        if (last !== 0) return last;
        return (a.firstName || "").localeCompare(b.firstName || "");
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
  if (churchGroups.value.length) {
    selectChurch(churchGroups.value[0]);
  }
}

function onHide() {
  selectedKey.value = null;
  qrByParticipant.value = {};
}
</script>

<style scoped lang="scss">
.participants-by-church-dialog {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f7fa;
}

.participants-by-church-dialog__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  background: #fff;
}

.participants-by-church-dialog__heading {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
}

.participants-by-church-dialog__title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a1a2e;
}

.participants-by-church-dialog__subtitle {
  margin: 2px 0 0;
  font-size: 0.8rem;
  color: #6b7280;
}

.participants-by-church-dialog__body {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  min-height: 0;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}

.participants-by-church-dialog__cards {
  margin-bottom: 16px;
}

.participants-by-church-dialog__stat-card {
  cursor: pointer;
  border-radius: 8px;
  background: #fff;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(26, 26, 46, 0.08);
  }
}

.participants-by-church-dialog__stat-card--active {
  border-color: #1976d2;
  box-shadow: 0 0 0 1px #1976d2;
}

.participants-by-church-dialog__stat-text {
  min-width: 0;
}

.participants-by-church-dialog__stat-label {
  font-size: 0.82rem;
  font-weight: 500;
  color: #2d3340;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.participants-by-church-dialog__stat-value {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a2e;
  line-height: 1.2;
}

.participants-by-church-dialog__detail {
  overflow: hidden;
}

.participants-by-church-dialog__detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid #eef1f6;
  background: #fafbfc;
}

.participants-by-church-dialog__detail-title {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 600;
  color: #1a1a2e;
}

.participants-by-church-dialog__detail-meta {
  margin: 2px 0 0;
  font-size: 0.75rem;
  color: #6b7280;
}

.participants-by-church-dialog__qr img {
  width: 64px;
  height: 64px;
  display: block;
}

.participants-by-church-dialog__empty {
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
  .participants-by-church-dialog__detail-header {
    flex-wrap: wrap;
  }
}
</style>
