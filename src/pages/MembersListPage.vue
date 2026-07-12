<template>
  <q-page class="members-page">
    <header class="members-page__header">
      <div class="members-page__heading">
        <h1 class="members-page__title">Members</h1>
        <span v-if="rows.length" class="members-page__count">{{ rows.length }}</span>
      </div>
      <div class="members-page__actions">
        <q-btn
          dense
          flat
          no-caps
          color="grey-8"
          icon="download"
          label="Download template"
          class="members-page__secondary-btn"
          @click="downloadTemplate"
        />
        <q-btn
          dense
          flat
          no-caps
          color="grey-8"
          icon="upload_file"
          label="Upload Excel"
          class="members-page__secondary-btn"
          :loading="uploading"
          @click="openUploadPicker"
        />
        <input
          ref="uploadInputRef"
          type="file"
          accept=".xlsx,.xls"
          class="members-page__upload-input"
          @change="onUploadSelected"
        />
        <q-btn
          dense
          unelevated
          no-caps
          color="primary"
          icon="person_add"
          label="Add member"
          class="members-page__add-btn"
          @click="openCreateDialog"
        />
      </div>
    </header>

    <section class="members-page__panel">
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
        class="members-table"
        table-class="members-table__body"
        table-header-class="members-table__head"
      >
        <template #top>
          <div class="members-table__toolbar">
            <q-input
              v-model="filter"
              dense
              borderless
              clearable
              placeholder="Search members…"
              class="members-table__search"
            >
              <template #prepend>
                <q-icon name="search" size="18px" color="grey-6" />
              </template>
            </q-input>
          </div>
        </template>

        <template #body-cell-name="props">
          <q-td :props="props" class="members-table__name-cell">
            <router-link :to="`/members/${props.row.id}`" class="members-table__name">
              {{ props.row.lastName }}, {{ props.row.firstName }}
            </router-link>
          </q-td>
        </template>

        <template #body-cell-email="props">
          <q-td :props="props">
            <span class="members-table__muted">{{ props.row.email || "—" }}</span>
          </q-td>
        </template>

        <template #body-cell-phone="props">
          <q-td :props="props">
            <span class="members-table__muted">{{ props.row.phone || "—" }}</span>
          </q-td>
        </template>

        <template #body-cell-address="props">
          <q-td :props="props" class="members-table__address-cell">
            <span class="members-table__address" :title="props.row.completeAddress">
              {{ props.row.completeAddress }}
            </span>
          </q-td>
        </template>

        <template #body-cell-dateOfBirth="props">
          <q-td :props="props">
            <span class="members-table__muted">{{ formatDate(props.row.dateOfBirth) }}</span>
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props" class="members-table__actions">
            <q-btn
              flat
              dense
              round
              size="sm"
              color="grey-7"
              icon="visibility"
              :to="`/members/${props.row.id}`"
            >
              <q-tooltip>View</q-tooltip>
            </q-btn>
            <q-btn
              flat
              dense
              round
              size="sm"
              color="grey-7"
              icon="edit"
              @click="openEditDialog(props.row)"
            >
              <q-tooltip>Edit</q-tooltip>
            </q-btn>
            <q-btn
              flat
              dense
              round
              size="sm"
              color="grey-7"
              icon="delete_outline"
              @click="confirmDelete(props.row)"
            >
              <q-tooltip>Delete</q-tooltip>
            </q-btn>
          </q-td>
        </template>

        <template #no-data>
          <div class="members-table__empty">
            <q-icon name="group_off" size="20px" color="grey-5" />
            <span>{{ filter ? "No members match your search." : "No members yet." }}</span>
          </div>
        </template>
      </q-table>
    </section>

    <MemberFormDialog
      v-model="formDialogOpen"
      :mode="formMode"
      :member-id="editingMemberId"
      @saved="onMemberSaved"
    />
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useQuasar } from "quasar";
import { api } from "src/boot/axios";
import MemberFormDialog from "src/components/MemberFormDialog.vue";
import { downloadMemberBulkTemplate, parseMemberBulkUpload } from "src/utils/memberBulkExcel";

const $q = useQuasar();
const filter = ref("");
const rawRows = ref([]);
const loading = ref(false);
const uploading = ref(false);
const uploadInputRef = ref(null);
const formDialogOpen = ref(false);
const formMode = ref("create");
const editingMemberId = ref(null);

const pagination = ref({
  sortBy: "lastName",
  descending: false,
  page: 1,
  rowsPerPage: 25
});

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function openCreateDialog() {
  formMode.value = "create";
  editingMemberId.value = null;
  formDialogOpen.value = true;
}

function openEditDialog(row) {
  formMode.value = "edit";
  editingMemberId.value = row.id;
  formDialogOpen.value = true;
}

function onMemberSaved(member) {
  const index = rawRows.value.findIndex((row) => row.id === member.id);
  if (index >= 0) {
    rawRows.value[index] = member;
  } else {
    rawRows.value.unshift(member);
  }
}

function downloadTemplate() {
  downloadMemberBulkTemplate();
  $q.notify({ type: "info", message: "Member import template downloaded." });
}

function openUploadPicker() {
  uploadInputRef.value?.click();
}

function resetUploadInput() {
  if (uploadInputRef.value) uploadInputRef.value.value = "";
}

async function onUploadSelected(event) {
  const file = event.target.files?.[0];
  resetUploadInput();
  if (!file) return;

  uploading.value = true;
  try {
    const payload = await parseMemberBulkUpload(file);
    const { data } = await api.post("/members/import", payload);

    if (data.members?.length) {
      const existingIds = new Set(rawRows.value.map((row) => row.id));
      data.members.forEach((member) => {
        if (!existingIds.has(member.id)) {
          rawRows.value.unshift(member);
        }
      });
    }

    if (data.errors?.length) {
      const preview = data.errors
        .slice(0, 3)
        .map((item) => `Row ${item.row}: ${item.message}`)
        .join(" · ");
      const suffix = data.errors.length > 3 ? ` (+${data.errors.length - 3} more)` : "";

      $q.notify({
        type: data.created ? "warning" : "negative",
        message: `${data.created} member(s) imported. ${data.errors.length} row(s) failed.`,
        caption: `${preview}${suffix}`,
        timeout: 6000
      });
    } else {
      $q.notify({
        type: "positive",
        message: `${data.created} member(s) imported successfully.`
      });
    }
  } catch (err) {
    const message = err?.response?.data?.message || err?.message || "Failed to import members.";
    $q.notify({
      type: "negative",
      message: Array.isArray(message) ? message[0] : message
    });
  } finally {
    uploading.value = false;
  }
}

function confirmDelete(row) {
  $q.dialog({
    title: "Delete member",
    message: `Remove ${row.firstName} ${row.lastName} from the directory? This cannot be undone.`,
    cancel: { label: "Cancel", flat: true, color: "grey-8" },
    ok: { label: "Delete", color: "negative", unelevated: true, noCaps: true },
    persistent: true
  }).onOk(async () => {
    try {
      await api.delete(`/members/${row.id}`);
      rawRows.value = rawRows.value.filter((item) => item.id !== row.id);
      $q.notify({ type: "positive", message: "Member deleted." });
    } catch {
      $q.notify({ type: "negative", message: "Failed to delete member." });
    }
  });
}

async function loadMembers() {
  loading.value = true;
  try {
    const { data } = await api.get("/members");
    rawRows.value = data;
  } finally {
    loading.value = false;
  }
}

const rows = computed(() =>
  rawRows.value.map((m) => ({
    ...m,
    completeAddress: [m.address, m.barangay, m.city, m.country, m.zip]
      .filter(Boolean)
      .join(", ")
  }))
);

const columns = [
  {
    name: "name",
    label: "Name",
    field: (row) => `${row.lastName}, ${row.firstName}`,
    align: "left",
    sortable: true,
    sort: (a, b) => a.localeCompare(b)
  },
  { name: "email", label: "Email", field: "email", align: "left", sortable: true },
  { name: "phone", label: "Phone", field: "phone", align: "left" },
  {
    name: "address",
    label: "Address",
    field: "completeAddress",
    align: "left",
    style: "max-width: 220px"
  },
  { name: "dateOfBirth", label: "Birthdate", field: "dateOfBirth", align: "left", sortable: true },
  { name: "actions", label: "", field: "actions", align: "right", style: "width: 96px" }
];

onMounted(loadMembers);
</script>

<style scoped lang="scss">
.members-page {
  padding: 12px 16px 16px;
  max-width: 1400px;
}

.members-page__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 10px;
}

.members-page__heading {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
}

.members-page__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: -0.01em;
  color: #1a1a2e;
}

.members-page__count {
  display: inline-flex;
  align-items: center;
  min-width: 22px;
  height: 20px;
  padding: 0 6px;
  border-radius: 10px;
  background: #eef1f6;
  color: #5c6370;
  font-size: 0.7rem;
  font-weight: 600;
  line-height: 1;
}

.members-page__add-btn {
  font-size: 0.78rem;
  padding: 4px 10px;
}

.members-page__actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

@media (max-width: 599px) {
  .members-page {
    padding: 8px 10px 12px;
  }

  .members-page__heading {
    flex: 1 1 100%;
  }

  .members-page__actions {
    flex: 1 1 100%;
    justify-content: flex-start;
  }

  .members-page__panel {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .members-table__search {
    max-width: none;
  }
}

.members-page__secondary-btn {
  font-size: 0.78rem;
  padding: 4px 8px;
}

.members-page__upload-input {
  display: none;
}

.members-page__panel {
  background: #fff;
  border: 1px solid #e4e8ef;
  border-radius: 8px;
  overflow: hidden;
}

.members-table {
  :deep(.q-table__top) {
    min-height: 0;
    padding: 6px 10px;
    border-bottom: 1px solid #eef1f6;
  }

  :deep(.q-table__bottom) {
    min-height: 36px;
    padding: 4px 10px;
    border-top: 1px solid #eef1f6;
    font-size: 0.75rem;
    color: #6b7280;
  }

  :deep(.q-table thead tr) {
    height: 32px;
  }

  :deep(.q-table tbody tr) {
    height: 34px;
  }

  :deep(.q-table th) {
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #8b93a1;
    padding: 4px 10px;
    border-bottom: 1px solid #eef1f6;
  }

  :deep(.q-table td) {
    font-size: 0.8rem;
    padding: 2px 10px;
    border-color: #f3f5f8;
    color: #2d3340;
  }

  :deep(.q-table tbody tr:hover td) {
    background: #fafbfc;
  }
}

.members-table__toolbar {
  width: 100%;
}

.members-table__search {
  max-width: 260px;

  :deep(.q-field__control) {
    min-height: 30px;
    height: 30px;
    padding: 0 8px;
    background: #f5f7fa;
    border-radius: 6px;
  }

  :deep(.q-field__native) {
    font-size: 0.8rem;
    padding: 0;
  }
}

.members-table__name {
  color: #1a1a2e;
  text-decoration: none;
  font-weight: 500;

  &:hover {
    color: #1976d2;
    text-decoration: underline;
  }
}

.members-table__muted {
  color: #5c6370;
}

.members-table__address-cell {
  max-width: 220px;
}

.members-table__address {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #5c6370;
  font-size: 0.78rem;
}

.members-table__actions {
  white-space: nowrap;

  :deep(.q-btn) {
    margin: 0 -2px;
  }
}

.members-table__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 20px 12px;
  color: #8b93a1;
  font-size: 0.8rem;
}
</style>
