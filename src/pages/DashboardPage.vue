<template>
  <q-page padding>
    <div class="page-header q-mb-md">
      <div>
        <div class="text-h5">Admin Dashboard</div>
        <div class="text-caption text-grey-7">Overview of members, churches, and lifegroups.</div>
      </div>
      <div class="page-header__actions">
        <q-btn color="primary" unelevated icon="person_add" label="Add Member" @click="memberDialogOpen = true" />
        <q-btn color="secondary" unelevated icon="group_add" label="Add LifeGroup" @click="lifeGroupDialogOpen = true" />
      </div>
    </div>
    <div class="row q-col-gutter-md">
      <div class="col-12 col-md-3" v-for="card in cards" :key="card.label">
        <component :is="card.to ? 'router-link' : 'div'" :to="card.to" class="dashboard-stat-link">
          <q-card class="bg-white shadow-3 dashboard-stat-card" :class="{ 'dashboard-stat-card--clickable': card.to }">
            <q-card-section class="row items-center">
              <q-avatar :color="card.color" text-color="white" :icon="card.icon" />
              <div class="q-ml-md">
                <div class="text-subtitle2">{{ card.label }}</div>
                <div class="text-h6">{{ card.value }}</div>
              </div>
            </q-card-section>
          </q-card>
        </component>
      </div>
    </div>
    <q-card class="q-mt-lg shadow-2 dashboard-upcoming dashboard-panel--clickable" @click="goToEvents">
      <q-card-section class="row items-center q-gutter-sm">
        <q-icon name="event" color="primary" />
        <div class="text-subtitle1">Upcoming Events</div>
      </q-card-section>
      <q-separator />
      <q-card-section v-if="upcomingEvents.length" class="dashboard-upcoming__list">
        <article v-for="event in upcomingEvents" :key="event.id" class="dashboard-upcoming__item" @click.stop="goToEvent(event.id)">
          <div class="dashboard-upcoming__header">
            <span class="dashboard-upcoming__name">
              {{ event.name }}
            </span>
            <q-badge :color="statusColor(event.status)" :label="event.status" />
          </div>
          <p class="dashboard-upcoming__meta">
            {{ formatEventDates(event, "Date TBA") }} · {{ formatEventTime(event.eventTime) }} · {{ event.location }}
          </p>
          <div class="dashboard-upcoming__stats">
            <div class="dashboard-upcoming__stat">
              <span class="dashboard-upcoming__stat-label">Expected participants</span>
              <span class="dashboard-upcoming__stat-value">{{ formatCount(event.expectedParticipants) }}</span>
            </div>
            <div class="dashboard-upcoming__stat">
              <span class="dashboard-upcoming__stat-label">Reserved participants</span>
              <span class="dashboard-upcoming__stat-value">{{ formatCount(event.reservedParticipants) }}</span>
            </div>
            <div class="dashboard-upcoming__stat">
              <span class="dashboard-upcoming__stat-label">Registered participants</span>
              <span class="dashboard-upcoming__stat-value">{{ event.registeredParticipants }}</span>
            </div>
          </div>
        </article>
      </q-card-section>
      <q-card-section v-else class="dashboard-upcoming__empty">
        No upcoming events scheduled.
      </q-card-section>
    </q-card>

    <q-card class="q-mt-lg shadow-2">
      <q-card-section class="row items-center q-gutter-sm">
        <q-icon name="tips_and_updates" color="warning" />
        <div class="text-subtitle1">Quick Insight</div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        Keep attendance updated weekly so growth and engagement reports are accurate.
      </q-card-section>
    </q-card>

    <MemberFormDialog v-model="memberDialogOpen" mode="create" @saved="onMemberSaved" />
    <LifeGroupFormDialog v-model="lifeGroupDialogOpen" mode="create" @saved="onLifeGroupSaved" />
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { api } from "src/boot/axios";
import MemberFormDialog from "src/components/MemberFormDialog.vue";
import LifeGroupFormDialog from "src/components/LifeGroupFormDialog.vue";
import { formatEventTime } from "src/utils/eventTime";
import { formatEventDates } from "src/utils/eventDates";

const router = useRouter();
const stats = ref({
  totalMembers: 0,
  totalChurches: 0,
  totalNetworkChurches: 0,
  totalLifeGroups: 0,
  totalKids: 0
});
const upcomingEvents = ref([]);

const memberDialogOpen = ref(false);
const lifeGroupDialogOpen = ref(false);

const cards = computed(() => [
  { label: "Total Members", value: stats.value.totalMembers, icon: "badge", color: "primary", to: "/members" },
  { label: "Total Churches", value: stats.value.totalChurches, icon: "church", color: "secondary", to: "/churches" },
  {
    label: "LG Network Churches",
    value: stats.value.totalNetworkChurches,
    icon: "account_tree",
    color: "teal",
    to: "/lg-network-churches"
  },
  { label: "Total LifeGroups", value: stats.value.totalLifeGroups, icon: "hub", color: "accent", to: "/lifegroups" },
  {
    label: "Total Kids",
    value: stats.value.totalKids,
    icon: "child_care",
    color: "orange",
    to: { path: "/members", query: { tag: "Kids" } }
  }
]);

function goToEvents() {
  router.push("/events");
}

function goToEvent(eventId) {
  router.push(`/events/${eventId}`);
}

function onMemberSaved() {
  stats.value.totalMembers += 1;
}

function onLifeGroupSaved() {
  stats.value.totalLifeGroups += 1;
}

function formatCount(value) {
  return value == null ? "—" : value;
}

function statusColor(status) {
  if (status === "published") return "positive";
  if (status === "ongoing") return "info";
  if (status === "draft") return "grey-6";
  return "grey-7";
}

async function loadStats() {
  const { data } = await api.get("/dashboard");
  stats.value = {
    totalMembers: data.totalMembers,
    totalChurches: data.totalChurches,
    totalNetworkChurches: data.totalNetworkChurches || 0,
    totalLifeGroups: data.totalLifeGroups,
    totalKids: data.totalKids
  };
  upcomingEvents.value = data.upcomingEvents || [];
}

onMounted(loadStats);
</script>

<style scoped lang="scss">
.dashboard-stat-link {
  display: block;
  color: inherit;
  text-decoration: none;
}

.dashboard-stat-card--clickable {
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(26, 26, 46, 0.12);
  }
}

.dashboard-panel--clickable {
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    box-shadow: 0 8px 20px rgba(26, 26, 46, 0.08);
  }
}

.dashboard-upcoming__list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 12px;
  padding-bottom: 12px;
}

.dashboard-upcoming__item {
  padding: 14px 16px;
  border: 1px solid #e4e8ef;
  border-radius: 8px;
  background: #fafbfc;
  cursor: pointer;
  transition: border-color 0.15s ease, background-color 0.15s ease;

  &:hover {
    background: #f1f5f9;
    border-color: #c7d2e0;
  }
}

.dashboard-upcoming__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.dashboard-upcoming__name {
  font-size: 0.95rem;
  font-weight: 600;
  color: #1a1a2e;
}

.dashboard-upcoming__meta {
  margin: 6px 0 10px;
  font-size: 0.78rem;
  color: #6b7280;
}

.dashboard-upcoming__stats {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.dashboard-upcoming__stat {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.dashboard-upcoming__stat-label {
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #8b93a1;
}

.dashboard-upcoming__stat-value {
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a2e;
}

.dashboard-upcoming__empty {
  color: #8b93a1;
  font-size: 0.84rem;
}

@media (max-width: 1023px) {
  .dashboard-upcoming__stats {
    grid-template-columns: 1fr;
  }
}
</style>
