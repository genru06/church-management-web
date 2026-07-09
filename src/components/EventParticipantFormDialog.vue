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
          <p class="entity-dialog__subtitle">Link a member or add an external participant.</p>
        </div>
        <q-btn flat round dense icon="close" color="grey-7" :disable="saving" @click="close" />
      </header>

      <q-separator />

      <q-card-section class="entity-dialog__body">
        <q-form ref="formRef" class="entity-dialog__form" @submit.prevent="submit">
          <div class="row q-col-gutter-sm">
            <div class="col-12">
              <q-select
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
            <div class="col-12">
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

const requiredRule = (val) => !!val || "Required";

const emptyForm = () => ({
  memberId: null,
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

function onMemberSelected(memberId) {
  if (!memberId) return;
  const option = memberOptions.value.find((o) => o.value === memberId);
  if (!option) return;
  form.value.fullName = `${option.member.firstName} ${option.member.lastName}`;
  form.value.email = option.member.email || "";
  form.value.phone = option.member.phone || "";
}

async function onShow() {
  await loadMembers();
  if (props.mode === "edit" && props.participant) {
    form.value = {
      memberId: props.participant.memberId,
      fullName: props.participant.fullName || "",
      email: props.participant.email || "",
      phone: props.participant.phone || ""
    };
  } else {
    resetForm();
  }
}

async function submit() {
  const valid = await formRef.value?.validate();
  if (!valid) return;

  saving.value = true;
  try {
    const { data } =
      props.mode === "create"
        ? await api.post(`/events/${props.eventId}/participants`, form.value)
        : await api.put(`/events/${props.eventId}/participants/${props.participant.id}`, form.value);

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
