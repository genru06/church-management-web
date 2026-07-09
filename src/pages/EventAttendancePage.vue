<template>
  <q-page class="entity-page">
    <header class="entity-page__header">
      <div class="entity-page__heading">
        <q-btn flat dense round icon="arrow_back" color="grey-7" @click="router.push(`/events/${eventId}`)" />
        <h1 class="entity-page__title">Attendance sheet</h1>
      </div>
      <q-btn
        dense
        unelevated
        no-caps
        color="primary"
        icon="qr_code_scanner"
        label="Open scanner"
        @click="router.push(`/events/${eventId}/scan`)"
      />
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
        :rows="participants"
        :columns="columns"
        row-key="id"
        flat
        dense
        :pagination="{ rowsPerPage: 25 }"
        class="entity-table"
      >
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
          </q-td>
        </template>
      </q-table>
    </section>
  </q-page>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { api } from "src/boot/axios";
import { buildCheckInPayload, generateQrDataUrl } from "src/utils/eventQr";
import { formatEventTime } from "src/utils/eventTime";

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
const qrByParticipant = ref({});

const columns = [
  { name: "fullName", label: "Participant", field: "fullName", align: "left", sortable: true },
  { name: "email", label: "Email", field: "email", align: "left" },
  { name: "attendedAt", label: "Status", field: "attendedAt", align: "left" },
  { name: "checkedInAt", label: "Checked in at", field: "attendedAt", align: "left" },
  { name: "qrCode", label: "QR code", field: "qrCode", align: "center" },
  { name: "actions", label: "", field: "actions", align: "right" }
];

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
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

async function loadAttendance() {
  loading.value = true;
  try {
    const [eventRes, participantsRes] = await Promise.all([
      api.get(`/events/${eventId}`),
      api.get(`/events/${eventId}/participants`)
    ]);
    event.value = eventRes.data;
    participants.value = participantsRes.data;
    await loadQrCodes(participantsRes.data);
  } catch {
    $q.notify({ type: "negative", message: "Failed to load attendance sheet." });
    router.push(`/events/${eventId}`);
  } finally {
    loading.value = false;
  }
}

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

.attendance-sheet__qr img {
  width: 72px;
  height: 72px;
  display: block;
}
</style>
