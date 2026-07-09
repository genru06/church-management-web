<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    @show="loadLifeGroups"
  >
    <q-card class="entity-dialog church-list-dialog">
      <header class="entity-dialog__header">
        <div>
          <h2 class="entity-dialog__title">Lifegroups in {{ churchName || "this church" }}</h2>
          <p class="entity-dialog__subtitle">{{ rows.length }} lifegroup(s)</p>
        </div>
        <q-btn flat round dense icon="close" color="grey-7" @click="close" />
      </header>

      <q-separator />

      <q-card-section class="church-list-dialog__body">
        <q-table
          :rows="rows"
          :columns="columns"
          row-key="id"
          flat
          dense
          :loading="loading"
          :rows-per-page-options="[10, 25, 50]"
          :pagination="{ rowsPerPage: 10 }"
          class="church-list-dialog__table"
        >
          <template #body-cell-coachName="props">
            <q-td :props="props">
              <span class="church-list-dialog__muted">{{ props.row.coachName || "—" }}</span>
            </q-td>
          </template>

          <template #no-data>
            <div class="church-list-dialog__empty">
              <q-icon name="hub" size="20px" color="grey-5" />
              <span>No lifegroups found for this church.</span>
            </div>
          </template>
        </q-table>
      </q-card-section>

      <q-separator />

      <footer class="entity-dialog__footer">
        <q-btn flat no-caps label="Close" color="grey-8" @click="close" />
      </footer>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref } from "vue";
import { useQuasar } from "quasar";
import { api } from "src/boot/axios";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  churchId: { type: [String, Number], default: null },
  churchName: { type: String, default: "" }
});

const emit = defineEmits(["update:modelValue"]);

const $q = useQuasar();
const loading = ref(false);
const rows = ref([]);

const columns = [
  { name: "name", label: "Lifegroup", field: "name", align: "left", sortable: true },
  { name: "coachName", label: "Coach", field: "coachName", align: "left", sortable: true },
  { name: "memberCount", label: "Members", field: "memberCount", align: "right", sortable: true }
];

function close() {
  emit("update:modelValue", false);
}

async function loadLifeGroups() {
  if (!props.churchId) return;

  loading.value = true;
  try {
    const { data } = await api.get(`/churches/${props.churchId}/lifegroups`);
    rows.value = data;
  } catch {
    $q.notify({ type: "negative", message: "Failed to load church lifegroups." });
    close();
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped lang="scss">
.church-list-dialog {
  width: min(640px, 92vw);
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}

.church-list-dialog__body {
  padding: 0;
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.church-list-dialog__table {
  :deep(.q-table__top) {
    display: none;
  }

  :deep(.q-table th) {
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: #8b93a1;
  }

  :deep(.q-table td) {
    font-size: 0.82rem;
    color: #2d3340;
  }
}

.church-list-dialog__muted {
  color: #5c6370;
}

.church-list-dialog__empty {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 24px 12px;
  color: #8b93a1;
  font-size: 0.82rem;
}
</style>
