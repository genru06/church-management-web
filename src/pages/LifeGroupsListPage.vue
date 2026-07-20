<template>
  <q-page class="entity-page">
    <header class="entity-page__header">
      <div class="entity-page__heading">
        <h1 class="entity-page__title">LifeGroups</h1>
        <span v-if="rows.length" class="entity-page__count">{{ rows.length }}</span>
      </div>
      <q-btn
        v-if="auth.canDo('action.lifegroups.create')"
        dense
        unelevated
        no-caps
        color="primary"
        icon="group_add"
        label="Add lifegroup"
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
              placeholder="Search lifegroups…"
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
            <button type="button" class="entity-table__link" @click="openDetailsDialog(props.row)">
              {{ props.row.name }}
            </button>
          </q-td>
        </template>

        <template #body-cell-coachName="props">
          <q-td :props="props">
            <span class="entity-table__muted">{{ props.row.coachName || "—" }}</span>
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props" class="entity-table__actions">
            <q-btn flat dense round size="sm" color="grey-7" icon="visibility" @click="openDetailsDialog(props.row)">
              <q-tooltip>View</q-tooltip>
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
            <q-icon name="hub" size="20px" color="grey-5" />
            <span>{{ filter ? "No lifegroups match your search." : "No lifegroups yet." }}</span>
          </div>
        </template>
      </q-table>
    </section>

    <LifeGroupFormDialog
      v-model="formDialogOpen"
      :mode="formMode"
      :life-group-id="editingLifeGroupId"
      @saved="onLifeGroupSaved"
    />

    <LifeGroupDetailsDialog
      v-model="detailsDialogOpen"
      :life-group-id="viewingLifeGroupId"
      @edit="openEditFromDetails"
    />
  </q-page>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useQuasar } from "quasar";
import { api } from "src/boot/axios";
import { useAuthStore } from "src/stores/auth";
import LifeGroupFormDialog from "src/components/LifeGroupFormDialog.vue";
import LifeGroupDetailsDialog from "src/components/LifeGroupDetailsDialog.vue";

const auth = useAuthStore();
const $q = useQuasar();
const rows = ref([]);
const filter = ref("");
const loading = ref(false);
const formDialogOpen = ref(false);
const detailsDialogOpen = ref(false);
const formMode = ref("create");
const editingLifeGroupId = ref(null);
const viewingLifeGroupId = ref(null);

const pagination = ref({
  sortBy: "name",
  descending: false,
  page: 1,
  rowsPerPage: 25
});

const columns = [
  { name: "name", label: "Name", field: "name", align: "left", sortable: true },
  { name: "coachName", label: "Coach", field: "coachName", align: "left", sortable: true },
  { name: "actions", label: "", field: "actions", align: "right", style: "width: 96px" }
];

function openCreateDialog() {
  formMode.value = "create";
  editingLifeGroupId.value = null;
  formDialogOpen.value = true;
}

function openEditDialog(row) {
  formMode.value = "edit";
  editingLifeGroupId.value = row.id;
  formDialogOpen.value = true;
}

function openDetailsDialog(row) {
  viewingLifeGroupId.value = row.id;
  detailsDialogOpen.value = true;
}

function openEditFromDetails(group) {
  formMode.value = "edit";
  editingLifeGroupId.value = group.id;
  formDialogOpen.value = true;
}

function onLifeGroupSaved(group) {
  const index = rows.value.findIndex((row) => row.id === group.id);
  const listItem = {
    id: group.id,
    name: group.name,
    coachMemberId: group.coachMemberId,
    churchId: group.churchId,
    coachName: group.coachName || rows.value[index]?.coachName || "—"
  };
  if (index >= 0) rows.value[index] = listItem;
  else rows.value.unshift(listItem);
}

function confirmDelete(row) {
  $q.dialog({
    title: "Delete lifegroup",
    message: `Remove ${row.name}? This cannot be undone.`,
    cancel: { label: "Cancel", flat: true, color: "grey-8" },
    ok: { label: "Delete", color: "negative", unelevated: true, noCaps: true },
    persistent: true
  }).onOk(async () => {
    try {
      await api.delete(`/lifegroups/${row.id}`);
      rows.value = rows.value.filter((item) => item.id !== row.id);
      $q.notify({ type: "positive", message: "Lifegroup deleted." });
    } catch {
      $q.notify({ type: "negative", message: "Failed to delete lifegroup." });
    }
  });
}

async function loadLifeGroups() {
  loading.value = true;
  try {
    const { data } = await api.get("/lifegroups");
    rows.value = data;
  } finally {
    loading.value = false;
  }
}

onMounted(loadLifeGroups);
</script>
