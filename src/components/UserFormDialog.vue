<template>
  <q-dialog :model-value="modelValue" persistent @update:model-value="$emit('update:modelValue', $event)">
    <q-card class="entity-dialog user-form-dialog">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-h6">{{ mode === "create" ? "Add User" : "Edit User" }}</div>
        <q-space />
        <q-btn flat round dense icon="close" @click="close" />
      </q-card-section>

      <q-card-section>
        <q-form class="q-gutter-md" @submit.prevent="onSubmit">
          <div>
            <div class="text-caption text-grey-8 q-mb-xs">Linked member *</div>
            <q-input
              v-model="memberSearch"
              outlined
              dense
              clearable
              placeholder="Search member by name…"
              :disable="saving"
              @update:model-value="onMemberSearch"
            >
              <template #prepend>
                <q-icon name="search" size="18px" color="grey-6" />
              </template>
            </q-input>

            <div v-if="selectedMember" class="user-form-dialog__selected q-mt-sm">
              <div class="user-form-dialog__selected-info">
                <div class="text-weight-medium">
                  {{ selectedMember.lastName }}, {{ selectedMember.firstName }}
                </div>
                <div class="text-caption text-grey-7">
                  {{ selectedMember.email || selectedMember.phone || `Member #${selectedMember.id}` }}
                </div>
              </div>
              <q-btn flat dense round icon="close" color="grey-7" :disable="saving" @click="clearMember" />
            </div>

            <div v-else-if="memberLoading" class="text-caption text-grey-6 q-mt-sm">Searching members…</div>
            <div v-else-if="memberSearch.trim() && !memberResults.length" class="text-caption text-grey-6 q-mt-sm">
              No members found.
            </div>
            <ul v-else-if="memberResults.length" class="user-form-dialog__results">
              <li v-for="member in memberResults" :key="member.id">
                <button type="button" class="user-form-dialog__result" :disabled="saving" @click="selectMember(member)">
                  <span class="user-form-dialog__result-name">{{ member.lastName }}, {{ member.firstName }}</span>
                  <span class="user-form-dialog__result-meta">{{ member.email || member.phone || "—" }}</span>
                </button>
              </li>
            </ul>
            <div v-else class="text-caption text-grey-6 q-mt-xs">
              Search and select the member this login belongs to.
            </div>
          </div>

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
              Use Events Manager for users who manage events and event attendance.
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
import { getChurchDisplayName, sortChurchesMainFirst } from "src/utils/churchDisplay";

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
const memberSearch = ref("");
const memberResults = ref([]);
const memberLoading = ref(false);
const selectedMember = ref(null);
let memberSearchTimer = null;

const form = ref({
  fullName: "",
  username: "",
  password: "",
  tags: [],
  churchId: null,
  memberId: null,
  isActive: true
});

const churchOptions = computed(() =>
  sortChurchesMainFirst(
    props.churches.map((c) => ({ label: getChurchDisplayName(c), value: c.id })),
    (church) => church.label
  )
);

function resetMemberSearch() {
  memberSearch.value = "";
  memberResults.value = [];
  memberLoading.value = false;
  clearTimeout(memberSearchTimer);
}

async function fetchMembers(term = "") {
  if (!term.trim()) {
    memberResults.value = [];
    return;
  }
  memberLoading.value = true;
  try {
    const { data } = await api.get("/members", { params: { search: term.trim() } });
    memberResults.value = Array.isArray(data) ? data : [];
  } catch {
    memberResults.value = [];
  } finally {
    memberLoading.value = false;
  }
}

function onMemberSearch() {
  clearTimeout(memberSearchTimer);
  memberSearchTimer = setTimeout(() => {
    fetchMembers(memberSearch.value);
  }, 300);
}

function selectMember(member) {
  selectedMember.value = member;
  form.value.memberId = member.id;
  form.value.fullName = `${member.firstName} ${member.lastName}`.trim();
  if (member.churchId) form.value.churchId = member.churchId;
  resetMemberSearch();
}

function clearMember() {
  selectedMember.value = null;
  form.value.memberId = null;
}

async function loadSelectedMember(memberId) {
  if (!memberId) {
    selectedMember.value = null;
    return;
  }
  try {
    const { data } = await api.get(`/members/${memberId}`);
    selectedMember.value = data;
  } catch {
    selectedMember.value = {
      id: memberId,
      firstName: props.user?.memberName || "Linked",
      lastName: "member",
      email: null,
      phone: null
    };
  }
}

watch(
  () => props.modelValue,
  async (open) => {
    if (!open) {
      resetMemberSearch();
      return;
    }
    if (props.mode === "edit" && props.user) {
      form.value = {
        fullName: props.user.fullName || "",
        username: props.user.username || "",
        password: "",
        tags: [...(props.user.tags || [])],
        churchId: props.user.churchId || null,
        memberId: props.user.memberId || null,
        isActive: props.user.isActive !== false
      };
      await loadSelectedMember(props.user.memberId);
    } else {
      form.value = {
        fullName: "",
        username: "",
        password: "",
        tags: [],
        churchId: null,
        memberId: null,
        isActive: true
      };
      selectedMember.value = null;
    }
    resetMemberSearch();
  }
);

function close() {
  emit("update:modelValue", false);
}

async function onSubmit() {
  if (!form.value.memberId) {
    $q.notify({ type: "warning", message: "Select a member to link this user account" });
    return;
  }
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
      memberId: form.value.memberId,
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

<style scoped lang="scss">
.user-form-dialog {
  width: min(520px, 94vw);
}

.user-form-dialog__selected {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f8fafc;
}

.user-form-dialog__results {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  max-height: 180px;
  overflow-y: auto;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.user-form-dialog__result {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  padding: 10px 12px;
  border: 0;
  border-bottom: 1px solid #f0f2f5;
  background: transparent;
  text-align: left;
  cursor: pointer;

  &:last-child {
    border-bottom: none;
  }

  &:hover:not(:disabled) {
    background: #f3f6fb;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.user-form-dialog__result-name {
  font-size: 0.88rem;
  font-weight: 500;
  color: #1a1a2e;
}

.user-form-dialog__result-meta {
  font-size: 0.76rem;
  color: #6b7280;
}
</style>
