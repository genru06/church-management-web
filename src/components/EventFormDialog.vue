<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
    @show="onShow"
  >
    <q-card class="entity-dialog entity-dialog--wide">
      <header class="entity-dialog__header">
        <div>
          <h2 class="entity-dialog__title">{{ mode === "create" ? "Add event" : "Edit event" }}</h2>
          <p class="entity-dialog__subtitle">
            {{ mode === "create" ? "Create a new event." : "Update event details." }}
          </p>
        </div>
        <q-btn flat round dense icon="close" color="grey-7" :disable="saving" @click="close" />
      </header>

      <q-separator />

      <q-card-section class="entity-dialog__body">
        <q-inner-loading :showing="loading">
          <q-spinner size="28px" color="primary" />
        </q-inner-loading>

        <q-form ref="formRef" class="entity-dialog__form" @submit.prevent="submit">
          <fieldset class="entity-dialog__section">
            <legend class="entity-dialog__section-title">Event details</legend>
            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-8">
                <q-input
                  v-model="form.name"
                  label="Event name *"
                  dense
                  outlined
                  hide-bottom-space
                  :rules="[requiredRule]"
                />
              </div>
              <div class="col-12 col-sm-4">
                <q-select
                  v-model="form.status"
                  :options="statusOptions"
                  emit-value
                  map-options
                  label="Status"
                  dense
                  outlined
                  hide-bottom-space
                />
              </div>
              <div class="col-12 col-sm-4">
                <q-input v-model="form.eventDate" type="date" label="Event date" dense outlined hide-bottom-space />
              </div>
              <div class="col-12 col-sm-4">
                <q-input
                  v-model="form.eventTime"
                  label="Event time *"
                  dense
                  outlined
                  hide-bottom-space
                  readonly
                  :rules="[requiredRule]"
                >
                  <template #append>
                    <q-icon name="access_time" class="cursor-pointer">
                      <q-popup-proxy cover transition-show="scale" transition-hide="scale">
                        <q-time
                          :model-value="quasarTimeValue"
                          :format24h="false"
                          @update:model-value="onTimePicked"
                        >
                          <div class="row items-center justify-end q-gutter-sm q-pa-sm">
                            <q-btn v-close-popup flat no-caps label="Done" color="primary" />
                          </div>
                        </q-time>
                      </q-popup-proxy>
                    </q-icon>
                  </template>
                </q-input>
              </div>
              <div class="col-12 col-sm-4">
                <q-select
                  v-model="form.eventType"
                  :options="typeOptions"
                  emit-value
                  map-options
                  label="Event type"
                  dense
                  outlined
                  hide-bottom-space
                />
              </div>
              <div class="col-12">
                <q-input
                  v-model="form.location"
                  label="Location *"
                  dense
                  outlined
                  hide-bottom-space
                  :rules="[requiredRule]"
                />
              </div>
              <div class="col-12">
                <q-input
                  v-model="form.description"
                  type="textarea"
                  autogrow
                  label="Description *"
                  dense
                  outlined
                  hide-bottom-space
                  :rules="[requiredRule]"
                />
              </div>
            </div>
          </fieldset>

          <fieldset class="entity-dialog__section">
            <legend class="entity-dialog__section-title">Capacity & fees</legend>
            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-4">
                <q-input
                  v-model.number="form.expectedParticipants"
                  type="number"
                  min="0"
                  label="Expected participants"
                  dense
                  outlined
                  hide-bottom-space
                  hint="Also updated automatically from event reservations"
                />
              </div>
              <div class="col-12 col-sm-4">
                <q-input
                  v-model.number="form.registrationFee"
                  type="number"
                  min="0"
                  step="0.01"
                  label="Registration fee"
                  dense
                  outlined
                  hide-bottom-space
                  prefix="₱"
                />
              </div>
              <div class="col-12 col-sm-4 flex items-center">
                <q-toggle v-model="form.allowPledges" label="Allow pledges" dense />
              </div>
              <div class="col-12">
                <q-toggle
                  v-model="form.requiresPreRegistration"
                  label="Require pre-registration"
                  dense
                />
                <p class="entity-table__muted q-mt-xs q-mb-none" style="font-size: 0.78rem">
                  When enabled, only registered members can check in. When disabled, scanning a
                  member QR automatically records attendance.
                </p>
              </div>
            </div>
          </fieldset>

          <fieldset class="entity-dialog__section">
            <legend class="entity-dialog__section-title">Organizer & contact</legend>
            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-6">
                <q-input v-model="form.organizer" label="Organizer" dense outlined hide-bottom-space />
              </div>
              <div class="col-12 col-sm-6">
                <AppSelect
                  v-model="form.tags"
                  :options="tagOptions"
                  label="Tags"
                  multiple
                  use-chips
                  dense
                  outlined
                  hide-bottom-space
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input v-model="form.contactPerson" label="Contact person" dense outlined hide-bottom-space />
              </div>
              <div class="col-12 col-sm-6">
                <q-input v-model="form.contactEmail" type="email" label="Contact email" dense outlined hide-bottom-space />
              </div>
            </div>
          </fieldset>
        </q-form>
      </q-card-section>

      <q-separator />

      <footer class="entity-dialog__footer">
        <q-btn flat no-caps label="Cancel" color="grey-8" :disable="saving" @click="close" />
        <q-btn
          unelevated
          no-caps
          color="primary"
          :label="mode === 'create' ? 'Add event' : 'Save changes'"
          :loading="saving"
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
import {
  fromQuasarTimeValue,
  normalizeEventTime,
  toQuasarTimeValue
} from "src/utils/eventTime";
import AppSelect from "src/components/AppSelect.vue";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  mode: { type: String, default: "create" },
  eventId: { type: [String, Number], default: null }
});

const emit = defineEmits(["update:modelValue", "saved"]);

const $q = useQuasar();
const formRef = ref(null);
const loading = ref(false);
const saving = ref(false);
const tagOptions = ref([]);

const requiredRule = (val) => !!val || "Required";

const statusOptions = [
  { label: "Draft", value: "draft" },
  { label: "Published", value: "published" },
  { label: "Ongoing", value: "ongoing" },
  { label: "Completed", value: "completed" },
  { label: "Cancelled", value: "cancelled" }
];

const typeOptions = [
  { label: "Internal", value: "internal" },
  { label: "External", value: "external" }
];

const emptyForm = () => ({
  name: "",
  eventDate: "",
  eventTime: "",
  location: "",
  description: "",
  expectedParticipants: null,
  registrationFee: 0,
  status: "draft",
  eventType: "internal",
  tags: [],
  organizer: "",
  contactPerson: "",
  contactEmail: "",
  allowPledges: false,
  requiresPreRegistration: false
});

const form = ref(emptyForm());

const quasarTimeValue = computed(() => toQuasarTimeValue(form.value.eventTime));

function onTimePicked(value) {
  form.value.eventTime = fromQuasarTimeValue(value);
}

function close() {
  if (saving.value) return;
  emit("update:modelValue", false);
}

function resetForm() {
  form.value = emptyForm();
  formRef.value?.resetValidation();
}

async function loadEvent() {
  if (props.mode !== "edit" || !props.eventId) {
    resetForm();
    return;
  }

  loading.value = true;
  try {
    const { data } = await api.get(`/events/${props.eventId}`);
    form.value = {
      name: data.name || "",
      eventDate: data.eventDate || "",
      eventTime: normalizeEventTime(data.eventTime),
      location: data.location || "",
      description: data.description || "",
      expectedParticipants: data.expectedParticipants,
      registrationFee: data.registrationFee || 0,
      status: data.status || "draft",
      eventType: data.eventType || "internal",
      tags: parseTags(data.tags),
      organizer: data.organizer || "",
      contactPerson: data.contactPerson || "",
      contactEmail: data.contactEmail || "",
      allowPledges: !!data.allowPledges,
      requiresPreRegistration: !!data.requiresPreRegistration
    };
  } catch {
    $q.notify({ type: "negative", message: "Failed to load event." });
    close();
  } finally {
    loading.value = false;
  }
}

async function onShow() {
  await loadTags();
  await loadEvent();
}

async function submit() {
  const valid = await formRef.value?.validate();
  if (!valid) return;

  saving.value = true;
  try {
    const payload = {
      ...form.value,
      tags: form.value.tags.join(", "),
      eventTime: normalizeEventTime(form.value.eventTime)
    };
    const { data } =
      props.mode === "create"
        ? await api.post("/events", payload)
        : await api.put(`/events/${props.eventId}`, payload);

    $q.notify({
      type: "positive",
      message: props.mode === "create" ? "Event added." : "Event updated."
    });
    emit("saved", data);
    emit("update:modelValue", false);
    resetForm();
  } catch (err) {
    const message = err?.response?.data?.message || "Failed to save event.";
    $q.notify({ type: "negative", message: Array.isArray(message) ? message[0] : message });
  } finally {
    saving.value = false;
  }
}

async function loadTags() {
  const { data } = await api.get("/tags");
  tagOptions.value = data.map((tag) => tag.name);
}

function parseTags(value) {
  return String(value || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
}

watch(
  () => props.modelValue,
  (open) => {
    if (!open) resetForm();
  }
);
</script>
