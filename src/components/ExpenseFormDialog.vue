<template>
  <q-dialog :model-value="modelValue" persistent @update:model-value="$emit('update:modelValue', $event)">
    <q-card class="entity-dialog">
      <header class="entity-dialog__header">
        <div>
          <h2 class="entity-dialog__title">{{ mode === "create" ? "Add expense" : "Edit expense" }}</h2>
        </div>
        <q-btn flat round dense icon="close" color="grey-7" @click="$emit('update:modelValue', false)" />
      </header>
      <q-separator />
      <q-card-section class="entity-dialog__body">
        <q-form ref="formRef" class="entity-dialog__form">
          <div class="row q-col-gutter-sm">
            <div class="col-12 col-sm-6">
              <q-input v-model="form.expenseDate" type="date" label="Date *" dense outlined :rules="[requiredRule]" />
            </div>
            <div class="col-12 col-sm-6">
              <q-input v-model="form.category" label="Category *" dense outlined :rules="[requiredRule]" />
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
              <q-input v-model="form.approvedBy" label="Approved by" dense outlined />
            </div>
            <div class="col-12">
              <q-input v-model="form.description" type="textarea" label="Description" dense outlined autogrow />
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
  expenseId: { type: [Number, String], default: null },
  expense: { type: Object, default: null }
});

const emit = defineEmits(["update:modelValue", "saved"]);

const $q = useQuasar();
const formRef = ref(null);
const saving = ref(false);

const emptyForm = () => ({
  expenseDate: new Date().toISOString().slice(0, 10),
  category: "",
  payee: "",
  amount: null,
  description: "",
  approvedBy: "",
  remarks: ""
});

const form = ref(emptyForm());
const requiredRule = (val) => !!val || "Required";

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;
    if (props.mode === "edit" && props.expense) {
      form.value = {
        expenseDate: props.expense.expenseDate?.slice(0, 10) || "",
        category: props.expense.category || "",
        payee: props.expense.payee || "",
        amount: props.expense.amount,
        description: props.expense.description || "",
        approvedBy: props.expense.approvedBy || "",
        remarks: props.expense.remarks || ""
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
      await api.post("/operations/expenses", form.value);
    } else {
      await api.put(`/operations/expenses/${props.expenseId}`, form.value);
    }
    emit("update:modelValue", false);
    emit("saved");
    $q.notify({ type: "positive", message: "Expense saved." });
  } catch (err) {
    const message = err?.response?.data?.message || "Failed to save expense.";
    $q.notify({ type: "negative", message: Array.isArray(message) ? message[0] : message });
  } finally {
    saving.value = false;
  }
}
</script>
