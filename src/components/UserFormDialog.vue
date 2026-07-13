<template>
  <q-dialog :model-value="modelValue" persistent @update:model-value="$emit('update:modelValue', $event)">
    <q-card class="entity-dialog">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ mode === "create" ? "Add User" : "Edit User" }}</div>
        <q-space />
        <q-btn flat round dense icon="close" @click="close" />
      </q-card-section>

      <q-card-section>
        <q-form class="q-gutter-md" @submit.prevent="onSubmit">
          <q-input v-model="form.fullName" label="Full name *" outlined dense :disable="saving" />
          <q-input v-model="form.username" label="Username *" outlined dense :disable="saving" />
          <q-input
            v-model="form.password"
            :label="mode === 'create' ? 'Password *' : 'New password (leave blank to keep current)'"
            :type="showPassword ? 'text' : 'password'"
            outlined
            dense
            :disable="saving"
          >
            <template #append>
              <q-btn flat dense round :icon="showPassword ? 'visibility_off' : 'visibility'" @click="showPassword = !showPassword" />
            </template>
          </q-input>

          <div>
            <div class="text-caption text-grey-8 q-mb-xs">Access tags *</div>
            <div class="row q-gutter-sm">
              <q-checkbox
                v-for="tag in availableTags"
                :key="tag"
                v-model="form.tags"
                :val="tag"
                :label="tag"
                dense
                :disable="saving"
              />
            </div>
            <div class="text-caption text-grey-6 q-mt-xs">
              Users with multiple tags can access all pages allowed by any of their tags.
            </div>
          </div>

          <AppSelect
            v-model="form.churchId"
            :options="churchOptions"
            label="Assigned church (for Pastor / Life Coach)"
            outlined
            dense
            clearable
            emit-value
            map-options
            :disable="saving"
          />

          <q-toggle v-model="form.isActive" label="Account active" :disable="saving" />
        </q-form>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn flat label="Cancel" color="grey-8" :disable="saving" @click="close" />
        <q-btn unelevated label="Save" color="primary" :loading="saving" @click="onSubmit" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { useQuasar } from "quasar";
import { api } from "src/boot/axios";
import AppSelect from "src/components/AppSelect.vue";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  mode: { type: String, default: "create" },
  user: { type: Object, default: null },
  availableTags: { type: Array, default: () => [] },
  churches: { type: Array, default: () => [] }
});

const emit = defineEmits(["update:modelValue", "saved"]);

const $q = useQuasar();
const saving = ref(false);
const showPassword = ref(false);

const form = ref({
  fullName: "",
  username: "",
  password: "",
  tags: [],
  churchId: null,
  isActive: true
});

const churchOptions = computed(() =>
  props.churches.map((c) => ({ label: c.name, value: c.id }))
);

watch(
  () => props.modelValue,
  (open) => {
    if (!open) return;
    if (props.mode === "edit" && props.user) {
      form.value = {
        fullName: props.user.fullName || "",
        username: props.user.username || "",
        password: "",
        tags: [...(props.user.tags || [])],
        churchId: props.user.churchId || null,
        isActive: props.user.isActive !== false
      };
    } else {
      form.value = { fullName: "", username: "", password: "", tags: [], churchId: null, isActive: true };
    }
  }
);

function close() {
  emit("update:modelValue", false);
}

async function onSubmit() {
  if (!form.value.fullName.trim() || !form.value.username.trim()) {
    $q.notify({ type: "warning", message: "Full name and username are required" });
    return;
  }
  if (props.mode === "create" && !form.value.password) {
    $q.notify({ type: "warning", message: "Password is required for new users" });
    return;
  }
  if (!form.value.tags.length) {
    $q.notify({ type: "warning", message: "Select at least one access tag" });
    return;
  }

  saving.value = true;
  try {
    const payload = {
      fullName: form.value.fullName.trim(),
      username: form.value.username.trim(),
      tags: form.value.tags,
      churchId: form.value.churchId,
      isActive: form.value.isActive
    };
    if (form.value.password) payload.password = form.value.password;

    if (props.mode === "create") {
      await api.post("/users", payload);
      $q.notify({ type: "positive", message: "User created" });
    } else {
      await api.put(`/users/${props.user.id}`, payload);
      $q.notify({ type: "positive", message: "User updated" });
    }
    emit("saved");
  } catch (err) {
    $q.notify({ type: "negative", message: err.response?.data?.message || "Failed to save user" });
  } finally {
    saving.value = false;
  }
}
</script>
