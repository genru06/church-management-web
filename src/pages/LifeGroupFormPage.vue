<template>
  <q-page padding>
    <div class="text-h5 q-mb-md">{{ mode === "create" ? "Add LifeGroup" : "Edit LifeGroup" }}</div>
    <q-card class="shadow-2">
      <q-card-section class="row items-center q-gutter-sm">
        <q-icon name="hub" color="primary" />
        <div class="text-subtitle1">LifeGroup Setup</div>
      </q-card-section>
      <q-separator />
      <q-card-section>
        <q-form class="row q-col-gutter-md">
          <div class="col-12 col-md-6">
            <q-input v-model="form.name" label="LifeGroup Name" outlined dense />
          </div>
          <div class="col-12 col-md-6">
            <AppSelect
              v-model="form.coachMemberId"
              :options="coachOptions"
              emit-value
              map-options
              label="LifeGroup Coach (from Members)"
              outlined
              dense
            />
          </div>
          <div class="col-12 row justify-end q-gutter-sm">
            <q-btn flat color="grey-8" icon="arrow_back" label="Cancel" to="/lifegroups" />
            <q-btn color="primary" :label="mode === 'create' ? 'Create LifeGroup' : 'Save Changes'" icon="save" @click="submitForm" />
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
import AppSelect from "src/components/AppSelect.vue";

const props = defineProps({
  mode: { type: String, default: "create" },
  id: { type: [String, Number], default: null }
});
const $q = useQuasar();
const router = useRouter();

const coachOptions = ref([]);

const form = ref({ name: "", coachMemberId: null });

function submitForm() {
  $q.dialog({
    title: "Confirm",
    message: "Save lifegroup details?",
    cancel: true,
    persistent: true
  }).onOk(async () => {
    if (props.mode === "create") await api.post("/lifegroups", form.value);
    else await api.put(`/lifegroups/${props.id}`, form.value);
    $q.notify({ type: "positive", message: "LifeGroup saved." });
    await router.push("/lifegroups");
  });
}

onMounted(async () => {
  const membersRes = await api.get("/members");
  coachOptions.value = membersRes.data.map((m) => ({
    label: `${m.firstName} ${m.lastName}`,
    value: m.id
  }));

  if (props.mode === "edit" && props.id) {
    const { data } = await api.get(`/lifegroups/${props.id}`);
    form.value = {
      name: data.name,
      coachMemberId: data.coachMemberId
    };
  }
});
</script>
