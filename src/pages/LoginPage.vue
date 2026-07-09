<template>
  <q-page class="row items-center justify-center login-page">
    <q-card class="shadow-12" style="width: 400px; border-radius: 14px">
      <q-card-section class="bg-primary text-white">
        <div class="row items-center q-gutter-sm">
          <q-icon name="lock" size="sm" />
          <div class="text-h6">Admin Login</div>
        </div>
        <div class="text-caption">Sign in to manage members, churches, and lifegroups.</div>
      </q-card-section>
      <q-card-section class="q-pa-lg">
        <q-input v-model="email" label="Email" type="email" outlined dense>
          <template #prepend>
            <q-icon name="mail" />
          </template>
        </q-input>
        <q-input v-model="password" label="Password" type="password" class="q-mt-md" outlined dense>
          <template #prepend>
            <q-icon name="key" />
          </template>
        </q-input>
      </q-card-section>
      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat color="grey-8" label="Forgot password?" />
        <q-btn color="primary" icon="login" label="Login" @click="$router.push('/dashboard')" />
      </q-card-actions>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from "vue";

const email = ref("");
const password = ref("");
</script>

<style scoped>
.login-page {
  background: linear-gradient(130deg, #f2f7ff, #f7f9ff);
}
</style>
