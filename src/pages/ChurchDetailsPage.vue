<template>
  <q-page class="entity-page">
    <header class="entity-page__header">
      <div class="entity-page__heading">
        <h1 class="entity-page__title">{{ church.name || "Church details" }}</h1>
      </div>
      <div class="entity-page__actions">
        <q-btn dense flat no-caps color="grey-8" icon="arrow_back" label="Back" to="/churches" />
        <q-btn dense unelevated no-caps color="primary" icon="edit" label="Edit" @click="openEditDialog" />
      </div>
    </header>

    <section class="entity-page__panel q-pa-md church-details-page__panel">
      <q-inner-loading :showing="loading">
        <q-spinner size="28px" color="primary" />
      </q-inner-loading>

      <div class="church-details-page__layout">
        <dl class="entity-details">
          <div class="entity-details__item">
            <dt class="entity-details__label">Church name</dt>
            <dd class="entity-details__value">{{ church.name || "—" }}</dd>
          </div>
          <div class="entity-details__item">
            <dt class="entity-details__label">Short name</dt>
            <dd class="entity-details__value">{{ church.shortName || "—" }}</dd>
          </div>
          <div class="entity-details__item entity-details__item--full">
            <dt class="entity-details__label">Address</dt>
            <dd class="entity-details__value">{{ church.address || "—" }}</dd>
          </div>
          <div class="entity-details__item">
            <dt class="entity-details__label">Pastor</dt>
            <dd class="entity-details__value">{{ church.pastorName || "—" }}</dd>
          </div>
        </dl>

        <aside class="church-details-page__stats">
          <button
            type="button"
            class="church-stat-card church-stat-card--clickable"
            :disabled="!stats.memberCount"
            @click="openMembersDialog"
          >
            <q-icon name="groups" size="22px" color="primary" />
            <span class="church-stat-card__label">Members in this church</span>
            <span class="church-stat-card__value">{{ stats.memberCount }}</span>
            <span class="church-stat-card__meta">
              {{ stats.directMemberCount }} linked directly · {{ stats.lifeGroupMemberCount }} via lifegroups ·
              {{ stats.kidsMemberCount }} Kids
            </span>
          </button>
          <button
            type="button"
            class="church-stat-card church-stat-card--clickable"
            :disabled="!stats.lifeGroupCount"
            @click="openLifeGroupsDialog"
          >
            <q-icon name="hub" size="22px" color="secondary" />
            <span class="church-stat-card__label">Lifegroups</span>
            <span class="church-stat-card__value">{{ stats.lifeGroupCount }}</span>
          </button>
          <button
            type="button"
            class="church-stat-card church-stat-card--clickable"
            :disabled="!stats.eventsParticipated"
            @click="openEventsDialog"
          >
            <q-icon name="event" size="22px" color="accent" />
            <span class="church-stat-card__label">Events participated</span>
            <span class="church-stat-card__value">{{ stats.eventsParticipated }}</span>
          </button>
        </aside>
      </div>
    </section>

    <ChurchFormDialog
      v-model="formDialogOpen"
      mode="edit"
      :church-id="id"
      @saved="onChurchSaved"
    />

    <ChurchMembersDialog
      v-model="membersDialogOpen"
      :church-id="id"
      :church-name="churchDisplayName"
    />

    <ChurchLifeGroupsDialog
      v-model="lifeGroupsDialogOpen"
      :church-id="id"
      :church-name="churchDisplayName"
    />

    <ChurchEventsDialog
      v-model="eventsDialogOpen"
      :church-id="id"
      :church-name="churchDisplayName"
    />
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { api } from "src/boot/axios";
import ChurchFormDialog from "src/components/ChurchFormDialog.vue";
import ChurchMembersDialog from "src/components/ChurchMembersDialog.vue";
import ChurchLifeGroupsDialog from "src/components/ChurchLifeGroupsDialog.vue";
import ChurchEventsDialog from "src/components/ChurchEventsDialog.vue";
import { getChurchDisplayName } from "src/utils/churchDisplay";

const props = defineProps({ id: { type: [String, Number], required: true } });
const router = useRouter();
const church = ref({});
const loading = ref(false);
const formDialogOpen = ref(false);
const membersDialogOpen = ref(false);
const lifeGroupsDialogOpen = ref(false);
const eventsDialogOpen = ref(false);

const stats = computed(() => church.value.stats || {
  memberCount: 0,
  lifeGroupMemberCount: 0,
  directMemberCount: 0,
  kidsMemberCount: 0,
  lifeGroupCount: 0,
  eventsParticipated: 0
});

const churchDisplayName = computed(() => getChurchDisplayName(church.value));

function openEditDialog() {
  formDialogOpen.value = true;
}

function onChurchSaved(data) {
  church.value = data;
}

function openMembersDialog() {
  if (!stats.value.memberCount) return;
  membersDialogOpen.value = true;
}

function openLifeGroupsDialog() {
  if (!stats.value.lifeGroupCount) return;
  lifeGroupsDialogOpen.value = true;
}

function openEventsDialog() {
  if (!stats.value.eventsParticipated) return;
  eventsDialogOpen.value = true;
}

onMounted(async () => {
  loading.value = true;
  try {
    const { data } = await api.get(`/churches/${props.id}`);
    church.value = data;
  } catch {
    router.push("/churches");
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped lang="scss">
.church-details-page__panel {
  overflow: visible;
}

.church-details-page__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 280px);
  gap: 24px;
  align-items: start;
}

.church-details-page__stats {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.church-stat-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
  background: #f8fafc;
  border: 1px solid #e4e8ef;
  border-radius: 8px;
  text-align: left;
  width: 100%;
}

.church-stat-card--clickable {
  appearance: none;
  font: inherit;
  color: inherit;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;

  &:hover:not(:disabled) {
    background: #f1f5f9;
    border-color: #c7d2e0;
  }

  &:disabled {
    cursor: default;
    opacity: 0.85;
  }
}

.church-stat-card__label {
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #8b93a1;
}

.church-stat-card__value {
  font-size: 1.35rem;
  font-weight: 600;
  color: #1a1a2e;
  line-height: 1.2;
}

.church-stat-card__meta {
  font-size: 0.72rem;
  color: #6b7280;
  line-height: 1.3;
}

@media (max-width: 768px) {
  .church-details-page__layout {
    grid-template-columns: 1fr;
  }
}
</style>
