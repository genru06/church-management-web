<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="leftDrawerOpen = !leftDrawerOpen" />
        <q-toolbar-title class="row items-center q-gutter-sm">
          <q-icon name="church" />
          <span class="gt-xs">Blessed Hope Church Management System</span>
          <span class="lt-sm">BHCCCI System</span>
        </q-toolbar-title>
        <q-chip
          v-if="primaryTag"
          color="white"
          text-color="primary"
          :icon="tagIcon"
          class="gt-xs"
        >
          {{ primaryTag }}
        </q-chip>
        <q-btn flat dense round icon="logout" @click="onLogout">
          <q-tooltip>Sign out</q-tooltip>
        </q-btn>
      </q-toolbar>
    </q-header>

    <q-drawer
      v-model="leftDrawerOpen"
      show-if-above
      bordered
      :width="260"
      :breakpoint="1024"
    >
      <q-list class="q-pa-sm">
        <q-item class="q-mb-sm">
          <q-item-section avatar>
            <q-avatar color="primary" text-color="white" icon="person" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-medium">{{ auth.fullName }}</q-item-label>
            <q-item-label caption>@{{ auth.username }}</q-item-label>
          </q-item-section>
        </q-item>

        <div v-if="auth.tags.length" class="q-px-md q-mb-sm row q-gutter-xs">
          <q-chip
            v-for="tag in auth.tags"
            :key="tag"
            dense
            size="sm"
            color="blue-1"
            text-color="primary"
          >
            {{ tag }}
          </q-chip>
        </div>

        <q-separator spaced />

        <q-item
          v-for="item in nav"
          :key="item.to"
          clickable
          :to="item.to"
          active-class="bg-blue-1 text-primary"
          class="rounded-borders"
        >
          <q-item-section avatar>
            <q-icon :name="item.icon" />
          </q-item-section>
          <q-item-section>{{ item.label }}</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useQuasar } from "quasar";
import { useAuthStore } from "src/stores/auth";
import { filterNavByTags, primaryTagLabel } from "src/utils/permissions";

const $q = useQuasar();
const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
// Keep in sync with drawer breakpoint (1024). Below that Quasar uses overlay mode,
// so starting open on tablets/iPads covers the page and hides content underneath.
const leftDrawerOpen = ref($q.screen.gt.md);

watch(
  () => route.path,
  () => {
    if ($q.screen.lt.md) {
      leftDrawerOpen.value = false;
    }
  }
);

const nav = computed(() => filterNavByTags(auth.tags, auth.permissions));
const primaryTag = computed(() => primaryTagLabel(auth.tags));

const tagIcon = computed(() => {
  const tag = primaryTag.value;
  if (tag === "Super User" || tag === "Main Church Admin") return "admin_panel_settings";
  if (tag === "Executive Pastor" || tag === "Pastor") return "church";
  if (tag === "Life Coach") return "groups";
  if (tag === "Events Manager") return "event";
  return "badge";
});

onMounted(() => {
  if (auth.isAuthenticated) {
    auth.fetchMe().catch(() => {});
  }
});

function onLogout() {
  $q.dialog({
    title: "Sign out",
    message: "Are you sure you want to sign out?",
    cancel: true,
    persistent: true
  }).onOk(() => {
    auth.logout();
    router.push("/login");
  });
}
</script>
