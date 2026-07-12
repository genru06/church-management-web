<template>
  <q-dialog :model-value="modelValue" persistent @update:model-value="$emit('update:modelValue', $event)">
    <q-card class="entity-dialog">
      <header class="entity-dialog__header">
        <div>
          <h2 class="entity-dialog__title">{{ mode === "create" ? "Add voucher" : "Edit voucher" }}</h2>
        </div>
        <q-btn flat round dense icon="close" color="grey-7" @click="$emit('update:modelValue', false)" />
      </header>
      <q-separator />
      <q-card-section class="entity-dialog__body">
        <q-form ref="formRef" class="entity-dialog__form">
          <div class="row q-col-gutter-sm">
            <div class="col-12 col-sm-6">
              <q-input v-model="form.voucherNo" label="Voucher no. *" dense outlined :rules="[requiredRule]" />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="form.voucherDate" type="date" label="Date *" dense outlined :rules="[requiredRule]" />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="form.payee" label="Payee *" dense outlined :rules="[requiredRule]" />
            </div>
            <div class="col-12 col-sm-6">
              <q-input
                v-model.number="form.amount"
                type="number"
                min="0"
                step="0.01"
                label="Amount *"
                dense
                outlined
                prefix="₱"
                :rules="[requiredRule]"
              />
            </div>
            <div class="col-12 col-sm-6">
              <q-select
                v-model="form.status"
                :options="statusOptions"
                label="Status *"
                dense
                outlined
                emit-value
                map-options
              />
            </div>
            <div class="col-12">
              <q-input v-model="form.purpose" type="textarea" label="Purpose *" dense outlined autogrow :rules="[requiredRule]" />
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
import { ref, watch } from "vue";
import { useQuasar } from "quasar";
import { api } from "src/boot/axios";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  mode: { type: String, default: "create" },
  voucherId: { type: [Number, String], default: null },
  voucher: { type: Object, default: null }
});

const emit = defineEmits(["update:modelValue", "saved"]);

const $q = useQuasar();
const formRef = ref(null);
const saving = ref(false);

const statusOptions = [
  { label: "Draft", value: "draft" },
  { label: "Approved", value: "approved" },
  { label: "Paid", value: "paid" },
  { label: "Cancelled", value: "cancelled" }
];

const emptyForm = () => ({
  voucherNo: "",
  voucherDate: new Date().toISOString().slice(0, 10),
  payee: "",
  amount: null,
  purpose: "",
  status: "draft",
  remarks: ""
});

const form = ref(emptyForm());
const requiredRule = (val) => !!val || "Required";

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;
    if (props.mode === "edit" && props.voucher) {
      form.value = {
        voucherNo: props.voucher.voucherNo || "",
        voucherDate: props.voucher.voucherDate?.slice(0, 10) || "",
        payee: props.voucher.payee || "",
        amount: props.voucher.amount,
        purpose: props.voucher.purpose || "",
        status: props.voucher.status || "draft",
        remarks: props.voucher.remarks || ""
      };
    } else {
      form.value = emptyForm();
    }
  }
);

async function save() {
  const valid = await formRef.value?.validate();
  if (!valid) return;

  saving.value = true;
  try {
    if (props.mode === "create") {
      await api.post("/operations/vouchers", form.value);
    } else {
      await api.put(`/operations/vouchers/${props.voucherId}`, form.value);
    }
    emit("update:modelValue", false);
    emit("saved");
    $q.notify({ type: "positive", message: "Voucher saved." });
  } catch (err) {
    const message = err?.response?.data?.message || "Failed to save voucher.";
    $q.notify({ type: "negative", message: Array.isArray(message) ? message[0] : message });
  } finally {
    saving.value = false;
  }
}
</script>
