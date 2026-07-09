<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
    @show="onShow"
  >
    <q-card class="lifegroup-add-member">
      <header class="lifegroup-add-member__header">
        <div>
          <h2 class="lifegroup-add-member__title">Add member</h2>
          <p class="lifegroup-add-member__subtitle">Search and add a member to this lifegroup.</p>
        </div>
        <q-btn flat round dense icon="close" color="grey-7" :disable="adding" @click="close" />
      </header>

      <q-separator />

      <section class="lifegroup-add-member__body">
        <q-input
          v-model="search"
          dense
          outlined
          clearable
          placeholder="Search by name…"
          class="lifegroup-add-member__search"
          @update:model-value="onSearch"
        >
          <template #prepend>
            <q-icon name="search" size="18px" color="grey-6" />
          </template>
        </q-input>

        <q-inner-loading :showing="loading">
          <q-spinner size="24px" color="primary" />
        </q-inner-loading>

        <div v-if="!loading && !results.length" class="lifegroup-add-member__empty">
          {{ search ? "No members found." : "Type a name to search members." }}
        </div>

        <ul v-else class="lifegroup-add-member__list">
          <li v-for="member in results" :key="member.id" class="lifegroup-add-member__item">
            <div class="lifegroup-add-member__info">
              <div class="lifegroup-add-member__name">{{ member.lastName }}, {{ member.firstName }}</div>
              <div class="lifegroup-add-member__meta">{{ member.email || member.phone || "—" }}</div>
            </div>
            <q-btn
              dense
              unelevated
              no-caps
              color="primary"
              label="Add"
              :loading="addingId === member.id"
              :disable="adding && addingId !== member.id"
              @click="addMember(member)"
            />
          </li>
        </ul>
      </section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch } from "vue";
import { useQuasar } from "quasar";
import { api } from "src/boot/axios";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  lifeGroupId: { type: [String, Number], default: null },
  excludeMemberIds: { type: Array, default: () => [] }
});

const emit = defineEmits(["update:modelValue", "added"]);

const $q = useQuasar();
const search = ref("");
const results = ref([]);
const loading = ref(false);
const adding = ref(false);
const addingId = ref(null);
let searchTimer = null;

function close() {
  if (adding.value) return;
  emit("update:modelValue", false);
}

function reset() {
  search.value = "";
  results.value = [];
}

async function fetchMembers(term = "") {
  loading.value = true;
  try {
    const { data } = await api.get("/members", {
      params: term ? { search: term } : {}
    });
    const excluded = new Set(props.excludeMemberIds.map((id) => Number(id)));
    results.value = data.filter((member) => !excluded.has(Number(member.id)));
  } finally {
    loading.value = false;
  }
}

function onSearch() {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    fetchMembers(search.value.trim());
  }, 300);
}

async function onShow() {
  reset();
  await fetchMembers();
}

async function addMember(member) {
  adding.value = true;
  addingId.value = member.id;
  try {
    const { data } = await api.post(`/lifegroups/${props.lifeGroupId}/members`, {
      memberId: member.id
    });
    $q.notify({ type: "positive", message: `${member.firstName} ${member.lastName} added.` });
    emit("added", data);
    emit("update:modelValue", false);
    reset();
  } catch (err) {
    const message = err?.response?.data?.message || "Failed to add member.";
    $q.notify({ type: "negative", message: Array.isArray(message) ? message[0] : message });
  } finally {
    adding.value = false;
    addingId.value = null;
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (!open) reset();
  }
);
</script>

<style scoped lang="scss">
.lifegroup-add-member {
  width: min(480px, 92vw);
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  border-radius: 10px;
}

.lifegroup-add-member__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px 12px;
}

.lifegroup-add-member__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a2e;
}

.lifegroup-add-member__subtitle {
  margin: 2px 0 0;
  font-size: 0.78rem;
  color: #6b7280;
}

.lifegroup-add-member__body {
  position: relative;
  padding: 12px 16px 16px;
  overflow-y: auto;
  flex: 1;
}

.lifegroup-add-member__search {
  margin-bottom: 12px;
}

.lifegroup-add-member__empty {
  padding: 24px 8px;
  text-align: center;
  color: #8b93a1;
  font-size: 0.84rem;
}

.lifegroup-add-member__list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.lifegroup-add-member__item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #f0f2f5;

  &:last-child {
    border-bottom: none;
  }
}

.lifegroup-add-member__name {
  font-size: 0.88rem;
  font-weight: 500;
  color: #1a1a2e;
}

.lifegroup-add-member__meta {
  font-size: 0.76rem;
  color: #6b7280;
  margin-top: 2px;
}
</style>
