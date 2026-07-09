<template>
  <q-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    @show="loadChurch"
  >
    <q-card class="entity-dialog church-details-dialog">
      <header class="entity-dialog__header">
        <div>
          <h2 class="entity-dialog__title">{{ church.name || "Church details" }}</h2>
          <p class="entity-dialog__subtitle">Church profile overview</p>
        </div>
        <q-btn flat round dense icon="close" color="grey-7" @click="close" />
      </header>

      <q-separator />

      <q-card-section class="entity-dialog__body church-details-dialog__body">
        <q-inner-loading :showing="loading">
          <q-spinner size="28px" color="primary" />
        </q-inner-loading>

        <div class="church-details-dialog__layout">
          <dl class="entity-details church-details-dialog__details">
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

          <aside class="church-details-dialog__stats">
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
                {{ stats.directMemberCount }} linked directly · {{ stats.lifeGroupMemberCount }} via lifegroups
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
      </q-card-section>

      <q-separator />

      <footer class="entity-dialog__footer">
        <q-btn flat no-caps label="Close" color="grey-8" @click="close" />
        <q-btn unelevated no-caps color="primary" label="Edit" icon="edit" @click="onEdit" />
      </footer>
    </q-card>
  </q-dialog>

  <ChurchMembersDialog
    v-model="membersDialogOpen"
    :church-id="churchId"
    :church-name="churchDisplayName"
  />

  <ChurchLifeGroupsDialog
    v-model="lifeGroupsDialogOpen"
    :church-id="churchId"
    :church-name="churchDisplayName"
  />

  <ChurchEventsDialog
    v-model="eventsDialogOpen"
    :church-id="churchId"
    :church-name="churchDisplayName"
  />
</template>

<script setup>
import { computed, ref } from "vue";
import { useQuasar } from "quasar";
import { api } from "src/boot/axios";
import ChurchMembersDialog from "src/components/ChurchMembersDialog.vue";
import ChurchLifeGroupsDialog from "src/components/ChurchLifeGroupsDialog.vue";
import ChurchEventsDialog from "src/components/ChurchEventsDialog.vue";
import { getChurchDisplayName } from "src/utils/churchDisplay";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  churchId: { type: [String, Number], default: null }
});

const emit = defineEmits(["update:modelValue", "edit"]);

const $q = useQuasar();
const loading = ref(false);
const church = ref({});
const membersDialogOpen = ref(false);
const lifeGroupsDialogOpen = ref(false);
const eventsDialogOpen = ref(false);

const stats = computed(() => church.value.stats || {
  memberCount: 0,
  lifeGroupMemberCount: 0,
  directMemberCount: 0,
  lifeGroupCount: 0,
  eventsParticipated: 0
});

const churchDisplayName = computed(() => getChurchDisplayName(church.value));

function close() {
  emit("update:modelValue", false);
}

function onEdit() {
  emit("edit", church.value);
  close();
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

async function loadChurch() {
  if (!props.churchId) return;

  loading.value = true;
  try {
    const { data } = await api.get(`/churches/${props.churchId}`);
    church.value = data;
  } catch {
    $q.notify({ type: "negative", message: "Failed to load church details." });
    close();
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped lang="scss">
.church-details-dialog {
  width: 80vw;
  max-width: 80vw;
}

.church-details-dialog__body {
  padding: 16px 20px;
}

.church-details-dialog__layout {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 280px);
  gap: 24px;
  align-items: start;
}

.church-details-dialog__details {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.church-details-dialog__stats {
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
  .church-details-dialog {
    width: 92vw;
    max-width: 92vw;
  }

  .church-details-dialog__layout {
    grid-template-columns: 1fr;
  }
}
</style>
