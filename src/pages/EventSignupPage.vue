<template>
  <q-page class="entity-page event-signup-page">
    <q-inner-loading :showing="loading">
      <q-spinner size="36px" color="primary" />
    </q-inner-loading>

    <section v-if="signupInfo" class="event-signup-page__card entity-page__panel">
      <header class="event-signup-page__header">
        <q-icon name="how_to_reg" size="32px" color="primary" />
        <h1>Event registration</h1>
        <p>{{ signupInfo.event.name }}</p>
        <p class="event-signup-page__meta">
          {{ formatDate(signupInfo.event.eventDate) }} · {{ formatEventTime(signupInfo.event.eventTime) }} · {{ signupInfo.event.location }}
        </p>
      </header>

      <q-banner v-if="!signupInfo.registrationOpen" class="bg-grey-3 text-grey-9 q-mx-md q-mb-md" rounded>
        {{ signupInfo.registrationClosedReason || "Registration is not available for this event." }}
      </q-banner>

      <q-form v-else class="event-signup-page__form" @submit.prevent="submit">
        <div class="row q-col-gutter-sm">
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
          <div class="col-12">
            <AppSelect
              v-model="form.churchId"
              :options="churchOptions"
              emit-value
              map-options
              label="Church *"
              dense
              outlined
              hide-bottom-space
              :rules="[requiredRule]"
              @update:model-value="onChurchChange"
            />
          </div>
          <div class="col-12">
            <AppSelect
              v-model="form.lifegroupId"
              :options="filteredLifegroupOptions"
              emit-value
              map-options
              clearable
              label="LifeGroup (optional)"
              dense
              outlined
              hide-bottom-space
              :disable="!form.churchId"
            />
          </div>
        </div>

        <q-btn
          unelevated
          no-caps
          color="primary"
          label="Register"
          type="submit"
          class="full-width q-mt-md"
          :loading="saving"
        />
      </q-form>
    </section>

    <section v-else-if="!loading" class="entity-page__panel event-signup-page__card">
      <div class="entity-table__empty">
        <q-icon name="error_outline" size="24px" color="grey-5" />
        <span>{{ loadError || "Event not found." }}</span>
      </div>
    </section>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { api } from "src/boot/axios";
import { formatEventTime } from "src/utils/eventTime";
import AppSelect from "src/components/AppSelect.vue";

const props = defineProps({
  id: { type: [String, Number], required: true }
});

const $q = useQuasar();
const route = useRoute();
const router = useRouter();
const eventId = props.id || route.params.id;

const loading = ref(true);
const saving = ref(false);
const signupInfo = ref(null);
const loadError = ref("");
const churchOptions = ref([]);
const lifegroupOptions = ref([]);

const requiredRule = (val) => !!val || "Required";

const form = ref(emptyForm());

function emptyForm() {
  return {
    firstName: "",
    lastName: "",
    churchId: null,
    lifegroupId: null
  };
}

function resetForm() {
  form.value = emptyForm();
}

const filteredLifegroupOptions = computed(() => {
  if (!form.value.churchId) return [];
  return lifegroupOptions.value.filter(
    (option) => !option.churchId || option.churchId === form.value.churchId
  );
});

function formatDate(value) {
  if (!value) return "Date TBA";
  return new Date(value).toLocaleDateString();
}

function onChurchChange() {
  if (!form.value.lifegroupId) return;
  const selected = lifegroupOptions.value.find((option) => option.value === form.value.lifegroupId);
  if (selected?.churchId && selected.churchId !== form.value.churchId) {
    form.value.lifegroupId = null;
  }
}

function applySignupOptions(data) {
  churchOptions.value = (data.churches || []).map((church) => ({
    label: church.name,
    value: church.id
  }));
  lifegroupOptions.value = (data.lifegroups || []).map((group) => ({
    label: group.name,
    value: group.id,
    churchId: group.churchId
  }));
}

async function loadSignupInfo() {
  loading.value = true;
  loadError.value = "";
  try {
    const { data } = await api.get(`/events/${eventId}/signup`);
    signupInfo.value = data;
    applySignupOptions(data);
  } catch (err) {
    signupInfo.value = null;
    const message = err?.response?.data?.message || "Failed to load registration page.";
    loadError.value = Array.isArray(message) ? message[0] : message;
    $q.notify({ type: "negative", message: loadError.value });
  } finally {
    loading.value = false;
  }
}

async function submit() {
  if (!signupInfo.value?.registrationOpen) return;

  saving.value = true;
  try {
    const { data } = await api.post(`/events/${eventId}/signup`, form.value);
    resetForm();

    $q.notify({
      type: "positive",
      message: data.message || "You have successfully registered to the event."
    });

    if (data.paymentUrl) {
      $q.notify({
        type: "info",
        message: "This event has a registration fee.",
        timeout: 8000,
        actions: [{ label: "Proceed to payment", color: "white", handler: () => router.push(data.paymentUrl) }]
      });
    }
  } catch (err) {
    const message = err?.response?.data?.message || "Registration failed.";
    $q.notify({ type: "negative", message: Array.isArray(message) ? message[0] : message });
  } finally {
    saving.value = false;
  }
}

onMounted(loadSignupInfo);
</script>

<style scoped lang="scss">
.event-signup-page {
  display: flex;
  justify-content: center;
  padding: 24px 16px;
  min-height: inherit;
}

.event-signup-page__card {
  width: min(520px, 100%);
}

.event-signup-page__header {
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

.event-signup-page__meta {
  margin-top: 4px !important;
}

.event-signup-page__form {
  padding: 0 16px 16px;
}

@media (max-width: 599px) {
  .event-signup-page {
    padding: 12px 10px;
  }

  .event-signup-page__meta {
    font-size: 0.75rem !important;
    line-height: 1.4;
  }
}
</style>
