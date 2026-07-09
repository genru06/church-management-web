<template>
  <q-dialog :model-value="modelValue" persistent @update:model-value="$emit('update:modelValue', $event)">
    <q-card class="entity-dialog" style="min-width: 520px; max-width: 640px">
      <header class="entity-dialog__header">
        <div>
          <h2 class="entity-dialog__title">{{ title }}</h2>
        </div>
        <q-btn flat round dense icon="close" color="grey-7" @click="$emit('update:modelValue', false)" />
      </header>
      <q-separator />
      <q-card-section class="entity-dialog__body">
        <q-form ref="formRef" class="entity-dialog__form">
          <div class="row q-col-gutter-sm">
            <div class="col-12 col-sm-6">
              <q-input v-model="form.recordDate" type="date" label="Date *" dense outlined :rules="[requiredRule]" />
            </div>
            <div class="col-12 col-sm-6">
              <q-input
                :model-value="formatCurrency(computedTotal)"
                label="Total amount"
                dense
                outlined
                readonly
                bg-color="grey-1"
              />
            </div>
          </div>

          <p class="cash-count-form__section-label">Bill breakdown</p>
          <div class="row q-col-gutter-sm">
            <div v-for="denom in BILL_DENOMINATIONS" :key="denom" class="col-6 col-sm-4">
              <q-input
                v-model.number="form[`bill${denom}`]"
                type="number"
                min="0"
                step="1"
                :label="`₱${denom}`"
                dense
                outlined
              />
            </div>
          </div>

          <div class="row q-col-gutter-sm q-mt-sm">
            <div class="col-12 col-sm-6">
              <q-input v-model="form.countedBy" label="Counted by *" dense outlined :rules="[requiredRule]" />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="form.checkedBy" label="Checked by *" dense outlined :rules="[requiredRule]" />
            </div>
            <div class="col-12">
              <q-input v-model="form.remarks" type="textarea" label="Remarks" dense outlined autogrow />
            </div>
          </div>
        </q-form>
      </q-card-section>
      <q-separator />
      <footer class="entity-dialog__footer">
        <q-btn flat no-caps label="Cancel" color="grey-8" @click="$emit('update:modelValue', false)" />
        <q-btn unelevated no-caps color="primary" label="Save" :loading="saving" @click="save" />
      </footer>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useQuasar } from "quasar";
import { api } from "src/boot/axios";
import { BILL_DENOMINATIONS, computeBillTotal, emptyBillForm } from "src/utils/billDenominations";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  mode: { type: String, default: "create" },
  recordType: { type: String, required: true },
  recordId: { type: [Number, String], default: null },
  record: { type: Object, default: null }
});

const emit = defineEmits(["update:modelValue", "saved"]);

const $q = useQuasar();
const formRef = ref(null);
const saving = ref(false);
const form = ref(emptyBillForm());

const title = computed(() => {
  const label = props.recordType === "tithe" ? "Tithe" : "Offering";
  return props.mode === "create" ? `Add ${label.toLowerCase()}` : `Edit ${label.toLowerCase()}`;
});

const computedTotal = computed(() => computeBillTotal(form.value));

const requiredRule = (val) => !!val || "Required";

function formatCurrency(value) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(value || 0);
}

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;
    if (props.mode === "edit" && props.record) {
      form.value = {
        recordDate: props.record.recordDate?.slice(0, 10) || "",
        countedBy: props.record.countedBy || "",
        checkedBy: props.record.checkedBy || "",
        remarks: props.record.remarks || "",
        bill1000: props.record.bill1000 || 0,
        bill500: props.record.bill500 || 0,
        bill200: props.record.bill200 || 0,
        bill100: props.record.bill100 || 0,
        bill50: props.record.bill50 || 0,
        bill20: props.record.bill20 || 0,
        bill10: props.record.bill10 || 0,
        bill5: props.record.bill5 || 0,
        bill1: props.record.bill1 || 0
      };
    } else {
      form.value = emptyBillForm();
    }
  }
);

async function save() {
  const valid = await formRef.value?.validate();
  if (!valid) return;

  if (computedTotal.value <= 0) {
    $q.notify({ type: "negative", message: "Total amount must be greater than zero." });
    return;
  }

  saving.value = true;
  try {
    const endpoint = `/operations/${props.recordType}s`;
    if (props.mode === "create") {
      await api.post(endpoint, form.value);
    } else {
      await api.put(`${endpoint}/${props.recordId}`, form.value);
    }
    emit("update:modelValue", false);
    emit("saved");
    $q.notify({ type: "positive", message: "Record saved." });
  } catch (err) {
    const message = err?.response?.data?.message || "Failed to save record.";
    $q.notify({ type: "negative", message: Array.isArray(message) ? message[0] : message });
  } finally {
    saving.value = false;
  }
}
</script>

<style scoped lang="scss">
.cash-count-form__section-label {
  margin: 12px 0 8px;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #8b93a1;
}
</style>
