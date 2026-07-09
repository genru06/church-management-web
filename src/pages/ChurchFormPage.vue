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
            <q-select
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
import { onMounted, ref } from "vue";
import { useQuasar } from "quasar";
import { useRouter } from "vue-router";
import { api } from "src/boot/axios";

const props = defineProps({
  mode: { type: String, default: "create" },
  id: { type: [String, Number], default: null }
});
const $q = useQuasar();
const router = useRouter();

const pastorOptions = ref([]);

const form = ref({ name: "", shortName: "", address: "", pastorMemberId: null });

function submitForm() {
  $q.dialog({
    title: "Confirm",
    message: "Save church details?",
    cancel: true,
    persistent: true
  }).onOk(async () => {
    if (props.mode === "create") await api.post("/churches", form.value);
    else await api.put(`/churches/${props.id}`, form.value);
    $q.notify({ type: "positive", message: "Church saved." });
    await router.push("/churches");
  });
}

onMounted(async () => {
  const membersRes = await api.get("/members");
  pastorOptions.value = membersRes.data.map((m) => ({
    label: `${m.firstName} ${m.lastName}`,
    value: m.id
  }));

  if (props.mode === "edit" && props.id) {
    const { data } = await api.get(`/churches/${props.id}`);
    form.value = {
      name: data.name,
      shortName: data.shortName || "",
      address: data.address,
      pastorMemberId: data.pastorMemberId
    };
  }
});
</script>
