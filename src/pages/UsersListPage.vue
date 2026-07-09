<template>
  <q-page class="entity-page">
    <header class="entity-page__header">
      <div class="entity-page__heading">
        <h1 class="entity-page__title">System Users</h1>
        <span v-if="rows.length" class="entity-page__count">{{ rows.length }}</span>
      </div>
      <q-btn
        dense
        unelevated
        no-caps
        color="primary"
        icon="person_add"
        label="Add user"
        class="entity-page__add-btn"
        @click="openCreateDialog"
      />
    </header>

    <section class="entity-page__panel">
      <q-table
        v-model:pagination="pagination"
        :rows="rows"
        :columns="columns"
        row-key="id"
        :filter="filter"
        :loading="loading"
        flat
        dense
        binary-state-sort
        :rows-per-page-options="[25, 50, 100]"
        class="entity-table"
      >
        <template #top>
          <div class="entity-table__toolbar">
            <q-input
              v-model="filter"
              dense
              borderless
              clearable
              placeholder="Search users…"
              class="entity-table__search"
            >
              <template #prepend>
                <q-icon name="search" size="18px" color="grey-6" />
              </template>
            </q-input>
          </div>
        </template>

        <template #body-cell-fullName="props">
          <q-td :props="props">
            <div class="text-weight-medium">{{ props.row.fullName }}</div>
            <div class="text-caption text-grey-7">@{{ props.row.username }}</div>
          </q-td>
        </template>

        <template #body-cell-tags="props">
          <q-td :props="props">
            <div class="row q-gutter-xs">
              <q-chip
                v-for="tag in props.row.tags"
                :key="tag"
                dense
                size="sm"
                color="blue-1"
                text-color="primary"
              >
                {{ tag }}
              </q-chip>
              <span v-if="!props.row.tags?.length" class="entity-table__muted">No tags</span>
            </div>
          </q-td>
        </template>

        <template #body-cell-churchId="props">
          <q-td :props="props">
            <span class="entity-table__muted">{{ churchLabel(props.row.churchId) }}</span>
          </q-td>
        </template>

        <template #body-cell-isActive="props">
          <q-td :props="props">
            <q-badge :color="props.row.isActive ? 'positive' : 'grey'" :label="props.row.isActive ? 'Active' : 'Inactive'" />
          </q-td>
        </template>

        <template #body-cell-actions="props">
          <q-td :props="props" class="entity-table__actions">
            <q-btn flat dense round size="sm" color="grey-7" icon="edit" @click="openEditDialog(props.row)">
              <q-tooltip>Edit</q-tooltip>
            </q-btn>
            <q-btn
              flat
              dense
              round
              size="sm"
              color="grey-7"
              icon="delete_outline"
              :disable="props.row.id === auth.user?.id"
              @click="confirmDelete(props.row)"
            >
              <q-tooltip>Delete</q-tooltip>
            </q-btn>
          </q-td>
        </template>

        <template #no-data>
          <div class="entity-table__empty">
            <q-icon name="manage_accounts" size="20px" color="grey-5" />
            <span>{{ filter ? "No users match your search." : "No users yet." }}</span>
          </div>
        </template>
      </q-table>
    </section>

    <UserFormDialog
      v-model="formDialogOpen"
      :mode="formMode"
      :user="editingUser"
      :available-tags="availableTags"
      :churches="churches"
      @saved="onUserSaved"
    />
  </q-page>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { useQuasar } from "quasar";
import { api } from "src/boot/axios";
import { useAuthStore } from "src/stores/auth";
import UserFormDialog from "src/components/UserFormDialog.vue";

const $q = useQuasar();
const auth = useAuthStore();

const rows = ref([]);
const churches = ref([]);
const availableTags = ref([]);
const loading = ref(false);
const filter = ref("");
const formDialogOpen = ref(false);
const formMode = ref("create");
const editingUser = ref(null);
const pagination = ref({ rowsPerPage: 25 });

const columns = [
  { name: "fullName", label: "User", field: "fullName", align: "left", sortable: true },
  { name: "tags", label: "Access Tags", field: "tags", align: "left" },
  { name: "churchId", label: "Church", field: "churchId", align: "left" },
  { name: "isActive", label: "Status", field: "isActive", align: "center", sortable: true },
  { name: "actions", label: "", field: "actions", align: "right" }
];

function churchLabel(churchId) {
  if (!churchId) return "—";
  const church = churches.value.find((c) => c.id === churchId);
  return church?.name || `Church #${churchId}`;
}

async function loadUsers() {
  loading.value = true;
  try {
    const { data } = await api.get("/users");
    rows.value = data;
  } catch (err) {
    $q.notify({ type: "negative", message: err.response?.data?.message || "Failed to load users" });
  } finally {
    loading.value = false;
  }
}

async function loadMeta() {
  try {
    const [tagsRes, churchesRes] = await Promise.all([api.get("/users/tags"), api.get("/churches")]);
    availableTags.value = tagsRes.data;
    churches.value = churchesRes.data;
  } catch {
    // non-critical
  }
}

function openCreateDialog() {
  formMode.value = "create";
  editingUser.value = null;
  formDialogOpen.value = true;
}

function openEditDialog(user) {
  formMode.value = "edit";
  editingUser.value = { ...user };
  formDialogOpen.value = true;
}

function onUserSaved() {
  formDialogOpen.value = false;
  loadUsers();
}

function confirmDelete(user) {
  $q.dialog({
    title: "Delete user",
    message: `Remove ${user.fullName} (@${user.username})? This cannot be undone.`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await api.delete(`/users/${user.id}`);
      $q.notify({ type: "positive", message: "User deleted" });
      loadUsers();
    } catch (err) {
      $q.notify({ type: "negative", message: err.response?.data?.message || "Failed to delete user" });
    }
  });
}

onMounted(() => {
  loadMeta();
  loadUsers();
});
</script>
