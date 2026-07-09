<template>
  <q-dialog
    :model-value="modelValue"
    maximized
    @update:model-value="$emit('update:modelValue', $event)"
    @show="loadLifeGroup"
  >
    <q-card class="lifegroup-details-dialog">
      <header class="lifegroup-details-dialog__header">
        <div>
          <h2 class="lifegroup-details-dialog__title">{{ group.name || "Lifegroup" }}</h2>
          <p class="lifegroup-details-dialog__subtitle">
            {{ group.coachName || "—" }}
            <span v-if="group.members?.length"> · {{ group.members.length }} member(s)</span>
          </p>
        </div>
        <div class="lifegroup-details-dialog__actions">
          <q-btn
            dense
            unelevated
            no-caps
            color="primary"
            icon="person_add"
            label="Add member"
            @click="addMemberDialogOpen = true"
          />
          <q-btn dense unelevated no-caps color="grey-8" icon="edit" label="Edit" @click="onEdit" />
          <q-btn flat round dense icon="close" color="grey-7" @click="close" />
        </div>
      </header>

      <q-separator />

      <q-card-section class="lifegroup-details-dialog__body">
        <q-inner-loading :showing="loading">
          <q-spinner size="32px" color="primary" />
        </q-inner-loading>

        <div v-if="!loading && !hasMembers" class="lifegroup-details-dialog__empty">
          <q-icon name="hub" size="32px" color="grey-5" />
          <p>No members in this lifegroup yet.</p>
          <q-btn
            unelevated
            no-caps
            color="primary"
            icon="person_add"
            label="Add first member"
            @click="addMemberDialogOpen = true"
          />
        </div>

        <div v-else-if="!loading" class="lifegroup-details-dialog__chart">
          <LifeGroupOrgChart
            :coach-id="group.coachId"
            :coach-name="group.coachName"
            :coach-tags="group.coachTags || []"
            :members="group.members || []"
            :group-name="group.name || 'LifeGroup'"
          />
        </div>
      </q-card-section>
    </q-card>

    <LifeGroupAddMemberDialog
      v-model="addMemberDialogOpen"
      :life-group-id="lifeGroupId"
      :exclude-member-ids="excludeMemberIds"
      @added="onMemberAdded"
    />
  </q-dialog>
</template>

<script setup>
import { computed, ref } from "vue";
import { useQuasar } from "quasar";
import { api } from "src/boot/axios";
import LifeGroupOrgChart from "src/components/LifeGroupOrgChart.vue";
import LifeGroupAddMemberDialog from "src/components/LifeGroupAddMemberDialog.vue";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  lifeGroupId: { type: [String, Number], default: null }
});

const emit = defineEmits(["update:modelValue", "edit", "updated"]);

const $q = useQuasar();
const loading = ref(false);
const group = ref({});
const addMemberDialogOpen = ref(false);

const hasMembers = computed(() => (group.value.members || []).length > 0);

const excludeMemberIds = computed(() => {
  const ids = (group.value.members || []).map((m) => m.id);
  if (group.value.coachId) ids.push(group.value.coachId);
  return ids;
});

function close() {
  emit("update:modelValue", false);
}

function onEdit() {
  emit("edit", group.value);
  close();
}

function onMemberAdded(data) {
  group.value = data;
  emit("updated", data);
}

async function loadLifeGroup() {
  if (!props.lifeGroupId) return;

  loading.value = true;
  try {
    const { data } = await api.get(`/lifegroups/${props.lifeGroupId}`);
    group.value = data;
  } catch {
    $q.notify({ type: "negative", message: "Failed to load lifegroup details." });
    close();
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped lang="scss">
.lifegroup-details-dialog {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f7fa;
}

.lifegroup-details-dialog__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  background: #fff;
}

.lifegroup-details-dialog__title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a1a2e;
}

.lifegroup-details-dialog__subtitle {
  margin: 2px 0 0;
  font-size: 0.8rem;
  color: #6b7280;
}

.lifegroup-details-dialog__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.lifegroup-details-dialog__body {
  position: relative;
  flex: 1;
  padding: 16px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.lifegroup-details-dialog__chart {
  flex: 1;
  min-height: 0;
  background: #fff;
  border: 1px solid #e4e8ef;
  border-radius: 8px;
  padding: 12px;
  overflow: auto;
}

.lifegroup-details-dialog__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: #8b93a1;
  font-size: 0.9rem;

  p {
    margin: 0;
  }
}
</style>
