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
          <h2 class="entity-dialog__title">{{ mode === "create" ? "Add lifegroup" : "Edit lifegroup" }}</h2>
          <p class="entity-dialog__subtitle">
            {{ mode === "create" ? "Set up a new lifegroup." : "Update lifegroup details." }}
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
            <legend class="entity-dialog__section-title">Lifegroup setup</legend>
            <div class="row q-col-gutter-sm">
              <div class="col-12">
                <q-input
                  v-model="form.name"
                  label="Lifegroup name *"
                  dense
                  outlined
                  hide-bottom-space
                  :rules="[requiredRule]"
                />
              </div>
              <div class="col-12 col-sm-6">
                <AppSelect
                  v-model="form.churchId"
                  :options="allChurchOptions"
                  emit-value
                  map-options
                  label="Church *"
                  dense
                  outlined
                  hide-bottom-space
                  :rules="[requiredRule]"
                />
              </div>
              <div class="col-12 col-sm-6">
                <AppSelect
                  v-model="form.coachMemberId"
                  :options="allMemberOptions"
                  emit-value
                  map-options
                  clearable
                  label="Coach"
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
          :label="mode === 'create' ? 'Add lifegroup' : 'Save changes'"
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
import { getChurchDisplayName, sortChurchesMainFirst } from "src/utils/churchDisplay";
import AppSelect from "src/components/AppSelect.vue";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  mode: { type: String, default: "create" },
  lifeGroupId: { type: [String, Number], default: null }
});

const emit = defineEmits(["update:modelValue", "saved"]);

const $q = useQuasar();
const formRef = ref(null);
const loading = ref(false);
const saving = ref(false);
const allMemberOptions = ref([]);
const allChurchOptions = ref([]);

const requiredRule = (val) => !!val || "Required";

const emptyForm = () => ({
  name: "",
  coachMemberId: null,
  churchId: null
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

async function loadOptions() {
  const [membersRes, churchesRes] = await Promise.all([api.get("/members"), api.get("/churches")]);
  allMemberOptions.value = membersRes.data.map((m) => ({
    label: `${m.lastName}, ${m.firstName}`,
    value: m.id
  }));
  allChurchOptions.value = sortChurchesMainFirst(
    churchesRes.data.map((c) => ({
      label: getChurchDisplayName(c),
      value: c.id
    })),
    (church) => church.label
  );
}

async function loadLifeGroup() {
  if (props.mode !== "edit" || !props.lifeGroupId) {
    resetForm();
    return;
  }

  loading.value = true;
  try {
    const { data } = await api.get(`/lifegroups/${props.lifeGroupId}`);
    form.value = {
      name: data.name || "",
      coachMemberId: data.coachMemberId ?? null,
      churchId: data.churchId ?? null
    };
  } catch {
    $q.notify({ type: "negative", message: "Failed to load lifegroup." });
    close();
  } finally {
    loading.value = false;
  }
}

async function onShow() {
  await loadOptions();
  await loadLifeGroup();
}

async function submit() {
  const valid = await formRef.value?.validate();
  if (!valid) return;

  saving.value = true;
  try {
    const { data } =
      props.mode === "create"
        ? await api.post("/lifegroups", form.value)
        : await api.put(`/lifegroups/${props.lifeGroupId}`, form.value);

    $q.notify({
      type: "positive",
      message: props.mode === "create" ? "Lifegroup added." : "Lifegroup updated."
    });
    emit("saved", data);
    emit("update:modelValue", false);
    resetForm();
  } catch (err) {
    const message = err?.response?.data?.message || "Failed to save lifegroup.";
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
