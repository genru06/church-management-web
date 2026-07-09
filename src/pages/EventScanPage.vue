<template>
  <q-page class="entity-page event-scan-page">
    <header class="entity-page__header">
      <div class="entity-page__heading">
        <q-btn flat dense round icon="arrow_back" color="grey-7" @click="router.push(`/events/${eventId}`)" />
        <h1 class="entity-page__title">Scan attendance</h1>
      </div>
    </header>

    <section class="entity-page__panel q-mb-md">
      <div class="event-scan-page__intro">
        <h2>{{ event?.name || "Event check-in" }}</h2>
        <p>Scan a participant QR code to mark attendance.</p>
      </div>
    </section>

    <section class="entity-page__panel q-mb-md">
      <div id="qr-reader" class="event-scan-page__reader" />
      <div v-if="scanError" class="event-scan-page__error">{{ scanError }}</div>
    </section>

    <section class="entity-page__panel">
      <div class="event-scan-page__manual">
        <h3>Manual check-in</h3>
        <p class="entity-table__muted">Paste QR payload JSON if camera scanning is unavailable.</p>
        <q-input v-model="manualPayload" type="textarea" autogrow dense outlined placeholder='{"eventId":1,"participantId":2,"token":"..."}' />
        <q-btn unelevated no-caps color="primary" label="Submit" class="q-mt-sm" :loading="checkingIn" @click="submitManual" />
      </div>
    </section>

    <q-dialog v-model="resultDialogOpen" persistent>
      <q-card class="entity-dialog">
        <q-card-section class="text-center">
          <q-icon :name="checkInResult?.alreadyCheckedIn ? 'info' : 'check_circle'" :color="checkInResult?.alreadyCheckedIn ? 'warning' : 'positive'" size="48px" />
          <h3 class="q-mt-md q-mb-xs">{{ checkInResult?.fullName }}</h3>
          <p>{{ checkInResult?.alreadyCheckedIn ? "Already checked in." : "Attendance recorded successfully." }}</p>
        </q-card-section>
        <q-card-actions align="center">
          <q-btn unelevated no-caps color="primary" label="Continue scanning" @click="resultDialogOpen = false" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { onMounted, onUnmounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { api } from "src/boot/axios";

const props = defineProps({
  id: { type: [String, Number], required: true }
});

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const eventId = props.id || route.params.id;

const event = ref(null);
const scanError = ref("");
const manualPayload = ref("");
const checkingIn = ref(false);
const resultDialogOpen = ref(false);
const checkInResult = ref(null);

let scanner = null;
let processing = false;

async function processPayload(rawText) {
  if (processing) return;
  processing = true;

  try {
    const payload = JSON.parse(rawText);
    if (Number(payload.eventId) !== Number(eventId)) {
      $q.notify({ type: "warning", message: "QR code is for a different event." });
      return;
    }

    const { data } = await api.post(`/events/${eventId}/checkin`, {
      participantId: payload.participantId,
      token: payload.token
    });

    checkInResult.value = data;
    resultDialogOpen.value = true;
  } catch {
    $q.notify({ type: "negative", message: "Invalid or unreadable QR code." });
  } finally {
    processing = false;
  }
}

async function submitManual() {
  if (!manualPayload.value.trim()) return;
  checkingIn.value = true;
  try {
    await processPayload(manualPayload.value.trim());
    manualPayload.value = "";
  } finally {
    checkingIn.value = false;
  }
}

async function startScanner() {
  try {
    const { Html5Qrcode } = await import("html5-qrcode");
    scanner = new Html5Qrcode("qr-reader");
    await scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => processPayload(decodedText),
      () => {}
    );
  } catch {
    scanError.value = "Camera access unavailable. Use manual check-in below.";
  }
}

async function stopScanner() {
  if (!scanner) return;
  try {
    await scanner.stop();
    await scanner.clear();
  } catch {
    // ignore cleanup errors
  }
  scanner = null;
}

onMounted(async () => {
  try {
    const { data } = await api.get(`/events/${eventId}`);
    event.value = data;
    await startScanner();
  } catch {
    $q.notify({ type: "negative", message: "Failed to load event." });
    router.push("/events");
  }
});

onUnmounted(stopScanner);
</script>

<style scoped lang="scss">
.event-scan-page__intro {
  padding: 12px;

  h2 {
    margin: 0 0 4px;
    font-size: 0.95rem;
    font-weight: 600;
  }

  p {
    margin: 0;
    font-size: 0.8rem;
    color: #6b7280;
  }
}

.event-scan-page__reader {
  min-height: 320px;
  padding: 12px;
}

.event-scan-page__error {
  padding: 0 12px 12px;
  color: #c62828;
  font-size: 0.8rem;
}

.event-scan-page__manual {
  padding: 12px;

  h3 {
    margin: 0 0 4px;
    font-size: 0.85rem;
    font-weight: 600;
  }

  p {
    margin: 0 0 8px;
    font-size: 0.78rem;
  }
}
</style>
