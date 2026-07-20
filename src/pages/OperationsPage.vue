<template>
  <q-page class="entity-page">
    <header class="entity-page__header">
      <div class="entity-page__heading">
        <h1 class="entity-page__title">Operations</h1>
      </div>
    </header>

    <q-inner-loading :showing="loading">
      <q-spinner size="36px" color="primary" />
    </q-inner-loading>

    <section class="operations-stats row q-col-gutter-sm q-mb-md">
      <div class="col-6 col-sm-4 col-md-2">
        <div class="operations-stat-card">
          <span class="operations-stat-card__label">Tithes</span>
          <span class="operations-stat-card__value">{{ formatCurrency(summary.tithesTotal) }}</span>
        </div>
      </div>
      <div class="col-6 col-sm-4 col-md-2">
        <div class="operations-stat-card">
          <span class="operations-stat-card__label">Offerings</span>
          <span class="operations-stat-card__value">{{ formatCurrency(summary.offeringsTotal) }}</span>
        </div>
      </div>
      <div class="col-6 col-sm-4 col-md-2">
        <div class="operations-stat-card">
          <span class="operations-stat-card__label">Pledges paid</span>
          <span class="operations-stat-card__value">{{ formatCurrency(summary.pledgesPaid) }}</span>
        </div>
      </div>
      <div class="col-6 col-sm-4 col-md-2">
        <div class="operations-stat-card">
          <span class="operations-stat-card__label">Registration</span>
          <span class="operations-stat-card__value">{{ formatCurrency(summary.registrationTotal) }}</span>
        </div>
      </div>
      <div class="col-6 col-sm-4 col-md-2">
        <div class="operations-stat-card">
          <span class="operations-stat-card__label">Expenses</span>
          <span class="operations-stat-card__value operations-stat-card__value--expense">{{ formatCurrency(summary.expensesTotal) }}</span>
        </div>
      </div>
      <div class="col-6 col-sm-4 col-md-2">
        <div class="operations-stat-card">
          <span class="operations-stat-card__label">Net balance</span>
          <span class="operations-stat-card__value">{{ formatCurrency(summary.netBalance) }}</span>
        </div>
      </div>
    </section>

    <section class="entity-page__panel">
      <q-tabs v-model="activeTab" dense align="left" active-color="primary" indicator-color="primary" class="operations-tabs">
        <q-tab v-if="auth.canTab('tab.operations.tithes')" name="tithes" label="Tithes" icon="savings" no-caps />
        <q-tab v-if="auth.canTab('tab.operations.offerings')" name="offerings" label="Offerings" icon="volunteer_activism" no-caps />
        <q-tab v-if="auth.canTab('tab.operations.pledges')" name="pledges" label="Pledges" icon="handshake" no-caps />
        <q-tab v-if="auth.canTab('tab.operations.registration')" name="registration" label="Registration Fees" icon="receipt_long" no-caps />
        <q-tab v-if="auth.canTab('tab.operations.expenses')" name="expenses" label="Expenses" icon="payments" no-caps />
        <q-tab v-if="auth.canTab('tab.operations.vouchers')" name="vouchers" label="Vouchers" icon="description" no-caps />
      </q-tabs>
      <q-separator />

      <q-tab-panels v-model="activeTab" animated>
        <!-- Tithes -->
        <q-tab-panel name="tithes" class="q-pa-none">
          <div class="operations-section-header">
            <h2>Tithes</h2>
            <q-btn
              v-if="auth.canDo('action.operations.add_tithe')"
              dense
              unelevated
              no-caps
              color="primary"
              icon="add"
              label="Add tithe"
              @click="openCashCountDialog('tithe')"
            />
          </div>
          <q-table
            :rows="tithes"
            :columns="cashCountColumns"
            row-key="id"
            flat
            dense
            :pagination="{ rowsPerPage: 10 }"
            class="entity-table"
          >
            <template #body-cell-recordDate="props">
              <q-td :props="props">{{ formatDate(props.row.recordDate) }}</q-td>
            </template>
            <template #body-cell-totalAmount="props">
              <q-td :props="props">{{ formatCurrency(props.row.totalAmount) }}</q-td>
            </template>
            <template #body-cell-actions="props">
              <q-td :props="props" class="entity-table__actions">
                <q-btn flat dense round size="sm" color="grey-7" icon="edit" @click="editCashCount('tithe', props.row)">
                  <q-tooltip>Edit</q-tooltip>
                </q-btn>
                <q-btn flat dense round size="sm" color="grey-7" icon="delete_outline" @click="removeCashCount('tithe', props.row)">
                  <q-tooltip>Delete</q-tooltip>
                </q-btn>
              </q-td>
            </template>
          </q-table>
        </q-tab-panel>

        <!-- Offerings -->
        <q-tab-panel name="offerings" class="q-pa-none">
          <div class="operations-section-header">
            <h2>Offerings</h2>
            <q-btn
              v-if="auth.canDo('action.operations.add_offering')"
              dense
              unelevated
              no-caps
              color="primary"
              icon="add"
              label="Add offering"
              @click="openCashCountDialog('offering')"
            />
          </div>
          <q-table
            :rows="offerings"
            :columns="cashCountColumns"
            row-key="id"
            flat
            dense
            :pagination="{ rowsPerPage: 10 }"
            class="entity-table"
          >
            <template #body-cell-recordDate="props">
              <q-td :props="props">{{ formatDate(props.row.recordDate) }}</q-td>
            </template>
            <template #body-cell-totalAmount="props">
              <q-td :props="props">{{ formatCurrency(props.row.totalAmount) }}</q-td>
            </template>
            <template #body-cell-actions="props">
              <q-td :props="props" class="entity-table__actions">
                <q-btn flat dense round size="sm" color="grey-7" icon="edit" @click="editCashCount('offering', props.row)">
                  <q-tooltip>Edit</q-tooltip>
                </q-btn>
                <q-btn flat dense round size="sm" color="grey-7" icon="delete_outline" @click="removeCashCount('offering', props.row)">
                  <q-tooltip>Delete</q-tooltip>
                </q-btn>
              </q-td>
            </template>
          </q-table>
        </q-tab-panel>

        <!-- Pledges (linked to events) -->
        <q-tab-panel name="pledges" class="q-pa-none">
          <div class="operations-section-header">
            <h2>Event pledges</h2>
            <q-btn dense outline no-caps color="primary" icon="event" label="Manage in events" @click="router.push('/events')" />
          </div>
          <p class="operations-section-note">
            Pledges are managed per event. Use the event dashboard to add, edit, or delete pledges.
          </p>
          <q-table
            :rows="eventPledges"
            :columns="pledgeColumns"
            row-key="id"
            flat
            dense
            :pagination="{ rowsPerPage: 10 }"
            class="entity-table"
          >
            <template #body-cell-eventName="props">
              <q-td :props="props">
                <button type="button" class="entity-table__link" @click="router.push(`/events/${props.row.eventId}`)">
                  {{ props.row.eventName }}
                </button>
              </q-td>
            </template>
            <template #body-cell-amount="props">
              <q-td :props="props">{{ formatCurrency(props.row.amount) }}</q-td>
            </template>
            <template #body-cell-paid="props">
              <q-td :props="props">
                <q-badge :color="props.row.paid ? 'positive' : 'warning'" :label="props.row.paid ? 'Paid' : 'Pending'" />
              </q-td>
            </template>
            <template #body-cell-actions="props">
              <q-td :props="props" class="entity-table__actions">
                <q-btn flat dense round size="sm" color="grey-7" icon="open_in_new" @click="router.push(`/events/${props.row.eventId}`)">
                  <q-tooltip>View event</q-tooltip>
                </q-btn>
              </q-td>
            </template>
          </q-table>
        </q-tab-panel>

        <!-- Registration Fees -->
        <q-tab-panel name="registration" class="q-pa-none">
          <div class="operations-section-header">
            <h2>Registration fees</h2>
            <q-btn dense outline no-caps color="primary" icon="event" label="Manage in events" @click="router.push('/events')" />
          </div>
          <p class="operations-section-note">
            Registration fees are collected through event participant payments. Manage them from each event dashboard.
          </p>
          <q-table
            :rows="registrationFees"
            :columns="registrationColumns"
            row-key="id"
            flat
            dense
            :pagination="{ rowsPerPage: 10 }"
            class="entity-table"
          >
            <template #body-cell-eventName="props">
              <q-td :props="props">
                <button type="button" class="entity-table__link" @click="router.push(`/events/${props.row.eventId}`)">
                  {{ props.row.eventName }}
                </button>
              </q-td>
            </template>
            <template #body-cell-amount="props">
              <q-td :props="props">{{ formatCurrency(props.row.amount) }}</q-td>
            </template>
            <template #body-cell-paidAt="props">
              <q-td :props="props">{{ formatDateTime(props.row.paidAt) }}</q-td>
            </template>
            <template #body-cell-actions="props">
              <q-td :props="props" class="entity-table__actions">
                <q-btn flat dense round size="sm" color="grey-7" icon="open_in_new" @click="router.push(`/events/${props.row.eventId}`)">
                  <q-tooltip>View event</q-tooltip>
                </q-btn>
              </q-td>
            </template>
          </q-table>
        </q-tab-panel>

        <!-- Expenses -->
        <q-tab-panel name="expenses" class="q-pa-none">
          <div class="operations-section-header">
            <h2>Expenses</h2>
            <q-btn
              v-if="auth.canDo('action.operations.add_expense')"
              dense
              unelevated
              no-caps
              color="primary"
              icon="add"
              label="Add expense"
              @click="openExpenseDialog"
            />
          </div>
          <q-table
            :rows="expenses"
            :columns="expenseColumns"
            row-key="id"
            flat
            dense
            :pagination="{ rowsPerPage: 10 }"
            class="entity-table"
          >
            <template #body-cell-expenseDate="props">
              <q-td :props="props">{{ formatDate(props.row.expenseDate) }}</q-td>
            </template>
            <template #body-cell-amount="props">
              <q-td :props="props">{{ formatCurrency(props.row.amount) }}</q-td>
            </template>
            <template #body-cell-actions="props">
              <q-td :props="props" class="entity-table__actions">
                <q-btn flat dense round size="sm" color="grey-7" icon="edit" @click="editExpense(props.row)">
                  <q-tooltip>Edit</q-tooltip>
                </q-btn>
                <q-btn flat dense round size="sm" color="grey-7" icon="delete_outline" @click="removeExpense(props.row)">
                  <q-tooltip>Delete</q-tooltip>
                </q-btn>
              </q-td>
            </template>
          </q-table>
        </q-tab-panel>

        <!-- Vouchers -->
        <q-tab-panel name="vouchers" class="q-pa-none">
          <div class="operations-section-header">
            <h2>Vouchers</h2>
            <q-btn
              v-if="auth.canDo('action.operations.add_voucher')"
              dense
              unelevated
              no-caps
              color="primary"
              icon="add"
              label="Add voucher"
              @click="openVoucherDialog"
            />
          </div>
          <q-table
            :rows="vouchers"
            :columns="voucherColumns"
            row-key="id"
            flat
            dense
            :pagination="{ rowsPerPage: 10 }"
            class="entity-table"
          >
            <template #body-cell-voucherDate="props">
              <q-td :props="props">{{ formatDate(props.row.voucherDate) }}</q-td>
            </template>
            <template #body-cell-amount="props">
              <q-td :props="props">{{ formatCurrency(props.row.amount) }}</q-td>
            </template>
            <template #body-cell-status="props">
              <q-td :props="props">
                <q-badge :color="voucherStatusColor(props.row.status)" :label="props.row.status" />
              </q-td>
            </template>
            <template #body-cell-actions="props">
              <q-td :props="props" class="entity-table__actions">
                <q-btn flat dense round size="sm" color="grey-7" icon="edit" @click="editVoucher(props.row)">
                  <q-tooltip>Edit</q-tooltip>
                </q-btn>
                <q-btn flat dense round size="sm" color="grey-7" icon="delete_outline" @click="removeVoucher(props.row)">
                  <q-tooltip>Delete</q-tooltip>
                </q-btn>
              </q-td>
            </template>
          </q-table>
        </q-tab-panel>
      </q-tab-panels>
    </section>

    <CashCountFormDialog
      v-model="cashCountDialogOpen"
      :mode="cashCountMode"
      :record-type="cashCountType"
      :record-id="editingCashCountId"
      :record="editingCashCount"
      @saved="onCashCountSaved"
    />

    <ExpenseFormDialog
      v-model="expenseDialogOpen"
      :mode="expenseMode"
      :expense-id="editingExpenseId"
      :expense="editingExpense"
      @saved="onExpenseSaved"
    />

    <VoucherFormDialog
      v-model="voucherDialogOpen"
      :mode="voucherMode"
      :voucher-id="editingVoucherId"
      :voucher="editingVoucher"
      @saved="onVoucherSaved"
    />
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useQuasar } from "quasar";
import { api } from "src/boot/axios";
import { useAuthStore } from "src/stores/auth";
import CashCountFormDialog from "src/components/CashCountFormDialog.vue";
import ExpenseFormDialog from "src/components/ExpenseFormDialog.vue";
import VoucherFormDialog from "src/components/VoucherFormDialog.vue";

const $q = useQuasar();
const router = useRouter();
const auth = useAuthStore();

const OPERATION_TABS = [
  { name: "tithes", key: "tab.operations.tithes" },
  { name: "offerings", key: "tab.operations.offerings" },
  { name: "pledges", key: "tab.operations.pledges" },
  { name: "registration", key: "tab.operations.registration" },
  { name: "expenses", key: "tab.operations.expenses" },
  { name: "vouchers", key: "tab.operations.vouchers" }
];

const allowedTabs = computed(() => OPERATION_TABS.filter((t) => auth.canTab(t.key)).map((t) => t.name));
const activeTab = ref("tithes");

watch(
  allowedTabs,
  (tabs) => {
    if (!tabs.length) return;
    if (!tabs.includes(activeTab.value)) activeTab.value = tabs[0];
  },
  { immediate: true }
);

const loading = ref(false);
const summary = ref({
  tithesTotal: 0,
  offeringsTotal: 0,
  expensesTotal: 0,
  pledgesPaid: 0,
  registrationTotal: 0,
  netBalance: 0
});

const tithes = ref([]);
const offerings = ref([]);
const eventPledges = ref([]);
const registrationFees = ref([]);
const expenses = ref([]);
const vouchers = ref([]);

const cashCountDialogOpen = ref(false);
const cashCountMode = ref("create");
const cashCountType = ref("tithe");
const editingCashCountId = ref(null);
const editingCashCount = ref(null);

const expenseDialogOpen = ref(false);
const expenseMode = ref("create");
const editingExpenseId = ref(null);
const editingExpense = ref(null);

const voucherDialogOpen = ref(false);
const voucherMode = ref("create");
const editingVoucherId = ref(null);
const editingVoucher = ref(null);

const cashCountColumns = [
  { name: "recordDate", label: "Date", field: "recordDate", align: "left", sortable: true },
  { name: "totalAmount", label: "Total", field: "totalAmount", align: "right", sortable: true },
  { name: "countedBy", label: "Counted by", field: "countedBy", align: "left" },
  { name: "checkedBy", label: "Checked by", field: "checkedBy", align: "left" },
  { name: "remarks", label: "Remarks", field: "remarks", align: "left" },
  { name: "actions", label: "", field: "actions", align: "right" }
];

const pledgeColumns = [
  { name: "eventName", label: "Event", field: "eventName", align: "left", sortable: true },
  { name: "pledgerName", label: "Pledger", field: "pledgerName", align: "left", sortable: true },
  { name: "email", label: "Email", field: "email", align: "left" },
  { name: "amount", label: "Amount", field: "amount", align: "right", sortable: true },
  { name: "paid", label: "Status", field: "paid", align: "left" },
  { name: "actions", label: "", field: "actions", align: "right" }
];

const registrationColumns = [
  { name: "eventName", label: "Event", field: "eventName", align: "left", sortable: true },
  { name: "participantName", label: "Participant", field: "participantName", align: "left", sortable: true },
  { name: "email", label: "Email", field: "email", align: "left" },
  { name: "amount", label: "Amount", field: "amount", align: "right", sortable: true },
  { name: "paidAt", label: "Paid at", field: "paidAt", align: "left" },
  { name: "actions", label: "", field: "actions", align: "right" }
];

const expenseColumns = [
  { name: "expenseDate", label: "Date", field: "expenseDate", align: "left", sortable: true },
  { name: "category", label: "Category", field: "category", align: "left", sortable: true },
  { name: "payee", label: "Payee", field: "payee", align: "left" },
  { name: "amount", label: "Amount", field: "amount", align: "right", sortable: true },
  { name: "approvedBy", label: "Approved by", field: "approvedBy", align: "left" },
  { name: "actions", label: "", field: "actions", align: "right" }
];

const voucherColumns = [
  { name: "voucherNo", label: "Voucher no.", field: "voucherNo", align: "left", sortable: true },
  { name: "voucherDate", label: "Date", field: "voucherDate", align: "left", sortable: true },
  { name: "payee", label: "Payee", field: "payee", align: "left" },
  { name: "amount", label: "Amount", field: "amount", align: "right", sortable: true },
  { name: "status", label: "Status", field: "status", align: "left" },
  { name: "actions", label: "", field: "actions", align: "right" }
];

function formatCurrency(value) {
  return new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" }).format(value || 0);
}

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString();
}

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString();
}

function voucherStatusColor(status) {
  const map = { draft: "grey", approved: "blue", paid: "positive", cancelled: "negative" };
  return map[status] || "grey";
}

function openCashCountDialog(type) {
  cashCountType.value = type;
  cashCountMode.value = "create";
  editingCashCountId.value = null;
  editingCashCount.value = null;
  cashCountDialogOpen.value = true;
}

function editCashCount(type, row) {
  cashCountType.value = type;
  cashCountMode.value = "edit";
  editingCashCountId.value = row.id;
  editingCashCount.value = row;
  cashCountDialogOpen.value = true;
}

function removeCashCount(type, row) {
  const label = type === "tithe" ? "tithe" : "offering";
  $q.dialog({
    title: `Delete ${label}`,
    message: `Delete this ${label} record from ${formatDate(row.recordDate)}?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    await api.delete(`/operations/${type}s/${row.id}`);
    $q.notify({ type: "positive", message: "Record deleted." });
    loadData();
  });
}

function openExpenseDialog() {
  expenseMode.value = "create";
  editingExpenseId.value = null;
  editingExpense.value = null;
  expenseDialogOpen.value = true;
}

function editExpense(row) {
  expenseMode.value = "edit";
  editingExpenseId.value = row.id;
  editingExpense.value = row;
  expenseDialogOpen.value = true;
}

function removeExpense(row) {
  $q.dialog({
    title: "Delete expense",
    message: `Delete expense for ${row.payee}?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    await api.delete(`/operations/expenses/${row.id}`);
    $q.notify({ type: "positive", message: "Expense deleted." });
    loadData();
  });
}

function openVoucherDialog() {
  voucherMode.value = "create";
  editingVoucherId.value = null;
  editingVoucher.value = null;
  voucherDialogOpen.value = true;
}

function editVoucher(row) {
  voucherMode.value = "edit";
  editingVoucherId.value = row.id;
  editingVoucher.value = row;
  voucherDialogOpen.value = true;
}

function removeVoucher(row) {
  $q.dialog({
    title: "Delete voucher",
    message: `Delete voucher ${row.voucherNo}?`,
    cancel: true,
    persistent: true
  }).onOk(async () => {
    await api.delete(`/operations/vouchers/${row.id}`);
    $q.notify({ type: "positive", message: "Voucher deleted." });
    loadData();
  });
}

function onCashCountSaved() {
  loadData();
}

function onExpenseSaved() {
  loadData();
}

function onVoucherSaved() {
  loadData();
}

async function loadData() {
  loading.value = true;
  try {
    const [summaryRes, tithesRes, offeringsRes, pledgesRes, registrationRes, expensesRes, vouchersRes] = await Promise.all([
      api.get("/operations/summary"),
      api.get("/operations/tithes"),
      api.get("/operations/offerings"),
      api.get("/operations/event-pledges"),
      api.get("/operations/registration-fees"),
      api.get("/operations/expenses"),
      api.get("/operations/vouchers")
    ]);
    summary.value = summaryRes.data;
    tithes.value = tithesRes.data;
    offerings.value = offeringsRes.data;
    eventPledges.value = pledgesRes.data;
    registrationFees.value = registrationRes.data;
    expenses.value = expensesRes.data;
    vouchers.value = vouchersRes.data;
  } catch {
    $q.notify({ type: "negative", message: "Failed to load operations data." });
  } finally {
    loading.value = false;
  }
}

onMounted(loadData);
</script>

<style scoped lang="scss">
.operations-stats {
  margin-top: 4px;
}

.operations-stat-card {
  background: #fff;
  border: 1px solid #e4e8ef;
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-height: 64px;
}

.operations-stat-card__label {
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #8b93a1;
}

.operations-stat-card__value {
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a2e;

  &--expense {
    color: #c62828;
  }
}

.operations-tabs {
  padding: 0 8px;
}

.operations-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid #eef1f6;

  h2 {
    margin: 0;
    font-size: 0.85rem;
    font-weight: 600;
    color: #1a1a2e;
  }
}

.operations-section-note {
  margin: 0;
  padding: 10px 12px;
  font-size: 0.82rem;
  color: #8b93a1;
  border-bottom: 1px solid #eef1f6;
}
</style>
