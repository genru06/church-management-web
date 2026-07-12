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
        <q-card class="bg-white shadow-3">
          <q-card-section class="row items-center">
            <q-avatar :color="card.color" text-color="white" :icon="card.icon" />
            <div class="q-ml-md">
              <div class="text-subtitle2">{{ card.label }}</div>
              <div class="text-h6">{{ card.value }}</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
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
import { api } from "src/boot/axios";
import MemberFormDialog from "src/components/MemberFormDialog.vue";
import LifeGroupFormDialog from "src/components/LifeGroupFormDialog.vue";

const stats = ref({
  totalMembers: 0,
  totalChurches: 0,
  totalLifeGroups: 0
});

const memberDialogOpen = ref(false);
const lifeGroupDialogOpen = ref(false);

const cards = computed(() => [
  { label: "Total Members", value: stats.value.totalMembers, icon: "badge", color: "primary" },
  { label: "Total Churches", value: stats.value.totalChurches, icon: "church", color: "secondary" },
  { label: "Total LifeGroups", value: stats.value.totalLifeGroups, icon: "hub", color: "accent" },
  { label: "Active Admins", value: 1, icon: "admin_panel_settings", color: "positive" }
]);

function onMemberSaved() {
  stats.value.totalMembers += 1;
}

function onLifeGroupSaved() {
  stats.value.totalLifeGroups += 1;
}

async function loadStats() {
  const { data } = await api.get("/dashboard");
  stats.value = data;
}

onMounted(loadStats);
</script>
