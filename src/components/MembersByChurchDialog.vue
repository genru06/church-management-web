<template>
  <q-dialog
    :model-value="modelValue"
    maximized
    @update:model-value="$emit('update:modelValue', $event)"
    @show="onShow"
    @hide="onHide"
  >
    <q-card class="members-by-church-dialog">
      <header class="members-by-church-dialog__header">
        <div class="members-by-church-dialog__heading">
          <q-btn flat dense round icon="arrow_back" color="grey-7" @click="close" />
          <div>
            <h2 class="members-by-church-dialog__title">Members by church</h2>
            <p class="members-by-church-dialog__subtitle">
              {{ members.length }} member(s)
              <span v-if="members.length">
                · {{ adultCount }} adults · {{ kidsCount }} kids
              </span>
            </p>
          </div>
        </div>
        <q-btn flat round dense icon="close" color="grey-7" @click="close" />
      </header>

      <q-separator />

      <q-card-section class="members-by-church-dialog__body">
        <div v-if="!churchGroups.length" class="members-by-church-dialog__empty">
          <q-icon name="groups" size="32px" color="grey-5" />
          <p>No members yet.</p>
        </div>

        <template v-else>
          <div class="row q-col-gutter-md members-by-church-dialog__cards">
            <div
              v-for="(group, index) in churchGroups"
              :key="group.key"
              class="col-12 col-sm-6 col-md-4 col-lg-3"
            >
              <q-card
                flat
                bordered
                class="members-by-church-dialog__stat-card"
                :class="{ 'members-by-church-dialog__stat-card--active': String(selectedKey) === String(group.key) }"
                @click="selectGroup(group)"
              >
                <q-card-section class="members-by-church-dialog__stat-body">
                  <div class="row items-center no-wrap">
                    <q-avatar :color="cardColor(index)" text-color="white" icon="church" />
                    <div class="q-ml-md members-by-church-dialog__stat-text">
                      <div class="members-by-church-dialog__stat-label">{{ group.churchName }}</div>
                    </div>
                  </div>
                  <PageMetricBar
                    compact
                    :total="group.members.length"
                    :adults="group.adultCount"
                    :kids="group.kidsCount"
                  />
                </q-card-section>
              </q-card>
            </div>
          </div>

          <section v-if="selectedGroup" class="members-by-church-dialog__detail entity-page__panel">
            <div class="members-by-church-dialog__detail-header">
              <div>
                <h3 class="members-by-church-dialog__detail-title">{{ selectedGroup.churchName }}</h3>
                <p class="members-by-church-dialog__detail-meta">
                  {{ selectedGroup.members.length }} member(s)
                  · {{ selectedGroup.adultCount }} adults · {{ selectedGroup.kidsCount }} kids
                </p>
              </div>
            </div>

            <q-table
              :rows="selectedGroup.members"
              :columns="columns"
              row-key="id"
              flat
              dense
              :filter="groupFilter"
              :filter-method="filterGroupMembers"
              :pagination="{ rowsPerPage: 25, sortBy: 'name', descending: false }"
              class="members-by-church-dialog__table entity-table"
            >
              <template #top>
                <div class="members-by-church-dialog__table-toolbar">
                  <q-input
                    v-model="groupFilter"
                    dense
                    borderless
                    clearable
                    placeholder="Search this list…"
                    class="entity-table__search"
                  >
                    <template #prepend>
                      <q-icon name="search" size="18px" color="grey-6" />
                    </template>
                  </q-input>
                </div>
              </template>

              <template #body-cell-name="props">
                <q-td :props="props">
                  <router-link :to="memberDetailsTo(props.row.id)" class="entity-table__link">
                    {{ props.row.lastName }}, {{ props.row.firstName }}
                  </router-link>
                </q-td>
              </template>

              <template #body-cell-lifeGroup="props">
                <q-td :props="props">
                  <span class="entity-table__muted">{{ props.row.lifeGroup || "—" }}</span>
                </q-td>
              </template>

              <template #body-cell-tags="props">
                <q-td :props="props">
                  <div v-if="props.row.tags?.length" class="members-by-church-dialog__tags">
                    <q-chip
                      v-for="tag in props.row.tags"
                      :key="tag"
                      dense
                      size="sm"
                      :color="isKidsTag(tag) ? 'amber-2' : 'blue-1'"
                      :text-color="isKidsTag(tag) ? 'amber-10' : 'primary'"
                    >
                      {{ tag }}
                    </q-chip>
                  </div>
                  <span v-else class="entity-table__muted">—</span>
                </q-td>
              </template>

              <template #body-cell-actions="props">
                <q-td :props="props" class="entity-table__actions">
                  <q-btn
                    flat
                    dense
                    round
                    size="sm"
                    color="grey-7"
                    icon="visibility"
                    :to="memberDetailsTo(props.row.id)"
                  >
                    <q-tooltip>View</q-tooltip>
                  </q-btn>
                </q-td>
              </template>

              <template #no-data>
                <div class="entity-table__empty">
                  <q-icon name="group_off" size="20px" color="grey-5" />
                  <span>{{ groupFilter ? "No members match your search." : "No members in this church." }}</span>
                </div>
              </template>
            </q-table>
          </section>
        </template>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from "vue";
import { compareChurchNamesMainFirst } from "src/utils/churchDisplay";
import { LG_NETWORK_MEMBERS_FROM } from "src/utils/churchTags";
import PageMetricBar from "src/components/PageMetricBar.vue";

const CARD_COLORS = ["primary", "secondary", "accent", "positive", "orange", "purple"];

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  members: { type: Array, default: () => [] },
  networkOnly: { type: Boolean, default: false }
});

const emit = defineEmits(["update:modelValue"]);

const selectedKey = ref(null);
const groupFilter = ref("");

function isKidsTag(tag) {
  return String(tag || "").trim().toLowerCase() === "kids";
}

function isKidsMember(member) {
  return (member.tags || []).some(isKidsTag);
}

function compareMemberNames(rowA, rowB) {
  const lastNameCompare = (rowA.lastName || "").localeCompare(rowB.lastName || "", undefined, {
    sensitivity: "base"
  });
  if (lastNameCompare !== 0) return lastNameCompare;
  return (rowA.firstName || "").localeCompare(rowB.firstName || "", undefined, { sensitivity: "base" });
}

function sortMembers(members) {
  return [...members].sort(compareMemberNames);
}

function memberDetailsTo(id) {
  return props.networkOnly
    ? { path: `/members/${id}`, query: { from: LG_NETWORK_MEMBERS_FROM } }
    : `/members/${id}`;
}

function cardColor(index) {
  return CARD_COLORS[index % CARD_COLORS.length];
}

const kidsCount = computed(() => props.members.filter(isKidsMember).length);
const adultCount = computed(() => props.members.length - kidsCount.value);

const churchGroups = computed(() => {
  const map = new Map();

  props.members.forEach((member) => {
    const hasChurch = member.churchId != null && member.churchId !== "";
    const key = hasChurch ? Number(member.churchId) : "unassigned";
    const churchName = hasChurch ? member.church || "Church" : "Unassigned";

    if (!map.has(key)) {
      map.set(key, {
        key,
        churchId: hasChurch ? Number(member.churchId) : null,
        churchName,
        members: [],
        kidsCount: 0
      });
    }

    const group = map.get(key);
    group.members.push(member);
    if (isKidsMember(member)) group.kidsCount += 1;
  });

  return Array.from(map.values())
    .map((group) => ({
      ...group,
      adultCount: group.members.length - group.kidsCount,
      members: sortMembers(group.members)
    }))
    .sort((a, b) => compareChurchNamesMainFirst(a.churchName, b.churchName));
});

const selectedGroup = computed(
  () => churchGroups.value.find((group) => String(group.key) === String(selectedKey.value)) || null
);

const columns = [
  {
    name: "name",
    label: "Name",
    field: (row) => `${row.lastName}, ${row.firstName}`,
    align: "left",
    sortable: true,
    sort: (_, __, rowA, rowB) => compareMemberNames(rowA, rowB)
  },
  { name: "lifeGroup", label: "Lifegroup", field: "lifeGroup", align: "left", sortable: true },
  { name: "tags", label: "Tags", field: "tags", align: "left" },
  { name: "actions", label: "", field: "actions", align: "right", style: "width: 48px" }
];

function filterGroupMembers(rows, terms) {
  const needle = String(terms || "")
    .trim()
    .toLowerCase();
  if (!needle) return rows;

  return rows.filter((row) => {
    const haystack = [
      row.firstName,
      row.lastName,
      row.lifeGroup,
      row.tagsText,
      ...(Array.isArray(row.tags) ? row.tags : [])
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(needle);
  });
}

function selectGroup(group) {
  selectedKey.value = group.key;
  groupFilter.value = "";
}

function close() {
  emit("update:modelValue", false);
}

function onShow() {
  const firstGroup = churchGroups.value[0];
  if (firstGroup) selectGroup(firstGroup);
}

function onHide() {
  selectedKey.value = null;
  groupFilter.value = "";
}

watch(
  () => props.members,
  () => {
    if (!props.modelValue) return;
    if (selectedGroup.value) return;
    const firstGroup = churchGroups.value[0];
    if (firstGroup) selectGroup(firstGroup);
    else selectedKey.value = null;
  }
);
</script>

<style scoped lang="scss">
.members-by-church-dialog {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #f5f7fa;
}

.members-by-church-dialog__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 18px;
  background: #fff;
}

.members-by-church-dialog__heading {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  min-width: 0;
}

.members-by-church-dialog__title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1a1a2e;
}

.members-by-church-dialog__subtitle {
  margin: 2px 0 0;
  font-size: 0.8rem;
  color: #6b7280;
}

.members-by-church-dialog__body {
  flex: 1;
  padding: 16px;
  overflow-y: auto;
  min-height: 0;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
}

.members-by-church-dialog__cards {
  margin-bottom: 16px;
}

.members-by-church-dialog__stat-card {
  cursor: pointer;
  border-radius: 8px;
  background: #fff;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;

  &:hover {
    box-shadow: 0 2px 8px rgba(26, 26, 46, 0.08);
  }
}

.members-by-church-dialog__stat-card--active {
  border-color: #1976d2;
  box-shadow: 0 0 0 1px #1976d2;
}

.members-by-church-dialog__stat-text {
  min-width: 0;
}

.members-by-church-dialog__stat-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.members-by-church-dialog__stat-label {
  font-size: 0.82rem;
  font-weight: 500;
  color: #2d3340;
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.members-by-church-dialog__detail {
  overflow: hidden;
}

.members-by-church-dialog__detail-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 14px;
  border-bottom: 1px solid #eef1f6;
  background: #fafbfc;
}

.members-by-church-dialog__detail-title {
  margin: 0;
  font-size: 0.88rem;
  font-weight: 600;
  color: #1a1a2e;
}

.members-by-church-dialog__detail-meta {
  margin: 2px 0 0;
  font-size: 0.75rem;
  color: #6b7280;
}

.members-by-church-dialog__table-toolbar {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.members-by-church-dialog__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.members-by-church-dialog__empty {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 240px;
  color: #8b93a1;
  font-size: 0.9rem;

  p {
    margin: 0;
  }
}

@media (max-width: 599px) {
  .members-by-church-dialog__header {
    flex-wrap: wrap;
  }

  .members-by-church-dialog__detail-header {
    flex-wrap: wrap;
  }
}
</style>
