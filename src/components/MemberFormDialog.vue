<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="$emit('update:modelValue', $event)"
    @show="onShow"
  >
    <q-card class="member-dialog">
      <header class="member-dialog__header">
        <div>
          <h2 class="member-dialog__title">{{ mode === "create" ? "Add member" : "Edit member" }}</h2>
          <p class="member-dialog__subtitle">
            {{ mode === "create" ? "Create a new member record." : "Update member details." }}
          </p>
        </div>
        <q-btn flat round dense icon="close" color="grey-7" :disable="saving" @click="close" />
      </header>

      <q-separator />

      <q-card-section class="member-dialog__body">
        <q-inner-loading :showing="loading">
          <q-spinner size="28px" color="primary" />
        </q-inner-loading>

        <q-form ref="formRef" class="member-dialog__form" @submit.prevent="submit">
          <fieldset class="member-dialog__section">
            <legend class="member-dialog__section-title">Personal</legend>
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
              <div class="col-12 col-sm-6">
                <q-input
                  v-model="form.email"
                  label="Email"
                  type="email"
                  dense
                  outlined
                  hide-bottom-space
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input v-model="form.phone" label="Phone" dense outlined hide-bottom-space />
              </div>
              <div class="col-12 col-sm-4">
                <q-input v-model="form.dateOfBirth" label="Date of birth" type="date" dense outlined hide-bottom-space />
              </div>
              <div class="col-12 col-sm-4">
                <q-select
                  v-model="form.gender"
                  :options="genderOptions"
                  label="Gender"
                  dense
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  clearable
                />
              </div>
              <div class="col-12 col-sm-4">
                <q-select
                  v-model="form.maritalStatus"
                  :options="maritalStatusOptions"
                  label="Marital status"
                  dense
                  outlined
                  hide-bottom-space
                  emit-value
                  map-options
                  clearable
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input v-model="form.nationality" label="Nationality" dense outlined hide-bottom-space />
              </div>
            </div>
          </fieldset>

          <fieldset class="member-dialog__section">
            <legend class="member-dialog__section-title">Address</legend>
            <div class="row q-col-gutter-sm">
              <div class="col-12">
                <q-input v-model="form.address" label="Street address" dense outlined hide-bottom-space />
              </div>
              <div class="col-12 col-sm-6">
                <q-select
                  v-model="form.cityId"
                  :options="cityOptions"
                  option-label="label"
                  option-value="value"
                  emit-value
                  map-options
                  use-input
                  input-debounce="300"
                  label="City"
                  dense
                  outlined
                  hide-bottom-space
                  clearable
                  @filter="onCityFilter"
                  @update:model-value="onCitySelected"
                />
              </div>
              <div class="col-12 col-sm-6">
                <q-input v-model="form.barangay" label="Barangay" dense outlined hide-bottom-space />
              </div>
              <div class="col-12 col-sm-6">
                <q-input v-model="form.zip" label="ZIP code" dense outlined hide-bottom-space />
              </div>
              <div class="col-12 col-sm-6">
                <q-input v-model="form.country" label="Country" dense outlined hide-bottom-space />
              </div>
            </div>
          </fieldset>

          <fieldset class="member-dialog__section">
            <legend class="member-dialog__section-title">Church</legend>
            <div class="row q-col-gutter-sm">
              <div class="col-12">
                <q-select
                  v-model="form.churchId"
                  :options="churchOptions"
                  emit-value
                  map-options
                  clearable
                  label="Church (optional)"
                  dense
                  outlined
                  hide-bottom-space
                />
              </div>
            </div>
          </fieldset>

          <fieldset class="member-dialog__section">
            <legend class="member-dialog__section-title">Tags</legend>
            <div class="row q-col-gutter-sm">
              <div class="col-12">
                <q-select
                  v-model="form.tags"
                  :options="memberTags"
                  label="Tags"
                  multiple
                  use-chips
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

      <footer class="member-dialog__footer">
        <q-btn flat no-caps label="Cancel" color="grey-8" :disable="saving" @click="close" />
        <q-btn
          unelevated
          no-caps
          color="primary"
          :label="mode === 'create' ? 'Add member' : 'Save changes'"
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
import { DEFAULT_CITY_ID, memberTags } from "src/mocks/data";
import { applyDefaultCity, ensureDefaultCityOption, toCityOption } from "src/utils/defaultCity";
import { getChurchDisplayName } from "src/utils/churchDisplay";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  mode: { type: String, default: "create" },
  memberId: { type: [String, Number], default: null }
});

const emit = defineEmits(["update:modelValue", "saved"]);

const $q = useQuasar();
const formRef = ref(null);
const loading = ref(false);
const saving = ref(false);
const cityOptions = ref([]);
const churchOptions = ref([]);

const genderOptions = ["Male", "Female"].map((v) => ({ label: v, value: v }));
const maritalStatusOptions = ["Single", "Married", "Widowed", "Divorced", "Separated"].map((v) => ({
  label: v,
  value: v
}));

const requiredRule = (val) => !!val || "Required";

const emptyForm = () => ({
  lastName: "",
  firstName: "",
  email: "",
  phone: "",
  address: "",
  cityId: DEFAULT_CITY_ID,
  city: "",
  barangay: "",
  zip: "",
  country: "Philippines",
  dateOfBirth: "",
  gender: null,
  maritalStatus: null,
  nationality: "",
  churchId: null,
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

async function loadChurches() {
  const { data } = await api.get("/churches");
  churchOptions.value = data.map((church) => ({
    label: getChurchDisplayName(church),
    value: Number(church.id)
  }));
}

function normalizeChurchId(value) {
  if (value == null || value === "") return null;
  const id = Number(value);
  return Number.isNaN(id) ? null : id;
}

function ensureChurchOption(churchId, churchName) {
  const id = normalizeChurchId(churchId);
  if (!id) return;
  const exists = churchOptions.value.some((opt) => opt.value === id);
  if (!exists) {
    churchOptions.value = [{ label: churchName || `Church #${id}`, value: id }, ...churchOptions.value];
  }
}

async function loadCities(search = "") {
  const { data } = await api.get("/cities", { params: { search, limit: 30 } });
  cityOptions.value = data.map(toCityOption);
}

function onCityFilter(val, update) {
  update(async () => {
    await loadCities(val || "");
  });
}

function onCitySelected(value) {
  const selected = cityOptions.value.find((opt) => opt.value === value);
  if (!selected) return;
  form.value.city = selected.cityName;
  if (selected.zipCode) form.value.zip = String(selected.zipCode);
}

async function loadMember() {
  if (props.mode !== "edit" || !props.memberId) {
    resetForm();
    applyDefaultCity(form, cityOptions);
    return;
  }

  loading.value = true;
  try {
    const { data } = await api.get(`/members/${props.memberId}`);
    form.value = {
      ...emptyForm(),
      ...data,
      cityId: data.cityId ?? null,
      churchId: normalizeChurchId(data.churchId),
      gender: data.gender || null,
      maritalStatus: data.maritalStatus || null,
      tags: data.tags || []
    };
    if (data.city) {
      const exists = cityOptions.value.some((opt) => opt.value === data.cityId);
      if (!exists && data.cityId) {
        cityOptions.value = [
          { label: data.city, value: data.cityId, cityName: data.city, zipCode: data.zip },
          ...cityOptions.value
        ];
      }
    }
    ensureChurchOption(data.churchId, data.church);
  } catch {
    $q.notify({ type: "negative", message: "Failed to load member." });
    close();
  } finally {
    loading.value = false;
  }
}

async function onShow() {
  await Promise.all([loadCities(), loadChurches()]);
  await ensureDefaultCityOption(api, cityOptions);
  await loadMember();
}

async function submit() {
  const valid = await formRef.value?.validate();
  if (!valid) return;

  saving.value = true;
  try {
    const payload = { ...form.value, churchId: normalizeChurchId(form.value.churchId) };
    delete payload.church;
    const { data } =
      props.mode === "create"
        ? await api.post("/members", payload)
        : await api.put(`/members/${props.memberId}`, payload);

    $q.notify({
      type: "positive",
      message: props.mode === "create" ? "Member added." : "Member updated."
    });
    emit("saved", data);
    emit("update:modelValue", false);
    resetForm();
  } catch (err) {
    const message = err?.response?.data?.message || "Failed to save member.";
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
.member-dialog {
  width: min(640px, 92vw);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  border-radius: 10px;
}

.member-dialog__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 16px 12px;
}

.member-dialog__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  line-height: 1.3;
  color: #1a1a2e;
}

.member-dialog__subtitle {
  margin: 2px 0 0;
  font-size: 0.78rem;
  color: #6b7280;
}

.member-dialog__body {
  position: relative;
  padding: 12px 16px;
  overflow-y: auto;
  flex: 1;
}

.member-dialog__form {
  :deep(.q-field) {
    font-size: 0.82rem;
  }

  :deep(.q-field__label) {
    font-size: 0.78rem;
  }

  :deep(.q-field--dense .q-field__control) {
    min-height: 36px;
  }
}

.member-dialog__section {
  border: none;
  margin: 0 0 14px;
  padding: 0;

  &:last-child {
    margin-bottom: 0;
  }
}

.member-dialog__section-title {
  display: block;
  width: 100%;
  margin: 0 0 8px;
  padding: 0;
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: #8b93a1;
}

.member-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px 16px;
}
</style>
