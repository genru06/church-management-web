<template>
  <div class="registration-qr">
    <div v-if="loading" class="registration-qr__loading">
      <q-spinner size="32px" color="primary" />
    </div>

    <template v-else-if="registrationOpen">
      <div class="registration-qr__image-wrap">
        <img v-if="qrDataUrl" :src="qrDataUrl" alt="Scan to register QR code" class="registration-qr__image" />
      </div>
      <p class="registration-qr__hint">Scan this QR code to open the registration form.</p>
      <p v-if="eventName" class="registration-qr__event">{{ eventName }}</p>
      <div v-if="showActions" class="registration-qr__actions">
        <q-btn
          flat
          dense
          no-caps
          color="primary"
          icon="content_copy"
          label="Copy link"
          @click="copyLink"
        />
        <q-btn
          flat
          dense
          no-caps
          color="primary"
          icon="open_in_new"
          label="Open form"
          :href="registrationUrl"
          target="_blank"
        />
        <q-btn
          v-if="showFullscreen"
          flat
          dense
          no-caps
          color="primary"
          icon="fullscreen"
          label="Full screen"
          :to="`/events/${eventId}/signup-qr`"
          target="_blank"
        />
      </div>
    </template>

    <p v-else class="registration-qr__closed">
      {{ closedReason }}
    </p>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from "vue";
import { useQuasar } from "quasar";
import {
  generateRegistrationQrDataUrl,
  getEventSignupUrl,
  getRegistrationClosedReason,
  isRegistrationOpen
} from "src/utils/eventRegistration";

const props = defineProps({
  eventId: { type: [String, Number], required: true },
  event: { type: Object, default: null },
  size: { type: Number, default: 240 },
  showActions: { type: Boolean, default: true },
  showFullscreen: { type: Boolean, default: true }
});

const $q = useQuasar();
const loading = ref(false);
const qrDataUrl = ref("");

const eventName = ref(props.event?.name || "");
const registrationOpen = ref(isRegistrationOpen(props.event));
const closedReason = ref(getRegistrationClosedReason(props.event));
const registrationUrl = getEventSignupUrl(props.eventId);

function syncEventState() {
  eventName.value = props.event?.name || "";
  registrationOpen.value = isRegistrationOpen(props.event);
  closedReason.value = getRegistrationClosedReason(props.event);
}

async function loadQr() {
  if (!registrationOpen.value) {
    qrDataUrl.value = "";
    return;
  }

  loading.value = true;
  try {
    qrDataUrl.value = await generateRegistrationQrDataUrl(props.eventId, props.size);
  } finally {
    loading.value = false;
  }
}

function copyLink() {
  navigator.clipboard?.writeText(registrationUrl);
  $q.notify({ type: "positive", message: "Registration link copied." });
}

onMounted(async () => {
  syncEventState();
  await loadQr();
});

watch(
  () => props.event,
  async () => {
    syncEventState();
    await loadQr();
  }
);
</script>

<style scoped lang="scss">
.registration-qr {
  text-align: center;
}

.registration-qr__loading {
  padding: 24px 0;
}

.registration-qr__image-wrap {
  display: flex;
  justify-content: center;
  margin-bottom: 8px;
}

.registration-qr__image {
  width: 100%;
  max-width: 280px;
  height: auto;
  border: 1px solid #e4e8ef;
  border-radius: 8px;
  background: #fff;
}

.registration-qr__hint {
  margin: 0;
  font-size: 0.8rem;
  color: #6b7280;
}

.registration-qr__event {
  margin: 6px 0 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #1a1a2e;
}

.registration-qr__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 4px;
  margin-top: 10px;
}

.registration-qr__closed {
  margin: 0;
  padding: 12px;
  font-size: 0.8rem;
  color: #9a3412;
}
</style>
