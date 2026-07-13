<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    @show="loadMembers"
  >
    <q-card class="entity-dialog church-members-dialog">
      <header class="entity-dialog__header">
        <div>
          <h2 class="entity-dialog__title">Members in {{ churchName || "this church" }}</h2>
          <p class="entity-dialog__subtitle">{{ rows.length }} member(s)</p>
        </div>
        <q-btn flat round dense icon="close" color="grey-7" @click="close" />
      </header>

      <q-separator />

      <q-card-section class="church-members-dialog__body">
        <q-table
          :rows="rows"
          :columns="columns"
          row-key="id"
          flat
          dense
          :loading="loading"
          :rows-per-page-options="[10, 25, 50]"
          :pagination="{ rowsPerPage: 10 }"
          class="church-members-dialog__table"
        >
          <template #body-cell-dateOfBirth="props">
            <q-td :props="props">
              <span class="church-members-dialog__muted">{{ formatDate(props.row.dateOfBirth) }}</span>
            </q-td>
          </template>

          <template #body-cell-linkType="props">
            <q-td :props="props">
              <span class="church-members-dialog__muted">{{ props.row.linkType || "—" }}</span>
            </q-td>
          </template>

          <template #body-cell-tags="props">
            <q-td :props="props">
              <div v-if="props.row.tags?.length" class="church-members-dialog__tags">
                <q-chip
                  v-for="tag in props.row.tags"
                  :key="tag"
                  dense
                  size="sm"
                  :color="isKidsTag(tag) ? 'amber-2' : 'grey-2'"
                  :text-color="isKidsTag(tag) ? 'amber-10' : 'grey-8'"
                >
                  {{ tag }}
                </q-chip>
              </div>
              <span v-else class="church-members-dialog__muted">—</span>
            </q-td>
          </template>

          <template #body-cell-lifeGroup="props">
            <q-td :props="props">
              <span class="church-members-dialog__muted">{{ props.row.lifeGroup || "—" }}</span>
            </q-td>
          </template>

          <template #no-data>
            <div class="church-members-dialog__empty">
              <q-icon name="group_off" size="20px" color="grey-5" />
              <span>No members found for this church.</span>
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
  { name: "lastName", label: "Last Name", field: "lastName", align: "left", sortable: true },
  { name: "firstName", label: "First Name", field: "firstName", align: "left", sortable: true },
  { name: "dateOfBirth", label: "Birthdate", field: "dateOfBirth", align: "left", sortable: true },
  { name: "linkType", label: "Link", field: "linkType", align: "left", sortable: true },
  { name: "lifeGroup", label: "Lifegroup", field: "lifeGroup", align: "left", sortable: true },
  { name: "tags", label: "Tags", field: "tags", align: "left" }
];

function isKidsTag(tag) {
  return String(tag || "").trim().toLowerCase() === "kids";
}

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function close() {
  emit("update:modelValue", false);
}

async function loadMembers() {
  if (!props.churchId) return;

  loading.value = true;
  try {
    const { data } = await api.get(`/churches/${props.churchId}/members`);
    rows.value = data;
  } catch {
    $q.notify({ type: "negative", message: "Failed to load church members." });
    close();
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped lang="scss">
.church-members-dialog {
  width: min(860px, 92vw);
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}

.church-members-dialog__body {
  padding: 0;
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.church-members-dialog__table {
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

.church-members-dialog__muted {
  color: #5c6370;
}

.church-members-dialog__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.church-members-dialog__empty {
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
