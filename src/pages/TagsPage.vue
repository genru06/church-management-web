<template>
  <q-page class="entity-page">
    <header class="entity-page__header">
      <div class="entity-page__heading">
        <h1 class="entity-page__title">Tags</h1>
        <span v-if="rows.length" class="entity-page__count">{{ rows.length }}</span>
      </div>
    </header>

    <section class="entity-page__panel q-pa-md q-mb-md">
      <q-form class="row q-col-gutter-sm items-start" @submit.prevent="addTag">
        <div class="col-12 col-sm">
          <q-input
            v-model="newTagName"
            dense
            outlined
            label="New tag name"
            :disable="saving"
            hide-bottom-space
          />
        </div>
        <div class="col-12 col-sm-auto">
          <q-btn
            type="submit"
            unelevated
            no-caps
            color="primary"
            icon="add"
            label="Add tag"
            :loading="saving"
            class="full-width"
          />
        </div>
      </q-form>
    </section>

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
              placeholder="Search tags..."
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
            <q-chip dense color="blue-1" text-color="primary" icon="sell">
              {{ props.row.name }}
            </q-chip>
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props" class="entity-table__actions">
            <q-btn flat dense round size="sm" color="grey-7" icon="delete_outline" @click="confirmDelete(props.row)">
              <q-tooltip>Delete</q-tooltip>
            </q-btn>
          </q-td>
        </template>

        <template #no-data>
          <div class="entity-table__empty">
            <q-icon name="sell" size="20px" color="grey-5" />
            <span>{{ filter ? "No tags match your search." : "No tags yet." }}</span>
          </div>
        </template>
      </q-table>
    </section>
  </q-page>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useQuasar } from "quasar";
import { api } from "src/boot/axios";

const $q = useQuasar();

const rows = ref([]);
const loading = ref(false);
const saving = ref(false);
const filter = ref("");
const newTagName = ref("");
const pagination = ref({ rowsPerPage: 25 });

const columns = [
  { name: "name", label: "Tag", field: "name", align: "left", sortable: true },
  { name: "actions", label: "", field: "actions", align: "right" }
];

async function loadTags() {
  loading.value = true;
  try {
    const { data } = await api.get("/tags");
    rows.value = data;
  } catch (err) {
    $q.notify({ type: "negative", message: err.response?.data?.message || "Failed to load tags" });
  } finally {
    loading.value = false;
  }
}

async function addTag() {
  const name = newTagName.value.trim();
  if (!name) {
    $q.notify({ type: "warning", message: "Tag name is required" });
    return;
  }

  saving.value = true;
  try {
    await api.post("/tags", { name });
    newTagName.value = "";
    $q.notify({ type: "positive", message: "Tag added" });
    await loadTags();
  } catch (err) {
    $q.notify({ type: "negative", message: err.response?.data?.message || "Failed to add tag" });
  } finally {
    saving.value = false;
  }
}

function confirmDelete(tag) {
  $q.dialog({
    title: "Delete tag",
    message: `Remove "${tag.name}"? It will be removed anywhere it has been applied.`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await api.delete(`/tags/${tag.id}`);
      $q.notify({ type: "positive", message: "Tag deleted" });
      await loadTags();
    } catch (err) {
      $q.notify({ type: "negative", message: err.response?.data?.message || "Failed to delete tag" });
    }
  });
}

onMounted(loadTags);
</script>
