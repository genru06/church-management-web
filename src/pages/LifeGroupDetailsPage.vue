<template>
  <q-page class="entity-page lifegroup-details-page">
    <header class="entity-page__header">
      <div class="entity-page__heading">
        <h1 class="entity-page__title">{{ group.name || "Lifegroup details" }}</h1>
      </div>
      <div class="entity-page__actions">
        <q-btn dense flat no-caps color="grey-8" icon="arrow_back" label="Back" to="/lifegroups" />
        <q-btn
          dense
          unelevated
          no-caps
          color="primary"
          icon="person_add"
          label="Add member"
          @click="addMemberDialogOpen = true"
        />
        <q-btn dense unelevated no-caps color="primary" icon="edit" label="Edit" @click="openEditDialog" />
      </div>
    </header>

    <section class="entity-page__panel q-pa-md q-mb-sm">
      <q-inner-loading :showing="loading">
        <q-spinner size="28px" color="primary" />
      </q-inner-loading>

      <dl class="entity-details">
        <div class="entity-details__item">
          <dt class="entity-details__label">Coach</dt>
          <dd class="entity-details__value">{{ group.coachName || "—" }}</dd>
        </div>
        <div class="entity-details__item">
          <dt class="entity-details__label">Members</dt>
          <dd class="entity-details__value">{{ group.members?.length || 0 }}</dd>
        </div>
      </dl>
    </section>

    <section v-if="!loading && hasMembers" class="entity-page__panel lifegroup-details-page__chart q-pa-sm">
      <LifeGroupOrgChart
        :coach-id="group.coachId"
        :coach-name="group.coachName"
        :coach-tags="group.coachTags || []"
        :members="group.members || []"
        :group-name="group.name || 'LifeGroup'"
      />
    </section>

    <section v-else-if="!loading" class="entity-page__panel lifegroup-details-page__empty q-pa-lg text-center">
      <q-icon name="hub" size="28px" color="grey-5" />
      <p class="q-mt-sm q-mb-md text-grey-7">No members in this lifegroup yet.</p>
      <q-btn unelevated no-caps color="primary" icon="person_add" label="Add member" @click="addMemberDialogOpen = true" />
    </section>

    <LifeGroupFormDialog
      v-model="formDialogOpen"
      mode="edit"
      :life-group-id="id"
      @saved="onLifeGroupSaved"
    />

    <LifeGroupAddMemberDialog
      v-model="addMemberDialogOpen"
      :life-group-id="id"
      :exclude-member-ids="excludeMemberIds"
      @added="onMemberAdded"
    />
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { api } from "src/boot/axios";
import LifeGroupOrgChart from "src/components/LifeGroupOrgChart.vue";
import LifeGroupFormDialog from "src/components/LifeGroupFormDialog.vue";
import LifeGroupAddMemberDialog from "src/components/LifeGroupAddMemberDialog.vue";

const props = defineProps({ id: { type: [String, Number], required: true } });
const router = useRouter();
const group = ref({});
const loading = ref(false);
const formDialogOpen = ref(false);
const addMemberDialogOpen = ref(false);

const hasMembers = computed(() => (group.value.members || []).length > 0);

const excludeMemberIds = computed(() => {
  const ids = (group.value.members || []).map((m) => m.id);
  if (group.value.coachId) ids.push(group.value.coachId);
  return ids;
});

function openEditDialog() {
  formDialogOpen.value = true;
}

function onLifeGroupSaved(data) {
  group.value = data;
}

function onMemberAdded(data) {
  group.value = data;
}

onMounted(async () => {
  loading.value = true;
  try {
    const { data } = await api.get(`/lifegroups/${props.id}`);
    group.value = data;
  } catch {
    router.push("/lifegroups");
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.lifegroup-details-page__chart {
  background: #f8f9fb;
  overflow-x: auto;
  min-height: 480px;
}

.lifegroup-details-page__empty {
  color: #8b93a1;
}
</style>
