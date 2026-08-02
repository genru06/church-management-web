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
        <p>
          Scan a member QR code to mark attendance.
          <span v-if="event?.requiresPreRegistration">
            Pre-registration is required for this event.
          </span>
          <span v-else>
            Pre-registration is not required — walk-ins are checked in automatically.
          </span>
        </p>
      </div>
    </section>

    <section class="entity-page__panel q-mb-md">
      <div id="qr-reader" class="event-scan-page__reader" />
      <div v-if="scanError" class="event-scan-page__error">{{ scanError }}</div>
    </section>

    <section class="entity-page__panel">
      <div class="event-scan-page__manual">
        <h3>Manual check-in</h3>
        <p class="entity-table__muted">Enter member's ID number.</p>
        <q-input
          v-model="manualPayload"
          type="text"
          inputmode="numeric"
          dense
          outlined
          placeholder="Member ID number"
          @focus="onManualFocus"
          @blur="onManualBlur"
          @keyup.enter="submitManual"
        />
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
        <q-card-actions vertical align="stretch" class="q-px-md q-pb-md">
          <q-btn
            unelevated
            no-caps
            color="primary"
            label="Continue scanning"
            class="q-mb-sm"
            @click="closeResultDialog"
          />
          <q-btn
            flat
            no-caps
            color="negative"
            label="Cancel attendance"
            :loading="cancelling"
            :disable="!checkInResult?.id"
            @click="cancelAttendance"
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="alertDialogOpen" persistent>
      <q-card class="entity-dialog">
        <q-card-section class="text-center">
          <q-icon name="warning" color="warning" size="48px" />
          <h3 class="q-mt-md q-mb-xs">Not registered</h3>
          <p>{{ alertMessage }}</p>
        </q-card-section>
        <q-card-actions align="center">
          <q-btn unelevated no-caps color="primary" label="Continue scanning" @click="closeAlertDialog" />
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
const cancelling = ref(false);
const resultDialogOpen = ref(false);
const checkInResult = ref(null);
const alertDialogOpen = ref(false);
const alertMessage = ref("");

let scanner = null;
let scanBusy = false;
let restartingScanner = false;
let cameraNeedsRestart = false;

function extractErrorMessage(err, fallback) {
  const message = err?.response?.data?.message;
  if (Array.isArray(message)) return message[0] || fallback;
  if (typeof message === "object" && message?.message) return message.message;
  if (typeof message === "string") return message;
  return fallback;
}

function isNotRegisteredError(err) {
  const data = err?.response?.data;
  const message = data?.message;
  if (message?.code === "NOT_REGISTERED") return true;
  if (data?.code === "NOT_REGISTERED") return true;
  const text = extractErrorMessage(err, "");
  return /not registered to attend/i.test(text);
}

function isDialogOpen() {
  return resultDialogOpen.value || alertDialogOpen.value;
}

async function restartScanner() {
  if (restartingScanner) return;
  restartingScanner = true;
  try {
    await stopScanner();
    await startScanner();
    cameraNeedsRestart = false;
  } finally {
    restartingScanner = false;
  }
}

async function ensureScannerReady() {
  if (isDialogOpen() || checkingIn.value || scanBusy) return;
  if (cameraNeedsRestart || !scanner?.isScanning) {
    await restartScanner();
  }
}

async function showCheckInResult(data) {
  checkInResult.value = data;
  resultDialogOpen.value = true;
}

async function checkInMemberById(memberId) {
  const { data } = await api.post(`/events/${eventId}/checkin`, {
    type: "manual",
    memberId
  });
  await showCheckInResult(data);
}

async function processPayload(rawText) {
  // Keep QR and manual independent — only block QR while a QR request is in flight or a dialog is open.
  if (scanBusy || checkingIn.value || isDialogOpen()) return;
  scanBusy = true;

  try {
    const payload = JSON.parse(rawText);
    const memberId = payload.memberId != null && payload.memberId !== "" ? Number(payload.memberId) : null;
    const participantId =
      payload.participantId != null && payload.participantId !== "" ? Number(payload.participantId) : null;
    const token = typeof payload.token === "string" ? payload.token.trim() : payload.token;
    const isMemberQr =
      String(payload.type || "").toLowerCase() === "member" ||
      (Number.isFinite(memberId) && memberId > 0 && !!token && !Number.isFinite(participantId));

    if (isMemberQr) {
      if (!Number.isFinite(memberId) || memberId <= 0 || !token) {
        $q.notify({ type: "negative", message: "Invalid member QR code." });
        return;
      }
      const { data } = await api.post(`/events/${eventId}/checkin`, {
        type: "member",
        memberId,
        token
      });
      await showCheckInResult(data);
      return;
    }

    // Participant / guest QR codes are event-scoped
    if (payload.eventId != null && Number(payload.eventId) !== Number(eventId)) {
      $q.notify({ type: "warning", message: "QR code is for a different event." });
      return;
    }

    if (!Number.isFinite(participantId) || participantId <= 0 || !token) {
      $q.notify({ type: "negative", message: "Unrecognized QR code. Scan a member or participant QR." });
      return;
    }

    const { data } = await api.post(`/events/${eventId}/checkin`, {
      participantId,
      token
    });

    await showCheckInResult(data);
  } catch (err) {
    if (err instanceof SyntaxError) {
      $q.notify({ type: "negative", message: "Invalid or unreadable QR code." });
      return;
    }
    if (isNotRegisteredError(err)) {
      alertMessage.value = extractErrorMessage(
        err,
        `This member is not registered to attend this ${event.value?.name || "event"}.`
      );
      alertDialogOpen.value = true;
      return;
    }
    $q.notify({
      type: "negative",
      message: extractErrorMessage(err, "Failed to record attendance.")
    });
  } finally {
    scanBusy = false;
  }
}

function onManualFocus() {
  // Focusing the manual input often breaks the camera stream on mobile browsers.
  cameraNeedsRestart = true;
}

function onManualBlur() {
  if (checkingIn.value || isDialogOpen()) return;
  void ensureScannerReady();
}

async function submitManual() {
  const raw = manualPayload.value.trim();
  if (!raw || checkingIn.value) return;

  const memberId = Number(raw);
  if (!Number.isFinite(memberId) || memberId <= 0 || !/^\d+$/.test(raw)) {
    $q.notify({ type: "negative", message: "Enter a valid member ID number." });
    return;
  }

  checkingIn.value = true;
  cameraNeedsRestart = true;
  try {
    await checkInMemberById(memberId);
    manualPayload.value = "";
  } catch (err) {
    if (isNotRegisteredError(err)) {
      alertMessage.value = extractErrorMessage(
        err,
        `This member is not registered to attend this ${event.value?.name || "event"}.`
      );
      alertDialogOpen.value = true;
    } else {
      $q.notify({
        type: "negative",
        message: extractErrorMessage(err, "Failed to check in member.")
      });
    }
  } finally {
    checkingIn.value = false;
  }
}

async function closeResultDialog() {
  resultDialogOpen.value = false;
  await ensureScannerReady();
}

async function closeAlertDialog() {
  alertDialogOpen.value = false;
  await ensureScannerReady();
}

async function cancelAttendance() {
  const participantId = checkInResult.value?.id;
  if (!participantId || cancelling.value) return;

  cancelling.value = true;
  try {
    await api.post(`/events/${eventId}/checkin/${participantId}/cancel`);
    $q.notify({
      type: "positive",
      message: `Attendance cancelled for ${checkInResult.value?.fullName || "participant"}.`
    });
    checkInResult.value = null;
    resultDialogOpen.value = false;
    await ensureScannerReady();
  } catch (err) {
    $q.notify({
      type: "negative",
      message: extractErrorMessage(err, "Failed to cancel attendance.")
    });
  } finally {
    cancelling.value = false;
  }
}

async function startScanner() {
  try {
    const { Html5Qrcode } = await import("html5-qrcode");
    scanner = new Html5Qrcode("qr-reader");
    const qrSize = Math.min(250, Math.max(180, window.innerWidth - 48));
    await scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: qrSize, height: qrSize } },
      (decodedText) => {
        void processPayload(decodedText);
      },
      () => {}
    );
    scanError.value = "";
  } catch {
    scanner = null;
    scanError.value = "Camera access unavailable. Use manual check-in below.";
  }
}

async function stopScanner() {
  if (!scanner) return;
  try {
    if (scanner.isScanning) {
      await scanner.stop();
    }
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
