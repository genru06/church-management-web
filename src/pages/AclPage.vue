<template>
  <q-page class="entity-page acl-page">
    <header class="entity-page__header">
      <div class="entity-page__heading">
        <h1 class="entity-page__title">Access Control</h1>
      </div>
      <p class="acl-page__intro">
        Assign module, button, and tab access to each user access tag. Only Super User and Main Church Admin can change ACL.
      </p>
    </header>

    <div class="acl-page__layout">
      <aside class="acl-page__tags entity-page__panel">
        <div class="acl-page__tags-head">
          <div class="text-subtitle2">Access tags</div>
        </div>

        <q-form class="acl-page__add-tag" @submit.prevent="addTag">
          <q-input
            v-model="newTagName"
            dense
            outlined
            placeholder="New access tag…"
            :disable="savingTag"
            hide-bottom-space
          />
          <q-btn
            type="submit"
            dense
            unelevated
            no-caps
            color="primary"
            icon="add"
            label="Add"
            :loading="savingTag"
            :disable="!newTagName.trim()"
          />
        </q-form>

        <q-inner-loading :showing="loading" />

        <ul class="acl-page__tag-list">
          <li v-for="tag in tags" :key="tag.id">
            <button
              type="button"
              class="acl-page__tag-btn"
              :class="{ 'acl-page__tag-btn--active': selectedTagId === tag.id }"
              @click="selectTag(tag)"
            >
              <span class="acl-page__tag-name">{{ tag.name }}</span>
              <q-badge v-if="tag.protected" color="grey-5" text-color="grey-9" label="Locked" />
              <span v-else class="acl-page__tag-count">{{ tag.permissions.length }}</span>
            </button>
          </li>
        </ul>
      </aside>

      <section class="acl-page__matrix entity-page__panel">
        <div v-if="!selectedTag" class="acl-page__empty">
          <q-icon name="security" size="28px" color="grey-5" />
          <span>Select an access tag to manage its permissions.</span>
        </div>

        <template v-else>
          <header class="acl-page__matrix-head">
            <div>
              <div class="text-subtitle1 text-weight-medium">{{ selectedTag.name }}</div>
              <div class="text-caption text-grey-7">
                {{
                  selectedTag.protected
                    ? "Super User always has full access and cannot be edited."
                    : "Toggle pages, actions, and tabs this tag can use."
                }}
              </div>
            </div>
            <div class="row q-gutter-sm items-center">
              <q-btn
                v-if="!selectedTag.protected"
                flat
                dense
                no-caps
                color="negative"
                icon="delete_outline"
                label="Delete tag"
                :disable="saving"
                @click="confirmDeleteTag"
              />
              <q-btn
                v-if="!selectedTag.protected"
                unelevated
                dense
                no-caps
                color="primary"
                icon="save"
                label="Save access"
                :loading="saving"
                @click="savePermissions"
              />
            </div>
          </header>

          <div class="acl-page__modules">
            <div v-for="module in modules" :key="module.key" class="acl-page__module">
              <div class="acl-page__module-head">
                <q-icon :name="module.icon" size="18px" color="primary" />
                <span>{{ module.label }}</span>
              </div>

              <div v-if="module.pages.length" class="acl-page__group">
                <div class="acl-page__group-label">Module access</div>
                <div class="acl-page__checks">
                  <q-checkbox
                    v-for="res in module.pages"
                    :key="res.key"
                    v-model="draftKeys"
                    :val="res.key"
                    :label="res.label"
                    dense
                    :disable="selectedTag.protected || saving"
                  />
                </div>
              </div>

              <div v-if="module.actions.length" class="acl-page__group">
                <div class="acl-page__group-label">Buttons / actions</div>
                <div class="acl-page__checks">
                  <q-checkbox
                    v-for="res in module.actions"
                    :key="res.key"
                    v-model="draftKeys"
                    :val="res.key"
                    :label="res.label"
                    dense
                    :disable="selectedTag.protected || saving"
                  />
                </div>
              </div>

              <div v-if="module.tabs.length" class="acl-page__group">
                <div class="acl-page__group-label">Tabs</div>
                <div class="acl-page__checks">
                  <q-checkbox
                    v-for="res in module.tabs"
                    :key="res.key"
                    v-model="draftKeys"
                    :val="res.key"
                    :label="res.label"
                    dense
                    :disable="selectedTag.protected || saving"
                  />
                </div>
              </div>
            </div>
          </div>
        </template>
      </section>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useQuasar } from "quasar";
import { api } from "src/boot/axios";
import { useAuthStore } from "src/stores/auth";
import { MODULE_META } from "src/utils/permissions";

const $q = useQuasar();
const auth = useAuthStore();

const loading = ref(false);
const saving = ref(false);
const savingTag = ref(false);
const resources = ref([]);
const tags = ref([]);
const selectedTagId = ref(null);
const draftKeys = ref([]);
const newTagName = ref("");

const selectedTag = computed(() => tags.value.find((t) => t.id === selectedTagId.value) || null);

const modules = computed(() => {
  const byModule = new Map();
  for (const res of resources.value) {
    if (!byModule.has(res.module)) {
      const meta = MODULE_META[res.module] || { label: res.module, icon: "folder" };
      byModule.set(res.module, {
        key: res.module,
        label: meta.label,
        icon: meta.icon,
        pages: [],
        actions: [],
        tabs: []
      });
    }
    const bucket = byModule.get(res.module);
    if (res.kind === "page") bucket.pages.push(res);
    else if (res.kind === "action") bucket.actions.push(res);
    else if (res.kind === "tab") bucket.tabs.push(res);
  }
  return [...byModule.values()];
});

function selectTag(tag) {
  selectedTagId.value = tag.id;
  draftKeys.value = [...(tag.permissions || [])];
}

async function loadAcl() {
  loading.value = true;
  try {
    const { data } = await api.get("/acl");
    resources.value = data.resources || [];
    tags.value = data.tags || [];
    if (selectedTagId.value) {
      const still = tags.value.find((t) => t.id === selectedTagId.value);
      if (still) selectTag(still);
      else {
        selectedTagId.value = null;
        draftKeys.value = [];
      }
    } else if (tags.value.length) {
      selectTag(tags.value[0]);
    }
  } catch (err) {
    $q.notify({ type: "negative", message: err.response?.data?.message || "Failed to load ACL" });
  } finally {
    loading.value = false;
  }
}

async function addTag() {
  const name = newTagName.value.trim();
  if (!name) return;
  savingTag.value = true;
  try {
    const { data } = await api.post("/acl/tags", { name });
    newTagName.value = "";
    tags.value = [...tags.value, data].sort((a, b) => a.name.localeCompare(b.name));
    selectTag(data);
    $q.notify({ type: "positive", message: "Access tag created" });
  } catch (err) {
    $q.notify({ type: "negative", message: err.response?.data?.message || "Failed to add tag" });
  } finally {
    savingTag.value = false;
  }
}

async function savePermissions() {
  if (!selectedTag.value || selectedTag.value.protected) return;
  saving.value = true;
  try {
    const { data } = await api.put(`/acl/tags/${selectedTag.value.id}/permissions`, {
      permissions: draftKeys.value
    });
    tags.value = tags.value.map((t) => (t.id === data.id ? data : t));
    selectTag(data);
    $q.notify({ type: "positive", message: "Access updated" });
    await auth.fetchMe();
  } catch (err) {
    $q.notify({ type: "negative", message: err.response?.data?.message || "Failed to save access" });
  } finally {
    saving.value = false;
  }
}

function confirmDeleteTag() {
  if (!selectedTag.value || selectedTag.value.protected) return;
  $q.dialog({
    title: "Delete access tag",
    message: `Remove “${selectedTag.value.name}”? This cannot be undone.`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    try {
      await api.delete(`/acl/tags/${selectedTag.value.id}`);
      $q.notify({ type: "positive", message: "Access tag deleted" });
      selectedTagId.value = null;
      draftKeys.value = [];
      await loadAcl();
    } catch (err) {
      $q.notify({ type: "negative", message: err.response?.data?.message || "Failed to delete tag" });
    }
  });
}

onMounted(loadAcl);
</script>

<style scoped lang="scss">
.acl-page__intro {
  width: 100%;
  margin: -2px 0 10px;
  font-size: 0.8rem;
  color: #6b7280;
}

.acl-page__layout {
  display: grid;
  grid-template-columns: minmax(220px, 280px) minmax(0, 1fr);
  gap: 12px;
  align-items: start;
}

@media (max-width: 860px) {
  .acl-page__layout {
    grid-template-columns: 1fr;
  }
}

.acl-page__tags {
  position: relative;
  min-height: 320px;
}

.acl-page__tags-head {
  padding: 12px 12px 8px;
  border-bottom: 1px solid #eef1f6;
}

.acl-page__add-tag {
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid #eef1f6;
}

.acl-page__tag-list {
  list-style: none;
  margin: 0;
  padding: 6px;
  max-height: calc(100vh - 220px);
  overflow-y: auto;
}

.acl-page__tag-btn {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 10px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  text-align: left;
  cursor: pointer;
  color: #1a1a2e;

  &:hover {
    background: #f3f6fb;
  }

  &--active {
    background: #e8eef8;
  }
}

.acl-page__tag-name {
  flex: 1;
  font-size: 0.86rem;
  font-weight: 500;
  min-width: 0;
}

.acl-page__tag-count {
  font-size: 0.72rem;
  color: #6b7280;
  background: #eef1f6;
  border-radius: 999px;
  padding: 1px 7px;
}

.acl-page__matrix {
  min-height: 420px;
}

.acl-page__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 320px;
  color: #8b93a1;
  font-size: 0.86rem;
}

.acl-page__matrix-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 14px 16px;
  border-bottom: 1px solid #eef1f6;
}

.acl-page__modules {
  padding: 8px 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.acl-page__module {
  border: 1px solid #eef1f6;
  border-radius: 8px;
  padding: 10px 12px 12px;
  background: #fbfcfe;
}

.acl-page__module-head {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 0.88rem;
  font-weight: 600;
  color: #1a1a2e;
  margin-bottom: 8px;
}

.acl-page__group + .acl-page__group {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px dashed #e8ecf2;
}

.acl-page__group-label {
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #8b93a1;
  margin-bottom: 6px;
}

.acl-page__checks {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 2px 12px;
}
</style>
