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
          @click="openTemplateDialog"
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
            <q-chip
              v-if="tagFilter"
              dense
              removable
              color="orange-2"
              text-color="orange-10"
              icon="sell"
              class="members-table__tag-filter"
              @remove="clearTagFilter"
            >
              Tag: {{ tagFilter }}
            </q-chip>
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
            <span>{{ tagFilter ? "No members with this tag." : filter ? "No members match your search." : "No members yet." }}</span>
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

    <q-dialog v-model="templateDialogOpen" persistent>
      <q-card class="members-template-dialog">
        <q-card-section class="members-template-dialog__header">
          <div>
            <h2 class="members-template-dialog__title">Download import template</h2>
            <p class="members-template-dialog__subtitle">
              Choose a general template or one tied to a specific church.
            </p>
          </div>
          <q-btn flat round dense icon="close" color="grey-7" @click="closeTemplateDialog" />
        </q-card-section>

        <q-separator />

        <q-card-section class="members-template-dialog__body">
          <q-option-group
            v-model="templateScope"
            :options="templateScopeOptions"
            type="radio"
            color="primary"
            dense
          />

          <AppSelect
            v-if="templateScope === 'church'"
            v-model="templateChurchId"
            :options="allChurchOptions"
            label="Church *"
            dense
            outlined
            emit-value
            map-options
            clearable
            class="members-template-dialog__church-select"
            :loading="churchesLoading"
          />

          <p v-if="templateScope === 'general'" class="members-template-dialog__hint">
            Members imported from this template will not be assigned to a church automatically.
          </p>
          <p v-else class="members-template-dialog__hint">
            The template will include a hidden church identifier. Uploaded members are assigned to
            that church automatically.
          </p>
        </q-card-section>

        <q-separator />

        <q-card-actions align="right" class="members-template-dialog__actions">
          <q-btn flat no-caps color="grey-8" label="Cancel" @click="closeTemplateDialog" />
          <q-btn
            unelevated
            no-caps
            color="primary"
            label="Download"
            :disable="templateScope === 'church' && !templateChurchId"
            @click="downloadTemplate"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { api } from "src/boot/axios";
import MemberFormDialog from "src/components/MemberFormDialog.vue";
import { downloadMemberBulkTemplate, parseMemberBulkUpload } from "src/utils/memberBulkExcel";
import { getChurchDisplayName } from "src/utils/churchDisplay";
import AppSelect from "src/components/AppSelect.vue";

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const filter = ref("");
const tagFilter = ref("");
const rawRows = ref([]);
const loading = ref(false);
const uploading = ref(false);
const uploadInputRef = ref(null);
const formDialogOpen = ref(false);
const formMode = ref("create");
const editingMemberId = ref(null);
const templateDialogOpen = ref(false);
const templateScope = ref("general");
const templateChurchId = ref(null);
const allChurchOptions = ref([]);
const churchesLoading = ref(false);

const templateScopeOptions = [
  { label: "General", value: "general" },
  { label: "Per church", value: "church" }
];

const pagination = ref({
  sortBy: "name",
  descending: false,
  page: 1,
  rowsPerPage: 25
});

function compareMemberNames(rowA, rowB) {
  const lastNameCompare = (rowA.lastName || "").localeCompare(rowB.lastName || "", undefined, {
    sensitivity: "base"
  });
  if (lastNameCompare !== 0) return lastNameCompare;
  return (rowA.firstName || "").localeCompare(rowB.firstName || "", undefined, { sensitivity: "base" });
}

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

async function loadChurches() {
  churchesLoading.value = true;
  try {
    const { data } = await api.get("/churches");
    allChurchOptions.value = data.map((church) => ({
      label: getChurchDisplayName(church),
      value: Number(church.id)
    }));
  } finally {
    churchesLoading.value = false;
  }
}

function openTemplateDialog() {
  templateScope.value = "general";
  templateChurchId.value = null;
  templateDialogOpen.value = true;
  if (!allChurchOptions.value.length) {
    loadChurches();
  }
}

function closeTemplateDialog() {
  templateDialogOpen.value = false;
}

function downloadTemplate() {
  if (templateScope.value === "church" && !templateChurchId.value) return;

  const selectedChurch = allChurchOptions.value.find((church) => church.value === templateChurchId.value);

  downloadMemberBulkTemplate(
    templateScope.value === "church"
      ? {
          churchId: templateChurchId.value,
          churchName: selectedChurch?.label || null
        }
      : {}
  );

  const message =
    templateScope.value === "church"
      ? `Church import template downloaded${selectedChurch ? ` for ${selectedChurch.label}` : ""}.`
      : "General member import template downloaded.";

  $q.notify({ type: "info", message });
  closeTemplateDialog();
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
      const churchNote = payload.churchId ? " and assigned to the template church" : "";
      $q.notify({
        type: "positive",
        message: `${data.created} member(s) imported successfully${churchNote}.`
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
    const params = {};
    if (tagFilter.value) params.tag = tagFilter.value;
    const { data } = await api.get("/members", { params });
    rawRows.value = data;
  } finally {
    loading.value = false;
  }
}

function syncTagFilterFromRoute() {
  const queryTag = route.query.tag;
  tagFilter.value = queryTag ? String(Array.isArray(queryTag) ? queryTag[0] : queryTag) : "";
}

function clearTagFilter() {
  tagFilter.value = "";
  router.replace({ path: "/members", query: {} });
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
    sort: (_, __, rowA, rowB) => compareMemberNames(rowA, rowB)
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

onMounted(async () => {
  syncTagFilterFromRoute();
  await loadMembers();
});

watch(
  () => route.query.tag,
  async () => {
    syncTagFilterFromRoute();
    await loadMembers();
  }
);
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
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.members-table__tag-filter {
  font-size: 0.75rem;
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

.members-template-dialog {
  width: min(420px, 92vw);
}

.members-template-dialog__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 16px 12px;
}

.members-template-dialog__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a2e;
}

.members-template-dialog__subtitle {
  margin: 4px 0 0;
  font-size: 0.78rem;
  color: #6b7280;
}

.members-template-dialog__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px;
}

.members-template-dialog__church-select {
  margin-top: 4px;
}

.members-template-dialog__hint {
  margin: 0;
  font-size: 0.75rem;
  line-height: 1.45;
  color: #8b93a1;
}

.members-template-dialog__actions {
  padding: 10px 12px;
}
</style>
