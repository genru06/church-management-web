<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated class="bg-primary text-white">
      <q-toolbar>
        <q-btn dense flat round icon="menu" @click="leftDrawerOpen = !leftDrawerOpen" />
        <q-toolbar-title class="row items-center q-gutter-sm">
          <q-icon name="groups" />
          <span>LifeGroup Admin</span>
        </q-toolbar-title>
        <q-chip color="white" text-color="primary" icon="admin_panel_settings">Administrator</q-chip>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered :width="260">
      <q-list class="q-pa-sm">
        <q-item class="q-mb-sm">
          <q-item-section avatar>
            <q-avatar color="primary" text-color="white" icon="person" />
          </q-item-section>
          <q-item-section>
            <q-item-label class="text-weight-medium">Admin User</q-item-label>
            <q-item-label caption>lifegroup system</q-item-label>
          </q-item-section>
        </q-item>
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
import { ref } from "vue";

const leftDrawerOpen = ref(true);

const nav = [
  { label: "Dashboard", to: "/dashboard", icon: "dashboard" },
  { label: "Members", to: "/members", icon: "badge" },
  { label: "Churches", to: "/churches", icon: "church" },
  { label: "LifeGroups", to: "/lifegroups", icon: "hub" },
  { label: "Events", to: "/events", icon: "event" },
  { label: "Operations", to: "/operations", icon: "account_balance" },
  { label: "Attendance", to: "/attendance", icon: "event_available" }
];
</script>
