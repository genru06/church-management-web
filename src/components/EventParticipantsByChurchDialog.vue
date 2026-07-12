<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    @show="onShow"
  >
    <q-card class="entity-dialog entity-dialog--wide participants-by-church-dialog">
      <header class="entity-dialog__header">
        <div>
          <h2 class="entity-dialog__title">Participants by church</h2>
          <p class="entity-dialog__subtitle">
            {{ event?.name || "Event" }} · {{ participants.length }} participant(s) across {{ churchGroups.length }} church(es)
          </p>
        </div>
        <q-btn flat round dense icon="close" color="grey-7" @click="close" />
      </header>

      <q-separator />

      <q-card-section class="participants-by-church-dialog__body">
        <div v-if="!churchGroups.length" class="participants-by-church-dialog__empty">
          <q-icon name="groups" size="24px" color="grey-5" />
          <span>No participants yet.</span>
        </div>

        <div v-else class="participants-by-church-dialog__grid">
          <article
            v-for="group in churchGroups"
            :key="group.key"
            class="participants-by-church-dialog__widget"
          >
            <div class="participants-by-church-dialog__widget-header">
              <div class="participants-by-church-dialog__widget-info">
                <q-icon name="church" size="20px" color="primary" />
                <div>
                  <h3 class="participants-by-church-dialog__widget-title">{{ group.churchName }}</h3>
                  <p class="participants-by-church-dialog__widget-meta">
                    {{ group.participants.length }} participant(s)
                    <span v-if="group.attendedCount"> · {{ group.attendedCount }} attended</span>
                  </p>
                </div>
              </div>
              <q-btn
                dense
                outline
                no-caps
                color="primary"
                icon="download"
                label="Export Excel"
                @click="exportChurch(group)"
              />
            </div>

            <q-separator />

            <q-table
              :rows="group.participants"
              :columns="participantColumns"
              row-key="id"
              flat
              dense
              hide-pagination
              :pagination="{ rowsPerPage: 0 }"
              class="participants-by-church-dialog__table"
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
          </article>
        </div>
      </q-card-section>

      <q-separator />

      <footer class="entity-dialog__footer">
        <q-btn flat no-caps label="Close" color="grey-8" @click="close" />
      </footer>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref } from "vue";
import { useQuasar } from "quasar";
import { buildCheckInPayload, generateQrDataUrl } from "src/utils/eventQr";
import { exportParticipantsToExcel } from "src/utils/eventParticipantExcel";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  eventId: { type: [String, Number], default: null },
  event: { type: Object, default: null },
  participants: { type: Array, default: () => [] }
});

const emit = defineEmits(["update:modelValue"]);

const $q = useQuasar();
const qrByParticipant = ref({});

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

function close() {
  emit("update:modelValue", false);
}

function exportChurch(group) {
  exportParticipantsToExcel(group.participants, {
    churchName: group.churchName,
    eventName: props.event?.name
  });
  $q.notify({ type: "positive", message: `Exported ${group.churchName} participants.` });
}

async function loadQrCodes() {
  if (!props.eventId || !props.participants.length) {
    qrByParticipant.value = {};
    return;
  }

  const entries = await Promise.all(
    props.participants.map(async (participant) => {
      const payload = buildCheckInPayload(props.eventId, participant);
      const dataUrl = await generateQrDataUrl(payload);
      return [participant.id, dataUrl];
    })
  );

  qrByParticipant.value = Object.fromEntries(entries);
}

function onShow() {
  loadQrCodes();
}
</script>

<style scoped lang="scss">
.participants-by-church-dialog {
  width: min(960px, 94vw);
  max-height: 90vh;
}

.participants-by-church-dialog__body {
  padding: 12px 16px;
  overflow-y: auto;
  flex: 1;
  min-height: 0;
}

.participants-by-church-dialog__grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.participants-by-church-dialog__widget {
  border: 1px solid #e4e8ef;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.participants-by-church-dialog__widget-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  background: #f8fafc;
}

.participants-by-church-dialog__widget-info {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  min-width: 0;
}

.participants-by-church-dialog__widget-title {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 600;
  color: #1a1a2e;
  line-height: 1.3;
}

.participants-by-church-dialog__widget-meta {
  margin: 2px 0 0;
  font-size: 0.75rem;
  color: #6b7280;
}

.participants-by-church-dialog__table {
  :deep(.q-table th) {
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #8b93a1;
  }

  :deep(.q-table td) {
    font-size: 0.8rem;
    color: #2d3340;
  }
}

.participants-by-church-dialog__qr img {
  width: 64px;
  height: 64px;
  display: block;
}

.participants-by-church-dialog__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 32px 12px;
  color: #8b93a1;
  font-size: 0.82rem;
}

@media (max-width: 599px) {
  .participants-by-church-dialog__widget-header {
    flex-wrap: wrap;
  }
}
</style>
