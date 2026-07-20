<template>
  <q-page class="entity-page event-register-page">
    <q-inner-loading :showing="loading">
      <q-spinner size="36px" color="primary" />
    </q-inner-loading>

    <section v-if="event && participant" class="event-register-page__card entity-page__panel">
      <header class="event-register-page__header">
        <q-icon name="payments" size="32px" color="primary" />
        <h1>Event registration payment</h1>
        <p>{{ event.name }}</p>
      </header>

      <dl class="entity-details q-mb-md">
        <div class="entity-details__item">
          <dt class="entity-details__label">Participant</dt>
          <dd class="entity-details__value">{{ participant.fullName }}</dd>
        </div>
        <div class="entity-details__item">
          <dt class="entity-details__label">Event date</dt>
          <dd class="entity-details__value">{{ formatDate(event.eventDate) }} · {{ formatEventTime(event.eventTime) }}</dd>
        </div>
        <div class="entity-details__item">
          <dt class="entity-details__label">Location</dt>
          <dd class="entity-details__value">{{ event.location }}</dd>
        </div>
        <div class="entity-details__item">
          <dt class="entity-details__label">Registration fee</dt>
          <dd class="entity-details__value">{{ formatCurrency(event.registrationFee) }}</dd>
        </div>
      </dl>

      <q-banner v-if="participant.registrationPaid" class="bg-positive text-white q-mb-md" rounded>
        Registration fee already paid. Thank you!
      </q-banner>

      <template v-else>
        <q-form class="entity-dialog__form" @submit.prevent="submitPayment">
          <q-input
            v-model.number="amount"
            type="number"
            min="0"
            step="0.01"
            label="Amount to pay"
            dense
            outlined
            prefix="₱"
            class="q-mb-sm"
          />
          <q-input v-model="reference" label="Payment reference (optional)" dense outlined class="q-mb-md" />
          <q-btn unelevated no-caps color="primary" label="Confirm payment" type="submit" :loading="paying" class="full-width" />
        </q-form>
        <p class="event-register-page__note">This portal records payment for event registration. Integrate your payment gateway here if needed.</p>
      </template>
    </section>

    <section v-else-if="!loading" class="entity-page__panel event-register-page__card">
      <div class="entity-table__empty">
        <q-icon name="error_outline" size="24px" color="grey-5" />
        <span>Registration link is invalid or this event has no fee.</span>
      </div>
    </section>
  </q-page>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useQuasar } from "quasar";
import { api } from "src/boot/axios";
import { formatEventTime } from "src/utils/eventTime";

const props = defineProps({
  id: { type: [String, Number], required: true },
  participantId: { type: [String, Number], required: true }
});

const $q = useQuasar();
const route = useRoute();
const eventId = props.id || route.params.id;
const participantId = props.participantId || route.params.participantId;

const loading = ref(false);
const paying = ref(false);
const event = ref(null);
const participant = ref(null);
const amount = ref(0);
const reference = ref("");

function formatCurrency(value) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(value || 0);
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

async function submitPayment() {
  paying.value = true;
  try {
    const { data } = await api.post(`/events/${eventId}/register/${participantId}/pay`, {
      amount: amount.value
    });
    participant.value = data;
    $q.notify({ type: "positive", message: "Payment recorded successfully." });
  } catch (err) {
    const message = err?.response?.data?.message || "Payment failed.";
    $q.notify({ type: "negative", message: Array.isArray(message) ? message[0] : message });
  } finally {
    paying.value = false;
  }
}

onMounted(async () => {
  loading.value = true;
  try {
    const { data } = await api.get(`/events/${eventId}/register/${participantId}`);
    event.value = data.event;
    participant.value = data.participant;
    amount.value = event.value.registrationFee || 0;
  } catch {
    $q.notify({ type: "negative", message: "Failed to load registration details." });
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped lang="scss">
.event-register-page {
  display: flex;
  justify-content: center;
  padding: 24px 16px;
  min-height: inherit;
}

.event-register-page__card {
  width: min(480px, 100%);
}

.event-register-page__header {
  padding: 16px 16px 8px;
  text-align: center;

  h1 {
    margin: 8px 0 4px;
    font-size: 1rem;
    font-weight: 600;
  }

  p {
    margin: 0;
    font-size: 0.82rem;
    color: #6b7280;
  }
}

.entity-details {
  padding: 0 16px;
}

.event-register-page__note {
  margin: 12px 16px 16px;
  font-size: 0.75rem;
  color: #8b93a1;
  text-align: center;
}
</style>
