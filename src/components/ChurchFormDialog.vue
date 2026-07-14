<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
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
                <AppSelect
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
              <div class="col-12">
                <AppSelect
                  :key="tagsSelectKey"
                  v-model="form.tags"
                  :options="tagOptions"
                  label="Tags"
                  multiple
                  use-chips
                  dense
                  outlined
                  hide-bottom-space
                />
                <div class="text-caption text-grey-6 q-mt-xs">
                  A church can have multiple tags (for example House Church, Daughter Church, Outreach).
                </div>
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
import { nextTick, ref, watch } from "vue";
import { useQuasar } from "quasar";
import { api } from "src/boot/axios";
import AppSelect from "src/components/AppSelect.vue";

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
const tagOptions = ref([]);
const tagsSelectKey = ref(0);

const requiredRule = (val) => !!val || "Required";

const emptyForm = () => ({
  name: "",
  shortName: "",
  address: "",
  pastorMemberId: null,
  tags: []
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

async function loadTags() {
  const { data } = await api.get("/tags");
  tagOptions.value = data.map((tag) => tag.name).sort((a, b) => a.localeCompare(b));
}

function mergeTagOptions(churchTags = []) {
  const merged = new Set(tagOptions.value);
  for (const tag of churchTags) {
    if (tag) merged.add(tag);
  }
  tagOptions.value = [...merged].sort((a, b) => a.localeCompare(b));
}

async function loadChurch() {
  if (props.mode !== "edit" || !props.churchId) {
    resetForm();
    return;
  }

  loading.value = true;
  try {
    const { data } = await api.get(`/churches/${props.churchId}`);
    mergeTagOptions(data.tags);
    form.value = {
      name: data.name || "",
      shortName: data.shortName || "",
      address: data.address || "",
      pastorMemberId: data.pastorMemberId ?? null,
      tags: [...(data.tags || [])]
    };
    await nextTick();
    tagsSelectKey.value += 1;
  } catch {
    $q.notify({ type: "negative", message: "Failed to load church." });
    close();
  } finally {
    loading.value = false;
  }
}

async function onShow() {
  await Promise.all([loadPastors(), loadTags()]);
  await loadChurch();
}

async function submit() {
  const valid = await formRef.value?.validate();
  if (!valid) return;

  saving.value = true;
  try {
    const payload = {
      ...form.value,
      tags: Array.isArray(form.value.tags) ? [...form.value.tags] : []
    };
    const { data } =
      props.mode === "create"
        ? await api.post("/churches", payload)
        : await api.put(`/churches/${props.churchId}`, payload);

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
  () => [props.modelValue, props.churchId, props.mode],
  async ([open]) => {
    if (!open) {
      resetForm();
      tagsSelectKey.value = 0;
      return;
    }
    await onShow();
  }
);
</script>
