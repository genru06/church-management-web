<template>
  <q-page class="churches-print-page">
    <div class="churches-print-page__toolbar no-print">
      <q-btn flat dense round icon="arrow_back" color="grey-7" @click="goBack" />
      <div class="churches-print-page__toolbar-title">Print church list</div>
      <q-btn
        dense
        unelevated
        no-caps
        color="primary"
        icon="print"
        label="Print"
        :disable="!printRows.length || loading"
        @click="printSheet"
      />
    </div>

    <q-inner-loading :showing="loading">
      <q-spinner size="36px" color="primary" />
    </q-inner-loading>

    <article v-if="!loading" class="churches-print-page__document">
      <header class="churches-print-page__header">
        <h1 class="churches-print-page__title">{{ pageTitle }}</h1>
        <p v-if="singleChurchLabel" class="churches-print-page__filter">{{ singleChurchLabel }}</p>
        <p class="churches-print-page__count">{{ printRows.length }} church(es)</p>
      </header>

      <section class="churches-print-page__section">
        <table class="churches-print-page__table">
          <thead>
            <tr>
              <th class="churches-print-page__col-qr">QR Code</th>
              <th>Name</th>
              <th>Short name</th>
              <th>Pastor</th>
              <th>Address</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="church in printRows" :key="church.id">
              <td class="churches-print-page__col-qr">
                <img
                  v-if="qrByChurch[church.id]"
                  :src="qrByChurch[church.id]"
                  :alt="`QR for ${displayName(church)}`"
                  class="churches-print-page__qr"
                />
              </td>
              <td>{{ church.name || "—" }}</td>
              <td>{{ church.shortName || "—" }}</td>
              <td>{{ church.pastorName || "—" }}</td>
              <td>{{ church.address || "—" }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <p v-if="!printRows.length" class="churches-print-page__empty">No churches to print.</p>
    </article>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { api } from "src/boot/axios";
import { compareChurchNamesMainFirst, getChurchDisplayName } from "src/utils/churchDisplay";
import { generateChurchQrDataUrl } from "src/utils/churchQr";
import { LG_NETWORK_CHURCH_TAG, LG_NETWORK_CHURCHES_PATH } from "src/utils/churchTags";

const props = defineProps({
  networkOnly: { type: Boolean, default: false }
});

const $q = useQuasar();
const route = useRoute();
const router = useRouter();

const loading = ref(false);
const churches = ref([]);
const qrByChurch = ref({});

function normalizeRouteChurchId(queryValue) {
  if (queryValue == null || queryValue === "") return null;
  const raw = Array.isArray(queryValue) ? queryValue[0] : queryValue;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

const churchIdFilter = computed(() => normalizeRouteChurchId(route.query.churchId));

const printRows = computed(() => {
  const rows = [...churches.value].sort((a, b) => compareChurchNamesMainFirst(a, b));
  if (!churchIdFilter.value) return rows;
  return rows.filter((church) => Number(church.id) === churchIdFilter.value);
});

const pageTitle = computed(() =>
  props.networkOnly ? "LG Network Church List" : "Church List"
);

const listPath = computed(() => (props.networkOnly ? LG_NETWORK_CHURCHES_PATH : "/churches"));

const singleChurchLabel = computed(() => {
  if (!churchIdFilter.value) return "";
  const church = printRows.value[0];
  return church ? `Church: ${displayName(church)}` : "";
});

function displayName(church) {
  return getChurchDisplayName(church) || church?.name || "—";
}

function goBack() {
  router.push(listPath.value);
}

function printSheet() {
  window.print();
}

async function loadQrCodes(rows) {
  const entries = await Promise.all(
    rows.map(async (church) => {
      const dataUrl = await generateChurchQrDataUrl(church, 200);
      return [church.id, dataUrl];
    })
  );
  qrByChurch.value = Object.fromEntries(entries.filter(([, dataUrl]) => dataUrl));
}

async function loadPrintSheet() {
  loading.value = true;
  try {
    const params = props.networkOnly
      ? { tag: LG_NETWORK_CHURCH_TAG }
      : { excludeTag: LG_NETWORK_CHURCH_TAG };
    const { data } = await api.get("/churches", { params });
    churches.value = Array.isArray(data) ? data : [];

    if (churchIdFilter.value && !printRows.value.length) {
      $q.notify({ type: "warning", message: "Church not found for printing." });
      router.push(listPath.value);
      return;
    }

    await loadQrCodes(printRows.value);
  } catch {
    $q.notify({ type: "negative", message: "Failed to load church list for printing." });
    router.push(listPath.value);
  } finally {
    loading.value = false;
  }
}

onMounted(loadPrintSheet);
</script>

<style scoped lang="scss">
.churches-print-page {
  padding: 12px 16px 24px;
  max-width: 1100px;
  margin: 0 auto;
}

.churches-print-page__toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
}

.churches-print-page__toolbar-title {
  flex: 1;
  font-size: 0.95rem;
  font-weight: 600;
  color: #1a1a2e;
}

.churches-print-page__document {
  background: #fff;
  border: 1px solid #e4e8ef;
  border-radius: 8px;
  padding: 20px 24px;
}

.churches-print-page__header {
  margin-bottom: 24px;
  text-align: center;
}

.churches-print-page__title {
  margin: 0 0 6px;
  font-size: 1.1rem;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: #1a1a2e;
}

.churches-print-page__filter,
.churches-print-page__count {
  margin: 2px 0 0;
  font-size: 0.82rem;
  color: #4b5563;
}

.churches-print-page__section {
  margin-bottom: 0;
}

.churches-print-page__table {
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

.churches-print-page__col-qr {
  width: 88px;
  text-align: center;
}

.churches-print-page__qr {
  width: 72px;
  height: 72px;
  display: block;
  margin: 0 auto;
}

.churches-print-page__empty {
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

  .churches-print-page {
    padding: 0;
    max-width: none;
  }

  .churches-print-page__document {
    border: none;
    border-radius: 0;
    padding: 0;
  }

  .churches-print-page__table {
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
