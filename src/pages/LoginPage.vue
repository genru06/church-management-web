<template>
  <q-page class="login-page flex flex-center">
    <div class="login-page__bg">
      <div class="login-page__cross" />
      <div class="login-page__glow login-page__glow--left" />
      <div class="login-page__glow login-page__glow--right" />
    </div>

    <q-card class="login-card shadow-24">
      <q-card-section class="login-card__header text-white">
        <div class="login-card__brand">
          <q-avatar size="52px" color="white" text-color="primary" icon="church" class="login-card__avatar" />
          <div>
            <div class="login-card__title">LifeGroup System</div>
            <div class="login-card__subtitle">Serving churches, lifegroups &amp; communities</div>
          </div>
        </div>
      </q-card-section>

      <q-card-section class="q-pa-lg">
        <div class="text-subtitle2 text-grey-8 q-mb-md">Welcome back — sign in to continue</div>

        <q-form @submit.prevent="onLogin">
          <q-input
            v-model="username"
            label="Username"
            outlined
            dense
            :disable="loading"
            :error="!!error"
            autocomplete="username"
          >
            <template #prepend>
              <q-icon name="person_outline" color="primary" />
            </template>
          </q-input>

          <q-input
            v-model="password"
            label="Password"
            :type="showPassword ? 'text' : 'password'"
            class="q-mt-md"
            outlined
            dense
            :disable="loading"
            :error="!!error"
            autocomplete="current-password"
            @keyup.enter="onLogin"
          >
            <template #prepend>
              <q-icon name="lock_outline" color="primary" />
            </template>
            <template #append>
              <q-btn
                flat
                dense
                round
                :icon="showPassword ? 'visibility_off' : 'visibility'"
                @click="showPassword = !showPassword"
              />
            </template>
          </q-input>

          <q-banner v-if="error" dense rounded class="bg-red-1 text-negative q-mt-md">
            <template #avatar>
              <q-icon name="error_outline" color="negative" />
            </template>
            {{ error }}
          </q-banner>

          <q-btn
            type="submit"
            color="primary"
            icon="login"
            label="Sign In"
            class="full-width q-mt-lg login-card__submit"
            unelevated
            no-caps
            :loading="loading"
          />
        </q-form>
      </q-card-section>

      <q-separator />

      <q-card-section class="text-center text-caption text-grey-7 q-py-sm">
        <q-icon name="volunteer_activism" size="14px" class="q-mr-xs" />
        Equipping leaders to shepherd with care
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { useAuthStore } from "src/stores/auth";

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const auth = useAuthStore();

const username = ref("");
const password = ref("");
const showPassword = ref(false);
const loading = ref(false);
const error = ref("");

async function onLogin() {
  error.value = "";
  if (!username.value.trim() || !password.value) {
    error.value = "Please enter your username and password.";
    return;
  }

  loading.value = true;
  try {
    await auth.login(username.value.trim(), password.value);
    $q.notify({ type: "positive", message: `Welcome, ${auth.fullName}!`, position: "top" });
    const redirect = route.query.redirect || auth.defaultRoute();
    router.push(redirect);
  } catch (err) {
    error.value = err.response?.data?.message || "Invalid username or password. Please try again.";
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
  background: linear-gradient(145deg, #0d1b3e 0%, #1a3a6b 45%, #2c5282 100%);
}

.login-page__bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.login-page__cross {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 320px;
  height: 320px;
  opacity: 0.04;
  background:
    linear-gradient(#fff, #fff) center / 24px 100% no-repeat,
    linear-gradient(#fff, #fff) center / 100% 24px no-repeat;
}

.login-page__glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
}

.login-page__glow--left {
  width: 400px;
  height: 400px;
  background: rgba(212, 175, 55, 0.15);
  top: -100px;
  left: -100px;
}

.login-page__glow--right {
  width: 350px;
  height: 350px;
  background: rgba(100, 181, 246, 0.12);
  bottom: -80px;
  right: -80px;
}

.login-card {
  width: 100%;
  max-width: 420px;
  border-radius: 16px;
  position: relative;
  z-index: 1;
  overflow: hidden;
}

.login-card__header {
  background: linear-gradient(135deg, #1565c0 0%, #0d47a1 100%);
  padding: 24px;
}

.login-card__brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.login-card__avatar {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.login-card__title {
  font-size: 1.25rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.login-card__subtitle {
  font-size: 0.8rem;
  opacity: 0.85;
  margin-top: 2px;
}

.login-card__submit {
  height: 44px;
  font-weight: 600;
  letter-spacing: 0.02em;
  border-radius: 8px;
}
</style>
