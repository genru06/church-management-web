<template>
  <q-page class="entity-page event-signup-qr-page">
    <q-inner-loading :showing="loading">
      <q-spinner size="36px" color="primary" />
    </q-inner-loading>

    <section v-if="signupInfo" class="event-signup-qr-page__card entity-page__panel">
      <header class="event-signup-qr-page__header">
        <q-icon name="qr_code_2" size="40px" color="primary" />
        <h1>Scan to register</h1>
        <p>{{ signupInfo.event.name }}</p>
        <p class="event-signup-qr-page__meta">
          {{ formatDate(signupInfo.event.eventDate) }} · {{ formatEventTime(signupInfo.event.eventTime) }}
        </p>
      </header>

      <EventRegistrationQrCard
        :event-id="eventId"
        :event="signupInfo.event"
        :size="320"
        :show-fullscreen="false"
      />
    </section>

    <section v-else-if="!loading" class="entity-page__panel event-signup-qr-page__card">
      <div class="entity-table__empty">
        <q-icon name="error_outline" size="24px" color="grey-5" />
        <span>Event not found.</span>
      </div>
    </section>
  </q-page>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useQuasar } from "quasar";
import { api } from "src/boot/axios";
import EventRegistrationQrCard from "src/components/EventRegistrationQrCard.vue";
import { formatEventTime } from "src/utils/eventTime";

const props = defineProps({
  id: { type: [String, Number], required: true }
});

const $q = useQuasar();
const route = useRoute();
const eventId = props.id || route.params.id;

const loading = ref(false);
const signupInfo = ref(null);

function formatDate(value) {
  if (!value) return "Date TBA";
  return new Date(value).toLocaleDateString();
}

onMounted(async () => {
  loading.value = true;
  try {
    const { data } = await api.get(`/events/${eventId}/signup`);
    signupInfo.value = data;
  } catch {
    signupInfo.value = null;
    $q.notify({ type: "negative", message: "Failed to load registration QR." });
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped lang="scss">
.event-signup-qr-page {
  display: flex;
  justify-content: center;
  padding: 24px 16px;
  min-height: inherit;
}

.event-signup-qr-page__card {
  width: min(420px, 100%);
  padding-bottom: 16px;
}

.event-signup-qr-page__header {
  padding: 20px 16px 8px;
  text-align: center;

  h1 {
    margin: 10px 0 4px;
    font-size: 1.2rem;
    font-weight: 600;
  }

  p {
    margin: 0;
    font-size: 0.85rem;
    color: #6b7280;
  }
}

.event-signup-qr-page__meta {
  margin-top: 4px !important;
}
</style>
