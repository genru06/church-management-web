<template>
  <q-page class="entity-page">
    <header class="entity-page__header">
      <div class="entity-page__heading">
        <h1 class="entity-page__title">Events</h1>
        <span v-if="rows.length" class="entity-page__count">{{ rows.length }}</span>
      </div>
      <q-btn
        v-if="auth.canDo('action.events.create')"
        dense
        unelevated
        no-caps
        color="primary"
        icon="event"
        label="Add event"
        class="entity-page__add-btn"
        @click="openCreateDialog"
      />
    </header>

    <section class="entity-page__panel">
      <q-table
        v-model:pagination="pagination"
        :rows="rows"
        :columns="columns"
        row-key="id"
        :filter="filter"
        :loading="loading"
        flat
        dense
        binary-state-sort
        :rows-per-page-options="[25, 50, 100]"
        class="entity-table"
      >
        <template #top>
          <div class="entity-table__toolbar">
            <q-input
              v-model="filter"
              dense
              borderless
              clearable
              placeholder="Search events…"
              class="entity-table__search"
            >
              <template #prepend>
                <q-icon name="search" size="18px" color="grey-6" />
              </template>
            </q-input>
          </div>
        </template>

        <template #body-cell-name="props">
          <q-td :props="props">
            <button type="button" class="entity-table__link" @click="goToDashboard(props.row)">
              {{ props.row.name }}
            </button>
          </q-td>
        </template>

        <template #body-cell-eventTime="props">
          <q-td :props="props">
            <span class="entity-table__muted">{{ formatEventTime(props.row.eventTime) }}</span>
          </q-td>
        </template>

        <template #body-cell-eventDate="props">
          <q-td :props="props">
            <span class="entity-table__muted">{{ formatDate(props.row.eventDate) }}</span>
          </q-td>
        </template>

        <template #body-cell-status="props">
          <q-td :props="props">
            <q-badge :color="statusColor(props.row.status)" :label="props.row.status" />
          </q-td>
        </template>

        <template #body-cell-eventType="props">
          <q-td :props="props">
            <span class="entity-table__muted">{{ props.row.eventType }}</span>
          </q-td>
        </template>

        <template #body-cell-registrationFee="props">
          <q-td :props="props">
            <span class="entity-table__muted">
              {{ props.row.registrationFee > 0 ? formatCurrency(props.row.registrationFee) : "Free" }}
            </span>
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props" class="entity-table__actions">
            <q-btn
              v-if="isRegistrationOpen(props.row)"
              flat
              dense
              round
              size="sm"
              color="primary"
              icon="link"
              @click="copyRegistrationLink(props.row)"
            >
              <q-tooltip>Copy registration link</q-tooltip>
            </q-btn>
            <q-btn
              v-if="isRegistrationOpen(props.row)"
              flat
              dense
              round
              size="sm"
              color="primary"
              icon="qr_code_2"
              @click="openRegistrationQr(props.row)"
            >
              <q-tooltip>Registration QR</q-tooltip>
            </q-btn>
            <q-btn flat dense round size="sm" color="grey-7" icon="dashboard" @click="goToDashboard(props.row)">
              <q-tooltip>Dashboard</q-tooltip>
            </q-btn>
            <q-btn flat dense round size="sm" color="grey-7" icon="edit" @click="openEditDialog(props.row)">
              <q-tooltip>Edit</q-tooltip>
            </q-btn>
            <q-btn flat dense round size="sm" color="grey-7" icon="delete_outline" @click="confirmDelete(props.row)">
              <q-tooltip>Delete</q-tooltip>
            </q-btn>
          </q-td>
        </template>

        <template #no-data>
          <div class="entity-table__empty">
            <q-icon name="event" size="20px" color="grey-5" />
            <span>{{ filter ? "No events match your search." : "No events yet." }}</span>
          </div>
        </template>
      </q-table>
    </section>

    <EventFormDialog
      v-model="formDialogOpen"
      :mode="formMode"
      :event-id="editingEventId"
      @saved="onEventSaved"
    />

    <EventRegistrationQrDialog
      v-model="registrationQrDialogOpen"
      :event-id="qrEventId"
      :event="qrEvent"
    />
  </q-page>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { api } from "src/boot/axios";
import { useAuthStore } from "src/stores/auth";
import EventFormDialog from "src/components/EventFormDialog.vue";
import EventRegistrationQrDialog from "src/components/EventRegistrationQrDialog.vue";
import {
  getEventSignupUrl,
  isRegistrationOpen
} from "src/utils/eventRegistration";
import { formatEventTime } from "src/utils/eventTime";

const $q = useQuasar();
const auth = useAuthStore();
const router = useRouter();
const rows = ref([]);
const filter = ref("");
const loading = ref(false);
const formDialogOpen = ref(false);
const formMode = ref("create");
const editingEventId = ref(null);
const registrationQrDialogOpen = ref(false);
const qrEventId = ref(null);
const qrEvent = ref(null);

const pagination = ref({
  sortBy: "name",
  descending: false,
  page: 1,
  rowsPerPage: 25
});

const columns = [
  { name: "name", label: "Name", field: "name", align: "left", sortable: true },
  { name: "eventDate", label: "Date", field: "eventDate", align: "left", sortable: true },
  { name: "eventTime", label: "Time", field: "eventTime", align: "left", sortable: true },
  { name: "location", label: "Location", field: "location", align: "left" },
  { name: "organizer", label: "Organizer", field: "organizer", align: "left" },
  { name: "expectedParticipants", label: "Expected", field: "expectedParticipants", align: "right", sortable: true },
  { name: "reservedParticipants", label: "Reserved", field: "reservedParticipants", align: "right", sortable: true },
  { name: "status", label: "Status", field: "status", align: "left", sortable: true },
  { name: "eventType", label: "Type", field: "eventType", align: "left", sortable: true },
  { name: "registrationFee", label: "Fee", field: "registrationFee", align: "right", sortable: true },
  { name: "actions", label: "", field: "actions", align: "right", style: "width: 188px" }
];

function openRegistrationQr(row) {
  if (!isRegistrationOpen(row)) return;
  qrEventId.value = row.id;
  qrEvent.value = row;
  registrationQrDialogOpen.value = true;
}

function copyRegistrationLink(row) {
  if (!isRegistrationOpen(row)) return;
  navigator.clipboard?.writeText(getEventSignupUrl(row.id));
  $q.notify({ type: "positive", message: "Registration link copied to clipboard." });
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(value);
}

function statusColor(status) {
  const map = {
    draft: "grey",
    published: "blue",
    ongoing: "orange",
    completed: "positive",
    cancelled: "negative"
  };
  return map[status] || "grey";
}

function openCreateDialog() {
  formMode.value = "create";
  editingEventId.value = null;
  formDialogOpen.value = true;
}

function openEditDialog(row) {
  formMode.value = "edit";
  editingEventId.value = row.id;
  formDialogOpen.value = true;
}

function goToDashboard(row) {
  router.push(`/events/${row.id}`);
}

function onEventSaved(event) {
  const index = rows.value.findIndex((row) => row.id === event.id);
  if (index >= 0) rows.value[index] = event;
  else rows.value.unshift(event);
}

function confirmDelete(row) {
  $q.dialog({
    title: "Delete event",
    message: `Remove ${row.name}? This cannot be undone.`,
    cancel: { label: "Cancel", flat: true, color: "grey-8" },
    ok: { label: "Delete", color: "negative", unelevated: true, noCaps: true },
    persistent: true
  }).onOk(async () => {
    try {
      await api.delete(`/events/${row.id}`);
      rows.value = rows.value.filter((item) => item.id !== row.id);
      $q.notify({ type: "positive", message: "Event deleted." });
    } catch {
      $q.notify({ type: "negative", message: "Failed to delete event." });
    }
  });
}

async function loadEvents() {
  loading.value = true;
  try {
    const { data } = await api.get("/events");
    rows.value = data;
  } finally {
    loading.value = false;
  }
}

onMounted(loadEvents);
</script>
