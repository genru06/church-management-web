<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">{{ mode === "create" ? "Add Member" : "Edit Member" }}</div>
    <q-card class="shadow-2">
      <q-card-section class="row items-center q-gutter-sm">
        <q-icon name="badge" color="primary" />
        <div class="text-subtitle1">Member Information</div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-form class="row q-col-gutter-md">
          <div class="col-12 col-md-4" v-for="field in fields" :key="field.key">
            <AppSelect
              v-if="field.key === 'city'"
              v-model="form.cityId"
              :options="cityOptions"
              option-label="label"
              option-value="value"
              emit-value
              map-options
              always-searchable
              input-debounce="300"
              label="City"
              outlined
              dense
              clearable
              @filter="onCityFilter"
              @update:model-value="onCitySelected"
            />
            <q-input
              v-else
              v-model="form[field.key]"
              :label="field.label"
              :type="field.type || 'text'"
              outlined
              dense
              :rules="field.required ? [requiredRule] : []"
            />
          </div>
          <div class="col-12 col-md-4">
            <AppSelect
              v-model="form.churchId"
              :options="allChurchOptions"
              emit-value
              map-options
              clearable
              label="Church"
              outlined
              dense
            />
          </div>
          <div class="col-12 col-md-4">
            <AppSelect v-model="form.tags" :options="tagOptions" label="Tags" multiple use-chips outlined dense />
          </div>
          <div class="col-12 row justify-end q-gutter-sm">
            <q-btn flat color="grey-8" icon="arrow_back" label="Cancel" to="/members" />
            <q-btn
              color="primary"
              :icon="mode === 'create' ? 'person_add' : 'save'"
              :label="mode === 'create' ? 'Create Member' : 'Save Changes'"
              @click="submitForm"
            />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useQuasar } from "quasar";
import { useRouter } from "vue-router";
import { api } from "src/boot/axios";
import { DEFAULT_CITY_ID } from "../mocks/data";
import { applyDefaultCity, ensureDefaultCityOption, toCityOption } from "src/utils/defaultCity";
import { getChurchDisplayName } from "src/utils/churchDisplay";
import AppSelect from "src/components/AppSelect.vue";

const props = defineProps({
  mode: { type: String, default: "create" },
  id: { type: [String, Number], default: null }
});
const $q = useQuasar();
const router = useRouter();
const cityOptions = ref([]);
const allChurchOptions = ref([]);
const tagOptions = ref([]);
const requiredRule = (val) => !!val || "This field is required";

const fields = [
  { key: "lastName", label: "Last Name", required: true },
  { key: "firstName", label: "First Name", required: true },
  { key: "email", label: "Email", type: "email" },
  { key: "phone", label: "Phone" },
  { key: "address", label: "Address" },
  { key: "city", label: "City" },
  { key: "barangay", label: "Barangay" },
  { key: "zip", label: "Zip" },
  { key: "country", label: "Country" },
  { key: "dateOfBirth", label: "Date of Birth", type: "date" },
  { key: "gender", label: "Gender" },
  { key: "maritalStatus", label: "Marital Status" },
  { key: "nationality", label: "Nationality" }
];

const form = ref({
  lastName: "",
  firstName: "",
  email: "",
  phone: "",
  address: "",
  cityId: DEFAULT_CITY_ID,
  city: "",
  barangay: "",
  zip: "",
  country: "",
  dateOfBirth: "",
  gender: "",
  maritalStatus: "",
  nationality: "",
  churchId: null,
  tags: []
});

function submitForm() {
  $q.dialog({
    title: "Confirm",
    message: "Do you want to save this member record?",
    cancel: true,
    persistent: true
  }).onOk(async () => {
    const payload = { ...form.value, churchId: normalizeChurchId(form.value.churchId) };
    delete payload.church;
    if (props.mode === "create") await api.post("/members", payload);
    else await api.put(`/members/${props.id}`, payload);
    $q.notify({ type: "positive", message: "Member saved." });
    await router.push("/members");
  });
}

async function loadChurches() {
  const { data } = await api.get("/churches");
  allChurchOptions.value = data.map((church) => ({
    label: getChurchDisplayName(church),
    value: Number(church.id)
  }));
}

async function loadTags() {
  const { data } = await api.get("/tags");
  tagOptions.value = data.map((tag) => tag.name);
}

function normalizeChurchId(value) {
  if (value == null || value === "") return null;
  const id = Number(value);
  return Number.isNaN(id) ? null : id;
}

function ensureChurchOption(churchId, churchName) {
  const id = normalizeChurchId(churchId);
  if (!id) return;
  const exists = allChurchOptions.value.some((opt) => opt.value === id);
  if (!exists) {
    allChurchOptions.value = [{ label: churchName || `Church #${id}`, value: id }, ...allChurchOptions.value];
  }
}

async function loadCities(search = "") {
  const { data } = await api.get("/cities", {
    params: { search, limit: 30 }
  });
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

onMounted(async () => {
  await Promise.all([loadCities(), loadChurches(), loadTags()]);
  await ensureDefaultCityOption(api, cityOptions);

  if (props.mode !== "edit" || !props.id) {
    applyDefaultCity(form, cityOptions);
    return;
  }

  const { data } = await api.get(`/members/${props.id}`);
  form.value = {
    ...form.value,
    ...data,
    cityId: data.cityId,
    churchId: normalizeChurchId(data.churchId),
    tags: data.tags || []
  };
  ensureChurchOption(data.churchId, data.church);
});
</script>
