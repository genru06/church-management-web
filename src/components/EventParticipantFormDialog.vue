<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <q-card class="entity-dialog">
      <header class="entity-dialog__header">
        <div>
          <h2 class="entity-dialog__title">{{ mode === "create" ? "Add participant" : "Edit participant" }}</h2>
          <p class="entity-dialog__subtitle">
            <template v-if="isEditingGuest">
              Update guest details and choose which guest list they belong to.
            </template>
            <template v-else>
              Add a guest participant, link an existing member, or register someone as a new member.
            </template>
          </p>
        </div>
        <q-btn flat round dense icon="close" color="grey-7" :disable="saving" @click="close" />
      </header>

      <q-separator />

      <q-card-section class="entity-dialog__body">
        <q-form ref="formRef" class="entity-dialog__form" @submit.prevent="submit">
          <div class="row q-col-gutter-sm">
            <div v-if="mode === 'create' && !isEditingGuest" class="col-12">
              <AppSelect
                v-model="form.memberId"
                :options="memberOptions"
                emit-value
                map-options
                clearable
                label="Member (optional)"
                dense
                outlined
                hide-bottom-space
                @update:model-value="onMemberSelected"
              />
            </div>

            <div v-if="mode === 'edit' && originalMemberId" class="col-12">
              <p class="event-participant-form__hint">
                Linked member:
                {{ form.fullName || "This participant" }}
              </p>
            </div>

            <div v-if="mode === 'create' && !form.memberId" class="col-12">
              <q-toggle
                v-model="form.addAsMember"
                label="Add as member"
                dense
                color="primary"
                @update:model-value="onAddAsMemberChanged"
              />
              <p class="event-participant-form__hint">
                When enabled, the participant is saved to the member directory using the selected church.
                When disabled, they are added to this event only.
              </p>
            </div>

            <div v-if="form.addAsMember && !form.memberId" class="col-12">
              <AppSelect
                v-model="form.churchId"
                :options="churchOptions"
                emit-value
                map-options
                clearable
                label="Church *"
                dense
                outlined
                hide-bottom-space
                :loading="churchesLoading"
                :rules="[requiredRule]"
              />
            </div>

            <template v-if="form.addAsMember && !form.memberId">
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="form.firstName"
                  label="First name *"
                  dense
                  outlined
                  hide-bottom-space
                  :rules="[requiredRule]"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="form.lastName"
                  label="Last name *"
                  dense
                  outlined
                  hide-bottom-space
                  :rules="[requiredRule]"
                />
              </div>
            </template>

            <div v-else class="col-12">
              <q-input
                v-model="form.fullName"
                label="Full name *"
                dense
                outlined
                hide-bottom-space
                :rules="[requiredRule]"
              />
            </div>

            <div class="col-12 col-sm-6">
              <q-input v-model="form.email" type="email" label="Email" dense outlined hide-bottom-space />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="form.phone" label="Phone" dense outlined hide-bottom-space />
            </div>

            <div v-if="showGuestListSelect" class="col-12">
              <AppSelect
                v-model="form.reservationId"
                :options="guestListOptions"
                emit-value
                map-options
                clearable
                label="Guest list *"
                dense
                outlined
                hide-bottom-space
                :rules="[requiredRule]"
              />
              <p
                v-if="guestListConflictLabel"
                class="event-participant-form__warning"
              >
                {{ form.fullName || "This guest" }} already exists on
                <strong>{{ guestListConflictLabel }}</strong>.
                Choose a different list or resolve the duplicate first.
              </p>
              <p v-else-if="!guestListOptions.length" class="event-participant-form__hint">
                No guest reservation lists yet. Add one from the event dashboard first.
              </p>
            </div>
          </div>
        </q-form>
      </q-card-section>

      <q-separator />

      <footer class="entity-dialog__footer">
        <q-btn flat no-caps label="Cancel" color="grey-8" :disable="saving" @click="close" />
        <q-btn
          unelevated
          no-caps
          color="primary"
          :label="mode === 'create' ? 'Add participant' : 'Save changes'"
          :loading="saving"
          :disable="saving || (!!guestListConflictLabel && isMovingGuestList)"
          @click="submit"
        />
      </footer>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useQuasar } from "quasar";
import { api } from "src/boot/axios";
import AppSelect from "src/components/AppSelect.vue";
import { getChurchDisplayName, sortChurchesMainFirst } from "src/utils/churchDisplay";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  mode: { type: String, default: "create" },
  eventId: { type: [String, Number], required: true },
  participant: { type: Object, default: null },
  reservations: { type: Array, default: () => [] },
  participants: { type: Array, default: () => [] }
});

const emit = defineEmits(["update:modelValue", "saved"]);

const $q = useQuasar();
const formRef = ref(null);
const saving = ref(false);
const memberOptions = ref([]);
const churchOptions = ref([]);
const churchesLoading = ref(false);

const requiredRule = (val) => !!val || "Required";

const emptyForm = () => ({
  memberId: null,
  addAsMember: false,
  churchId: null,
  reservationId: null,
  firstName: "",
  lastName: "",
  fullName: "",
  email: "",
  phone: ""
});

const form = ref(emptyForm());
const originalReservationId = ref(null);
const originalMemberId = ref(null);

function normalizeGuestName(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

const isEditingGuest = computed(() => {
  if (props.mode !== "edit" || !props.participant) return false;
  const memberId = props.participant.memberId ?? props.participant.member_id ?? null;
  const hasMember =
    memberId != null && memberId !== "" && Number.isFinite(Number(memberId)) && Number(memberId) > 0;
  return !hasMember && !!props.participant.reservationId && !props.participant.churchId;
});

const showGuestListSelect = computed(() => {
  if (isEditingGuest.value) return true;
  return props.mode === "create" && !form.value.memberId && !form.value.addAsMember;
});

const guestListOptions = computed(() =>
  [...(props.reservations || [])]
    .filter((row) => !row.churchId)
    .map((row) => ({
      label: `${row.label} (${Number(row.filledCount || 0)}/${Number(row.reservedCount || 0)})`,
      value: Number(row.id)
    }))
    .sort((a, b) => String(a.label).localeCompare(String(b.label), undefined, { sensitivity: "base" }))
);

const isMovingGuestList = computed(() => {
  if (!isEditingGuest.value) return false;
  if (form.value.reservationId == null || originalReservationId.value == null) return false;
  return Number(form.value.reservationId) !== Number(originalReservationId.value);
});

const guestListConflictLabel = computed(() => {
  if (!isEditingGuest.value || !isMovingGuestList.value) return "";

  const nameKey = normalizeGuestName(form.value.fullName || props.participant?.fullName);
  if (!nameKey) return "";

  const currentReservationId = Number(originalReservationId.value);
  const guestReservationIds = new Set(guestListOptions.value.map((row) => Number(row.value)));

  const conflict = (props.participants || []).find((row) => {
    if (Number(row.id) === Number(props.participant?.id)) return false;
    if (row.memberId || row.churchId) return false;
    const reservationId = row.reservationId != null ? Number(row.reservationId) : null;
    if (!reservationId || !guestReservationIds.has(reservationId)) return false;
    // Ignore the guest's current list; flag matches on any other list.
    if (reservationId === currentReservationId) return false;
    return normalizeGuestName(row.fullName) === nameKey;
  });

  if (!conflict) return "";

  const reservation = (props.reservations || []).find(
    (row) => Number(row.id) === Number(conflict.reservationId)
  );
  return reservation?.label || conflict.reservationLabel || "another guest list";
});

function close() {
  if (saving.value) return;
  emit("update:modelValue", false);
}

function resetForm() {
  form.value = emptyForm();
  originalReservationId.value = null;
  originalMemberId.value = null;
  formRef.value?.resetValidation();
}

function numericId(value) {
  if (value == null || value === "") return null;
  const id = Number(value);
  return Number.isFinite(id) && id > 0 ? id : null;
}

function hydrateEditForm(participant) {
  const memberId = numericId(participant.memberId ?? participant.member_id);
  const reservationId = numericId(participant.reservationId);
  originalReservationId.value = reservationId;
  originalMemberId.value = memberId;

  const fullName =
    participant.fullName ||
    [participant.firstName, participant.lastName].filter(Boolean).join(" ") ||
    "";

  form.value = {
    memberId,
    addAsMember: false,
    churchId: numericId(participant.churchId),
    reservationId,
    firstName: participant.firstName || "",
    lastName: participant.lastName || "",
    fullName,
    email: participant.email || "",
    phone: participant.phone || ""
  };

  if (memberId) {
    const label =
      participant.lastName && participant.firstName
        ? `${participant.lastName}, ${participant.firstName}`
        : fullName || `Member #${memberId}`;
    memberOptions.value = [{ label, value: memberId, member: participant }];
  }
}

async function loadMembers() {
  const { data } = await api.get("/members");
  memberOptions.value = data.map((m) => ({
    label: `${m.lastName}, ${m.firstName}`,
    value: Number(m.id),
    member: m
  }));
}

async function loadChurches() {
  churchesLoading.value = true;
  try {
    const { data } = await api.get("/churches");
    churchOptions.value = sortChurchesMainFirst(
      data.map((church) => ({
        label: getChurchDisplayName(church),
        value: Number(church.id)
      })),
      (church) => church.label
    );
  } finally {
    churchesLoading.value = false;
  }
}

function onMemberSelected(memberId) {
  if (!memberId) return;
  const option = memberOptions.value.find((o) => o.value === memberId);
  if (!option) return;
  form.value.addAsMember = false;
  form.value.churchId = null;
  form.value.reservationId = null;
  form.value.firstName = option.member.firstName || "";
  form.value.lastName = option.member.lastName || "";
  form.value.fullName = `${option.member.firstName} ${option.member.lastName}`;
  form.value.email = option.member.email || "";
  form.value.phone = option.member.phone || "";
}

function onAddAsMemberChanged(enabled) {
  if (!enabled) {
    form.value.churchId = null;
    form.value.firstName = "";
    form.value.lastName = "";
    return;
  }

  form.value.reservationId = null;

  if (!churchOptions.value.length) {
    loadChurches();
  }

  if (form.value.fullName.trim()) {
    const parts = form.value.fullName.trim().split(/\s+/);
    if (parts.length >= 2) {
      form.value.firstName = parts[0];
      form.value.lastName = parts.slice(1).join(" ");
    }
  }
}

async function onShow() {
  if (props.mode === "edit" && props.participant) {
    hydrateEditForm(props.participant);
    if (originalMemberId.value || isEditingGuest.value) return;
    try {
      await loadMembers();
    } catch {
      $q.notify({ type: "warning", message: "Could not load the member list." });
    }
    return;
  }

  resetForm();
  try {
    await loadMembers();
  } catch {
    $q.notify({ type: "warning", message: "Could not load the member list." });
  }
}

function buildPayload() {
  const linkedMemberId = form.value.memberId || originalMemberId.value;
  if (linkedMemberId) {
    return {
      memberId: linkedMemberId,
      fullName: form.value.fullName,
      email: form.value.email,
      phone: form.value.phone
    };
  }

  if (form.value.addAsMember) {
    return {
      addAsMember: true,
      churchId: form.value.churchId,
      firstName: form.value.firstName,
      lastName: form.value.lastName,
      fullName: `${form.value.firstName} ${form.value.lastName}`.trim(),
      email: form.value.email,
      phone: form.value.phone
    };
  }

  const payload = {
    fullName: form.value.fullName,
    email: form.value.email,
    phone: form.value.phone
  };

  if (isEditingGuest.value && form.value.reservationId) {
    if (Number(form.value.reservationId) !== Number(originalReservationId.value)) {
      payload.transferReservationId = Number(form.value.reservationId);
    }
  } else if (props.mode === "create" && form.value.reservationId) {
    payload.reservationId = Number(form.value.reservationId);
  }

  return payload;
}

async function submit() {
  const valid = await formRef.value?.validate();
  if (!valid) return;

  if (showGuestListSelect.value && !form.value.reservationId && isEditingGuest.value) {
    $q.notify({ type: "negative", message: "Select a guest list." });
    return;
  }

  if (guestListConflictLabel.value && isMovingGuestList.value) {
    $q.notify({
      type: "negative",
      message: `${form.value.fullName || "This guest"} already exists on ${guestListConflictLabel.value}.`
    });
    return;
  }

  saving.value = true;
  try {
    const payload = buildPayload();
    const { data } =
      props.mode === "create"
        ? await api.post(`/events/${props.eventId}/participants`, payload)
        : await api.put(`/events/${props.eventId}/participants/${props.participant.id}`, payload);

    const moved =
      isEditingGuest.value &&
      form.value.reservationId != null &&
      Number(form.value.reservationId) !== Number(originalReservationId.value);

    $q.notify({
      type: "positive",
      message:
        props.mode === "create"
          ? "Participant added."
          : moved
            ? "Participant updated and moved to the selected guest list."
            : "Participant updated."
    });
    emit("saved", data);
    emit("update:modelValue", false);
    resetForm();
  } catch (err) {
    const message = err?.response?.data?.message || "Failed to save participant.";
    $q.notify({ type: "negative", message: Array.isArray(message) ? message[0] : message });
  } finally {
    saving.value = false;
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      void onShow();
      return;
    }
    resetForm();
  }
);
</script>

<style scoped lang="scss">
.event-participant-form__hint {
  margin: 4px 0 0;
  font-size: 0.75rem;
  line-height: 1.45;
  color: #8b93a1;
}

.event-participant-form__warning {
  margin: 10px 0 0;
  padding: 10px 12px;
  border-radius: 8px;
  background: #fff4e5;
  color: #8a5a00;
  font-size: 0.82rem;
  line-height: 1.4;
}
</style>
