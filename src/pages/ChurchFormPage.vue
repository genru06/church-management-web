<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">{{ mode === "create" ? "Add Church" : "Edit Church" }}</div>
    <q-card class="shadow-2">
      <q-card-section class="row items-center q-gutter-sm">
        <q-icon name="church" color="primary" />
        <div class="text-subtitle1">Church Profile</div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-form class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-input v-model="form.name" label="Church Name" outlined dense />
          </div>
          <div class="col-12 col-md-6">
            <q-input v-model="form.shortName" label="Short Name" outlined dense />
          </div>
          <div class="col-12 col-md-6">
            <q-input v-model="form.address" label="Church Address" outlined dense />
          </div>
          <div class="col-12 col-md-6">
            <AppSelect
              v-model="form.pastorMemberId"
              :options="pastorOptions"
              emit-value
              map-options
              clearable
              label="Church Pastor (from Members)"
              outlined
              dense
            />
          </div>
          <div class="col-12 col-md-6">
            <AppSelect
              :key="tagsSelectKey"
              v-model="form.tags"
              :options="tagOptions"
              label="Tags"
              multiple
              use-chips
              outlined
              dense
            />
            <div class="text-caption text-grey-6 q-mt-xs">
              A church can have multiple tags (for example House Church, Daughter Church, Outreach).
            </div>
          </div>
          <div class="col-12 row justify-end q-gutter-sm">
            <q-btn flat color="grey-8" icon="arrow_back" label="Cancel" to="/churches" />
            <q-btn color="primary" :label="mode === 'create' ? 'Create Church' : 'Save Changes'" icon="save" @click="submitForm" />
          </div>
        </q-form>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { nextTick, onMounted, ref } from "vue";
import { useQuasar } from "quasar";
import { useRouter } from "vue-router";
import { api } from "src/boot/axios";
import AppSelect from "src/components/AppSelect.vue";

const props = defineProps({
  mode: { type: String, default: "create" },
  id: { type: [String, Number], default: null }
});
const $q = useQuasar();
const router = useRouter();

const pastorOptions = ref([]);
const tagOptions = ref([]);
const tagsSelectKey = ref(0);

const form = ref({ name: "", shortName: "", address: "", pastorMemberId: null, tags: [] });

function submitForm() {
  $q.dialog({
    title: "Confirm",
    message: "Save church details?",
    cancel: true,
    persistent: true
  }).onOk(async () => {
    const payload = {
      ...form.value,
      tags: Array.isArray(form.value.tags) ? [...form.value.tags] : []
    };
    if (props.mode === "create") await api.post("/churches", payload);
    else await api.put(`/churches/${props.id}`, payload);
    $q.notify({ type: "positive", message: "Church saved." });
    await router.push("/churches");
  });
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

onMounted(async () => {
  const [membersRes] = await Promise.all([api.get("/members"), loadTags()]);
  pastorOptions.value = membersRes.data.map((m) => ({
    label: `${m.firstName} ${m.lastName}`,
    value: m.id
  }));

  if (props.mode === "edit" && props.id) {
    const { data } = await api.get(`/churches/${props.id}`);
    mergeTagOptions(data.tags);
    form.value = {
      name: data.name,
      shortName: data.shortName || "",
      address: data.address,
      pastorMemberId: data.pastorMemberId,
      tags: [...(data.tags || [])]
    };
    await nextTick();
    tagsSelectKey.value += 1;
  }
});
</script>
