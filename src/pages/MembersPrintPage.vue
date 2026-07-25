<template>
  <q-page class="members-print-page">
    <div class="members-print-page__toolbar no-print">
      <q-btn flat dense round icon="arrow_back" color="grey-7" @click="goBack" />
      <div class="members-print-page__toolbar-title">Print member list</div>
      <q-btn
        dense
        unelevated
        no-caps
        color="primary"
        icon="print"
        label="Print"
        :disable="!printGroups.length || loading"
        @click="printSheet"
      />
    </div>

    <q-inner-loading :showing="loading">
      <q-spinner size="36px" color="primary" />
    </q-inner-loading>

    <article v-if="!loading" class="members-print-page__document">
      <header class="members-print-page__header">
        <h1 class="members-print-page__title">Member List</h1>
        <p v-if="lifeGroupFilterLabel" class="members-print-page__filter">
          LifeGroup: {{ lifeGroupFilterLabel }}
        </p>
        <p v-else-if="tagFilterLabel" class="members-print-page__filter">Tags: {{ tagFilterLabel }}</p>
        <p class="members-print-page__count">
          {{ totalMembers }} member(s)
          <template v-if="isLifeGroupPrint"> · 1 lifegroup</template>
          <template v-else> · {{ printGroups.length }} tag group(s)</template>
        </p>
      </header>

      <section
        v-for="group in printGroups"
        :key="group.key"
        class="members-print-page__section"
      >
        <header class="members-print-page__section-header">
          <h2 class="members-print-page__section-title">{{ group.tagName }}</h2>
          <p class="members-print-page__section-count">{{ group.members.length }} member(s)</p>
        </header>

        <table class="members-print-page__table">
          <thead>
            <tr>
              <th class="members-print-page__col-qr">QR Code</th>
              <th>Last Name</th>
              <th>First Name</th>
              <th>Church</th>
              <th v-if="!isLifeGroupPrint">LifeGroup</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="member in group.members" :key="`${group.key}-${member.id}`">
              <td class="members-print-page__col-qr">
                <img
                  v-if="qrByMember[member.id]"
                  :src="qrByMember[member.id]"
                  :alt="`QR for ${member.lastName}, ${member.firstName}`"
                  class="members-print-page__qr"
                />
              </td>
              <td>{{ member.lastName || "—" }}</td>
              <td>{{ member.firstName || "—" }}</td>
              <td>{{ member.church || "—" }}</td>
              <td v-if="!isLifeGroupPrint">{{ member.lifeGroup || "—" }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <p v-if="!printGroups.length" class="members-print-page__empty">No members to print.</p>
    </article>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { api } from "src/boot/axios";
import { generateMemberQrDataUrl } from "src/utils/memberQr";
import {
  groupMembersByLifeGroup,
  groupMembersByTag,
  hasLifeGroupFilterTag,
  tagsForMemberApi
} from "src/utils/memberPrint";

const $q = useQuasar();
const route = useRoute();
const router = useRouter();

const loading = ref(false);
const members = ref([]);
const allTagNames = ref([]);
const lifeGroupName = ref("");
const qrByMember = ref({});

function normalizeRouteTags(queryTag) {
  if (queryTag == null || queryTag === "") return [];
  const values = Array.isArray(queryTag) ? queryTag : [queryTag];

  const seen = new Set();
  const tags = [];

  values.forEach((entry) => {
    String(entry)
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)
      .forEach((tag) => {
        const key = tag.toLowerCase();
        if (seen.has(key)) return;
        seen.add(key);
        tags.push(tag);
      });
  });

  return tags;
}

function normalizeRouteLifeGroupId(queryValue) {
  if (queryValue == null || queryValue === "") return null;
  const raw = Array.isArray(queryValue) ? queryValue[0] : queryValue;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

const tagFilter = computed(() => normalizeRouteTags(route.query.tag));
const lifeGroupId = computed(() => normalizeRouteLifeGroupId(route.query.lifeGroupId));
const isLifeGroupPrint = computed(
  () => hasLifeGroupFilterTag(tagFilter.value) && Boolean(lifeGroupId.value)
);

const printGroups = computed(() => {
  if (isLifeGroupPrint.value) {
    return groupMembersByLifeGroup(members.value, {
      lifeGroupName: lifeGroupName.value
    });
  }

  return groupMembersByTag(members.value, {
    tagFilter: tagsForMemberApi(tagFilter.value),
    allTagNames: allTagNames.value
  });
});

const totalMembers = computed(() =>
  printGroups.value.reduce((sum, group) => sum + group.members.length, 0)
);

const tagFilterLabel = computed(() => {
  const tags = tagsForMemberApi(tagFilter.value);
  if (!tags.length) return "";
  return tags.join(", ");
});

const lifeGroupFilterLabel = computed(() => {
  if (!isLifeGroupPrint.value) return "";
  return lifeGroupName.value || "Selected lifegroup";
});

function goBack() {
  const query = {};
  if (tagFilter.value.length) query.tag = tagFilter.value;
  if (isLifeGroupPrint.value) query.lifeGroupId = lifeGroupId.value;
  router.push({ path: "/members", query });
}

function printSheet() {
  window.print();
}

async function ensureMemberQrTokens(rows) {
  const missing = rows.filter((member) => !member.qrToken);
  if (!missing.length) return rows;

  const refreshed = await Promise.all(
    missing.map((member) => api.get(`/members/${member.id}`).then((response) => response.data))
  );
  const byId = new Map(refreshed.map((member) => [Number(member.id), member]));

  return rows.map((member) => byId.get(Number(member.id)) || member);
}

async function loadQrCodes(rows) {
  const entries = await Promise.all(
    rows.map(async (member) => {
      if (!member.qrToken) return [member.id, ""];
      const dataUrl = await generateMemberQrDataUrl(member, 200);
      return [member.id, dataUrl];
    })
  );

  qrByMember.value = Object.fromEntries(entries.filter(([, dataUrl]) => dataUrl));
}

async function loadPrintSheet() {
  loading.value = true;
  try {
    if (hasLifeGroupFilterTag(tagFilter.value) && !lifeGroupId.value) {
      $q.notify({ type: "warning", message: "Select a lifegroup before printing." });
      router.push({
        path: "/members",
        query: tagFilter.value.length ? { tag: tagFilter.value } : {}
      });
      return;
    }

    const params = {};
    const apiTags = tagsForMemberApi(tagFilter.value);
    if (apiTags.length) params.tag = apiTags;
    if (lifeGroupId.value) params.lifeGroupId = lifeGroupId.value;

    const requests = [
      api.get("/tags"),
      api.get("/members", {
        params,
        paramsSerializer: { indexes: null }
      })
    ];

    if (lifeGroupId.value) {
      requests.push(api.get(`/lifegroups/${lifeGroupId.value}`));
    }

    const [tagsRes, membersRes, lifeGroupRes] = await Promise.all(requests);

    allTagNames.value = tagsRes.data.map((tag) => tag.name);
    lifeGroupName.value = lifeGroupRes?.data?.name || "";
    const withTokens = await ensureMemberQrTokens(membersRes.data);
    members.value = withTokens;

    const printableMembers = printGroups.value.flatMap((group) => group.members);
    const uniqueMembers = [...new Map(printableMembers.map((member) => [member.id, member])).values()];
    await loadQrCodes(uniqueMembers);
  } catch {
    $q.notify({ type: "negative", message: "Failed to load member list for printing." });
    router.push("/members");
  } finally {
    loading.value = false;
  }
}

onMounted(loadPrintSheet);
</script>

<style scoped lang="scss">
.members-print-page {
  padding: 12px 16px 24px;
  max-width: 1100px;
  margin: 0 auto;
}

.members-print-page__toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.members-print-page__toolbar-title {
  flex: 1;
  font-size: 0.95rem;
  font-weight: 600;
  color: #1a1a2e;
}

.members-print-page__document {
  background: #fff;
  border: 1px solid #e4e8ef;
  border-radius: 8px;
  padding: 20px 24px;
}

.members-print-page__header {
  margin-bottom: 24px;
  text-align: center;
}

.members-print-page__title {
  margin: 0 0 6px;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: #1a1a2e;
}

.members-print-page__filter,
.members-print-page__count {
  margin: 2px 0 0;
  font-size: 0.82rem;
  color: #4b5563;
}

.members-print-page__section {
  margin-bottom: 28px;

  &:last-child {
    margin-bottom: 0;
  }
}

.members-print-page__section-header {
  margin-bottom: 10px;
}

.members-print-page__section-title {
  margin: 0;
  font-size: 0.98rem;
  font-weight: 600;
  color: #1a1a2e;
}

.members-print-page__section-count {
  margin: 2px 0 0;
  font-size: 0.78rem;
  color: #6b7280;
}

.members-print-page__table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.82rem;
  color: #1a1a2e;

  th,
  td {
    border: 1px solid #9ca3af;
    padding: 8px 10px;
    text-align: left;
    vertical-align: middle;
  }

  th {
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    background: #f3f4f6;
  }

  tbody tr:nth-child(even) td {
    background: #fafbfc;
  }
}

.members-print-page__col-qr {
  width: 88px;
  text-align: center;
}

.members-print-page__qr {
  width: 72px;
  height: 72px;
  display: block;
  margin: 0 auto;
}

.members-print-page__empty {
  margin: 0;
  text-align: center;
  color: #6b7280;
  font-size: 0.9rem;
}

@media print {
  :global(body) {
    background: #fff !important;
  }

  :global(.q-header),
  :global(.q-drawer),
  :global(.q-footer) {
    display: none !important;
  }

  :global(.q-page-container) {
    padding: 0 !important;
  }

  .no-print {
    display: none !important;
  }

  .members-print-page {
    padding: 0;
    max-width: none;
  }

  .members-print-page__document {
    border: none;
    border-radius: 0;
    padding: 0;
  }

  .members-print-page__section {
    page-break-inside: avoid;
    break-inside: avoid-page;
  }

  .members-print-page__table {
    page-break-inside: auto;

    tr {
      page-break-inside: avoid;
      break-inside: avoid-page;
    }

    thead {
      display: table-header-group;
    }
  }
}
</style>
