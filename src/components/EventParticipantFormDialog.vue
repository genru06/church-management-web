<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
    @show="onShow"
  >
    <q-card class="entity-dialog">
      <header class="entity-dialog__header">
        <div>
          <h2 class="entity-dialog__title">{{ mode === "create" ? "Add participant" : "Edit participant" }}</h2>
          <p class="entity-dialog__subtitle">
            Add a guest participant, link an existing member, or register someone as a new member.
          </p>
        </div>
        <q-btn flat round dense icon="close" color="grey-7" :disable="saving" @click="close" />
      </header>

      <q-separator />

      <q-card-section class="entity-dialog__body">
        <q-form ref="formRef" class="entity-dialog__form" @submit.prevent="submit">
          <div class="row q-col-gutter-sm">
            <div class="col-12">
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
          @click="submit"
        />
      </footer>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch } from "vue";
import { useQuasar } from "quasar";
import { api } from "src/boot/axios";
import AppSelect from "src/components/AppSelect.vue";
import { getChurchDisplayName } from "src/utils/churchDisplay";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  mode: { type: String, default: "create" },
  eventId: { type: [String, Number], required: true },
  participant: { type: Object, default: null }
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
  firstName: "",
  lastName: "",
  fullName: "",
  email: "",
  phone: ""
});

const form = ref(emptyForm());

function close() {
  if (saving.value) return;
  emit("update:modelValue", false);
}

function resetForm() {
  form.value = emptyForm();
  formRef.value?.resetValidation();
}

async function loadMembers() {
  const { data } = await api.get("/members");
  memberOptions.value = data.map((m) => ({
    label: `${m.lastName}, ${m.firstName}`,
    value: m.id,
    member: m
  }));
}

async function loadChurches() {
  churchesLoading.value = true;
  try {
    const { data } = await api.get("/churches");
    churchOptions.value = data.map((church) => ({
      label: getChurchDisplayName(church),
      value: Number(church.id)
    }));
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
  await loadMembers();
  if (props.mode === "edit" && props.participant) {
    form.value = {
      memberId: props.participant.memberId,
      addAsMember: false,
      churchId: null,
      firstName: props.participant.firstName || "",
      lastName: props.participant.lastName || "",
      fullName: props.participant.fullName || "",
      email: props.participant.email || "",
      phone: props.participant.phone || ""
    };
  } else {
    resetForm();
  }
}

function buildPayload() {
  if (form.value.memberId) {
    return {
      memberId: form.value.memberId,
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

  return {
    fullName: form.value.fullName,
    email: form.value.email,
    phone: form.value.phone
  };
}

async function submit() {
  const valid = await formRef.value?.validate();
  if (!valid) return;

  saving.value = true;
  try {
    const payload = buildPayload();
    const { data } =
      props.mode === "create"
        ? await api.post(`/events/${props.eventId}/participants`, payload)
        : await api.put(`/events/${props.eventId}/participants/${props.participant.id}`, payload);

    $q.notify({
      type: "positive",
      message: props.mode === "create" ? "Participant added." : "Participant updated."
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
    if (!open) resetForm();
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
</style>
