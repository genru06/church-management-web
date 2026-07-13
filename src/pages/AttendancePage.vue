<template>
  <q-page padding>
    <div class="page-header q-mb-md">
      <div>
        <div class="text-h5">Weekly Attendance by LifeGroup</div>
        <div class="text-caption text-grey-7">Track present members each week.</div>
      </div>
      <div class="page-header__actions">
        <q-btn color="primary" icon="add_task" label="Record Attendance" @click="showModal = true" />
      </div>
    </div>
    <div class="row q-col-gutter-md q-mb-md">
      <div class="col-12 col-md-4">
        <q-card class="shadow-1">
          <q-card-section class="row items-center q-gutter-md">
            <q-avatar color="positive" text-color="white" icon="groups" />
            <div>
              <div class="text-caption">Total Present</div>
              <div class="text-h6">{{ totalPresent }}</div>
            </div>
          </q-card-section>
        </q-card>
      </div>
    </div>
    <q-card class="shadow-2">
      <q-table :rows="rows" :columns="columns" row-key="id" flat bordered />
    </q-card>

    <q-dialog v-model="showModal">
      <q-card class="entity-dialog">
        <q-card-section class="row items-center q-gutter-sm">
          <q-icon name="event" color="primary" />
          <div class="text-subtitle1">Record Attendance</div>
        </q-card-section>
        <q-separator />
        <q-card-section>
          <AppSelect
            v-model="modal.lifeGroupId"
            :options="lifeGroupOptions"
            emit-value
            map-options
            label="LifeGroup"
            outlined
            dense
          />
          <q-input v-model="modal.weekOf" label="Week" type="date" outlined dense />
          <q-input v-model.number="modal.presentCount" label="Present Count" type="number" outlined dense class="q-mt-sm" />
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" v-close-popup />
          <q-btn color="primary" label="Save" @click="saveAttendance" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useQuasar } from "quasar";
import { api } from "src/boot/axios";
import AppSelect from "src/components/AppSelect.vue";

const $q = useQuasar();
const showModal = ref(false);
const modal = ref({ lifeGroupId: null, weekOf: "", presentCount: 0 });
const rows = ref([]);
const lifeGroupOptions = ref([]);

const totalPresent = computed(() => rows.value.reduce((sum, item) => sum + Number(item.presentCount || 0), 0));

async function saveAttendance() {
  await api.post("/attendance", modal.value);
  const { data } = await api.get("/attendance");
  rows.value = data;
  showModal.value = false;
  $q.notify({ type: "positive", message: "Attendance saved." });
}

const columns = [
  { name: "weekOf", label: "Week", field: "weekOf", align: "left" },
  { name: "lifeGroupName", label: "LifeGroup", field: "lifeGroupName", align: "left" },
  { name: "presentCount", label: "Present Members", field: "presentCount", align: "left" }
];

onMounted(async () => {
  const [attendanceRes, lifeGroupsRes] = await Promise.all([api.get("/attendance"), api.get("/lifegroups")]);
  rows.value = attendanceRes.data;
  lifeGroupOptions.value = lifeGroupsRes.data.map((g) => ({ label: g.name, value: g.id }));
  if (!modal.value.lifeGroupId && lifeGroupOptions.value[0]) modal.value.lifeGroupId = lifeGroupOptions.value[0].value;
});
</script>
