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
          <h2 class="entity-dialog__title">{{ mode === "create" ? "Add church" : "Edit church" }}</h2>
          <p class="entity-dialog__subtitle">
            {{ mode === "create" ? "Register a new church." : "Update church profile." }}
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
            <legend class="entity-dialog__section-title">Church profile</legend>
            <div class="row q-col-gutter-sm">
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="form.name"
                  label="Church name *"
                  dense
                  outlined
                  hide-bottom-space
                  :rules="[requiredRule]"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input v-model="form.shortName" label="Short name" dense outlined hide-bottom-space />
              </div>
              <div class="col-12">
                <q-input
                  v-model="form.address"
                  label="Address *"
                  dense
                  outlined
                  hide-bottom-space
                  :rules="[requiredRule]"
                />
              </div>
              <div class="col-12">
                <q-select
                  v-model="form.pastorMemberId"
                  :options="pastorOptions"
                  emit-value
                  map-options
                  clearable
                  label="Pastor"
                  dense
                  outlined
                  hide-bottom-space
                />
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
          :label="mode === 'create' ? 'Add church' : 'Save changes'"
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
  churchId: { type: [String, Number], default: null }
});

const emit = defineEmits(["update:modelValue", "saved"]);

const $q = useQuasar();
const formRef = ref(null);
const loading = ref(false);
const saving = ref(false);
const pastorOptions = ref([]);

const requiredRule = (val) => !!val || "Required";

const emptyForm = () => ({
  name: "",
  shortName: "",
  address: "",
  pastorMemberId: null
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

async function loadPastors() {
  const { data } = await api.get("/members");
  pastorOptions.value = data.map((m) => ({
    label: `${m.lastName}, ${m.firstName}`,
    value: m.id
  }));
}

async function loadChurch() {
  if (props.mode !== "edit" || !props.churchId) {
    resetForm();
    return;
  }

  loading.value = true;
  try {
    const { data } = await api.get(`/churches/${props.churchId}`);
    form.value = {
      name: data.name || "",
      shortName: data.shortName || "",
      address: data.address || "",
      pastorMemberId: data.pastorMemberId ?? null
    };
  } catch {
    $q.notify({ type: "negative", message: "Failed to load church." });
    close();
  } finally {
    loading.value = false;
  }
}

async function onShow() {
  await loadPastors();
  await loadChurch();
}

async function submit() {
  const valid = await formRef.value?.validate();
  if (!valid) return;

  saving.value = true;
  try {
    const { data } =
      props.mode === "create"
        ? await api.post("/churches", form.value)
        : await api.put(`/churches/${props.churchId}`, form.value);

    $q.notify({
      type: "positive",
      message: props.mode === "create" ? "Church added." : "Church updated."
    });
    emit("saved", data);
    emit("update:modelValue", false);
    resetForm();
  } catch (err) {
    const message = err?.response?.data?.message || "Failed to save church.";
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
