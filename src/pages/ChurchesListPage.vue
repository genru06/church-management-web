<template>
  <q-page class="entity-page">
    <header class="entity-page__header">
      <div class="entity-page__heading">
        <h1 class="entity-page__title">{{ pageTitle }}</h1>
        <span v-if="rows.length" class="entity-page__count">{{ rows.length }}</span>
      </div>
      <div class="entity-page__actions">
        <q-btn
          v-if="networkOnly && auth.canAccess('members')"
          dense
          outline
          no-caps
          color="primary"
          icon="badge"
          label="Members"
          class="entity-page__add-btn"
          to="/lg-network-churches/members"
        />
        <q-btn
          v-if="auth.canDo('action.churches.create')"
          dense
          unelevated
          no-caps
          color="primary"
          icon="add_business"
          :label="addLabel"
          class="entity-page__add-btn"
          @click="openCreateDialog"
        />
      </div>
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
              :placeholder="searchPlaceholder"
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

        <template #body-cell-shortName="props">
          <q-td :props="props">
            <span class="entity-table__muted">{{ props.row.shortName || "—" }}</span>
          </q-td>
        </template>

        <template #body-cell-address="props">
          <q-td :props="props" style="max-width: 240px">
            <span class="entity-table__ellipsis" :title="props.row.address">{{ props.row.address || "—" }}</span>
          </q-td>
        </template>

        <template #body-cell-pastorName="props">
          <q-td :props="props">
            <span class="entity-table__muted">{{ props.row.pastorName || "—" }}</span>
          </q-td>
        </template>

        <template #body-cell-tags="props">
          <q-td :props="props">
            <div v-if="props.row.tags?.length" class="row q-gutter-xs">
              <q-chip
                v-for="tag in props.row.tags"
                :key="tag"
                dense
                size="sm"
                color="blue-1"
                text-color="primary"
              >
                {{ tag }}
              </q-chip>
            </div>
            <span v-else class="entity-table__muted">—</span>
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
            <q-icon name="church" size="20px" color="grey-5" />
            <span>{{ filter ? emptySearchMessage : emptyMessage }}</span>
          </div>
        </template>
      </q-table>
    </section>

    <ChurchFormDialog
      v-model="formDialogOpen"
      :mode="formMode"
      :church-id="editingChurchId"
      :default-tags="defaultTags"
      @saved="onChurchSaved"
    />

    <ChurchDetailsDialog
      v-model="detailsDialogOpen"
      :church-id="viewingChurchId"
      @edit="openEditFromDetails"
    />
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useQuasar } from "quasar";
import { api } from "src/boot/axios";
import { useAuthStore } from "src/stores/auth";
import ChurchFormDialog from "src/components/ChurchFormDialog.vue";
import ChurchDetailsDialog from "src/components/ChurchDetailsDialog.vue";
import { compareChurchNamesMainFirst, getChurchDisplayName } from "src/utils/churchDisplay";
import { isLgNetworkChurch, LG_NETWORK_CHURCH_TAG } from "src/utils/churchTags";

const props = defineProps({
  networkOnly: { type: Boolean, default: false }
});

const auth = useAuthStore();
const $q = useQuasar();
const rows = ref([]);
const filter = ref("");
const loading = ref(false);
const formDialogOpen = ref(false);
const detailsDialogOpen = ref(false);
const formMode = ref("create");
const editingChurchId = ref(null);
const viewingChurchId = ref(null);

const pageTitle = computed(() => (props.networkOnly ? "LG Network Churches" : "Churches"));
const addLabel = computed(() => (props.networkOnly ? "Add network church" : "Add church"));
const searchPlaceholder = computed(() =>
  props.networkOnly ? "Search LG Network Churches…" : "Search churches…"
);
const emptyMessage = computed(() =>
  props.networkOnly ? "No LG Network Churches yet." : "No churches yet."
);
const emptySearchMessage = computed(() =>
  props.networkOnly ? "No LG Network Churches match your search." : "No churches match your search."
);
const defaultTags = computed(() => (props.networkOnly ? [LG_NETWORK_CHURCH_TAG] : []));

const pagination = ref({
  sortBy: "name",
  descending: false,
  page: 1,
  rowsPerPage: 25
});

const columns = [
  {
    name: "name",
    label: "Name",
    field: "name",
    align: "left",
    sortable: true,
    sort: (a, b, rowA, rowB) =>
      compareChurchNamesMainFirst(getChurchDisplayName(rowA), getChurchDisplayName(rowB))
  },
  {
    name: "shortName",
    label: "Short name",
    field: "shortName",
    align: "left",
    sortable: true,
    sort: (a, b, rowA, rowB) =>
      compareChurchNamesMainFirst(getChurchDisplayName(rowA), getChurchDisplayName(rowB))
  },
  { name: "address", label: "Address", field: "address", align: "left" },
  { name: "pastorName", label: "Pastor", field: "pastorName", align: "left", sortable: true },
  { name: "tags", label: "Tags", field: "tags", align: "left" },
  { name: "actions", label: "", field: "actions", align: "right", style: "width: 96px" }
];

function openCreateDialog() {
  formMode.value = "create";
  editingChurchId.value = null;
  formDialogOpen.value = true;
}

function openEditDialog(row) {
  formMode.value = "edit";
  editingChurchId.value = row.id;
  formDialogOpen.value = true;
}

function openDetailsDialog(row) {
  viewingChurchId.value = row.id;
  detailsDialogOpen.value = true;
}

function openEditFromDetails(church) {
  formMode.value = "edit";
  editingChurchId.value = church.id;
  formDialogOpen.value = true;
}

function belongsOnThisPage(church) {
  const isNetwork = isLgNetworkChurch(church?.tags);
  return props.networkOnly ? isNetwork : !isNetwork;
}

function onChurchSaved(church) {
  const tags = Array.isArray(church?.tags) ? church.tags : [];
  const next = { ...church, tags };
  const index = rows.value.findIndex((row) => Number(row.id) === Number(church.id));
  if (!belongsOnThisPage(next)) {
    if (index >= 0) rows.value.splice(index, 1);
    return;
  }
  if (index >= 0) rows.value[index] = next;
  else rows.value.unshift(next);
}

function confirmDelete(row) {
  $q.dialog({
    title: "Delete church",
    message: `Remove ${row.name}? This cannot be undone.`,
    cancel: { label: "Cancel", flat: true, color: "grey-8" },
    ok: { label: "Delete", color: "negative", unelevated: true, noCaps: true },
    persistent: true
  }).onOk(async () => {
    try {
      await api.delete(`/churches/${row.id}`);
      rows.value = rows.value.filter((item) => item.id !== row.id);
      $q.notify({ type: "positive", message: "Church deleted." });
    } catch {
      $q.notify({ type: "negative", message: "Failed to delete church." });
    }
  });
}

async function loadChurches() {
  loading.value = true;
  try {
    const params = props.networkOnly
      ? { tag: LG_NETWORK_CHURCH_TAG }
      : { excludeTag: LG_NETWORK_CHURCH_TAG };
    const { data } = await api.get("/churches", { params });
    rows.value = data;
  } finally {
    loading.value = false;
  }
}

watch(
  () => props.networkOnly,
  () => {
    filter.value = "";
    pagination.value = { ...pagination.value, page: 1 };
    loadChurches();
  }
);

onMounted(loadChurches);
</script>
