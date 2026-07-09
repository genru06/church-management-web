<template>
  <q-page class="member-profile">
    <div class="member-profile__wrap">
      <q-inner-loading :showing="loading">
        <q-spinner size="28px" color="primary" />
      </q-inner-loading>

      <header class="member-profile__header">
        <div class="member-profile__identity">
          <q-avatar class="member-profile__avatar" color="grey-3" text-color="grey-8" font-size="1rem">
            {{ initials }}
          </q-avatar>
          <div>
            <h1 class="member-profile__name">{{ fullName }}</h1>
            <p class="member-profile__meta">
              <span v-if="member.city">{{ member.city }}</span>
              <span v-if="member.email">{{ member.city ? " · " : "" }}{{ member.email }}</span>
            </p>
          </div>
        </div>
        <div class="member-profile__actions">
          <q-btn dense flat no-caps color="grey-8" icon="arrow_back" label="Back" to="/members" />
          <q-btn dense unelevated no-caps color="primary" icon="edit" label="Edit" @click="openEditDialog" />
        </div>
      </header>

      <section class="member-profile__panel">
        <div v-if="member.tags?.length" class="member-profile__tags">
          <span v-for="tag in member.tags" :key="tag" class="member-profile__tag">{{ tag }}</span>
        </div>

        <dl class="member-profile__grid">
          <div v-for="item in profileItems" :key="item.label" class="member-profile__row">
            <dt>{{ item.label }}</dt>
            <dd>{{ item.value }}</dd>
          </div>
        </dl>
      </section>
    </div>

    <MemberFormDialog
      v-model="formDialogOpen"
      mode="edit"
      :member-id="id"
      @saved="onMemberSaved"
    />
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { api } from "src/boot/axios";
import MemberFormDialog from "src/components/MemberFormDialog.vue";

const props = defineProps({ id: { type: [String, Number], required: true } });
const router = useRouter();
const member = ref({});
const loading = ref(false);
const formDialogOpen = ref(false);

const fullName = computed(() => {
  const { firstName, lastName } = member.value;
  if (firstName || lastName) return [firstName, lastName].filter(Boolean).join(" ");
  return "Member";
});

const initials = computed(() => {
  const first = member.value.firstName?.[0] || "";
  const last = member.value.lastName?.[0] || "";
  return (first + last).toUpperCase() || "?";
});

const completeAddress = computed(() =>
  [member.value.address, member.value.barangay, member.value.city, member.value.country, member.value.zip]
    .filter(Boolean)
    .join(", ")
);

function formatDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function display(value) {
  return value || "—";
}

const profileItems = computed(() => {
  const items = [
    { label: "Email", value: display(member.value.email) },
    { label: "Phone", value: display(member.value.phone) },
    { label: "Address", value: display(completeAddress.value) },
    { label: "Birthdate", value: display(formatDate(member.value.dateOfBirth)) },
    { label: "Gender", value: display(member.value.gender) },
    { label: "Marital status", value: display(member.value.maritalStatus) },
    { label: "Nationality", value: display(member.value.nationality) },
    { label: "Church", value: display(member.value.church) },
    { label: "City", value: display(member.value.city) },
    { label: "Barangay", value: display(member.value.barangay) },
    { label: "ZIP", value: display(member.value.zip) },
    { label: "Country", value: display(member.value.country) }
  ];
  return items;
});

function openEditDialog() {
  formDialogOpen.value = true;
}

function onMemberSaved(data) {
  member.value = data;
}

onMounted(async () => {
  loading.value = true;
  try {
    const { data } = await api.get(`/members/${props.id}`);
    member.value = data;
  } catch {
    router.push("/members");
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped lang="scss">
.member-profile {
  padding: 12px 16px 20px;
  display: flex;
  justify-content: center;
}

.member-profile__wrap {
  position: relative;
  width: 100%;
  max-width: 560px;
}

.member-profile__header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
}

.member-profile__identity {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.member-profile__avatar {
  width: 44px !important;
  height: 44px !important;
  flex-shrink: 0;
  font-weight: 600;
}

.member-profile__name {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  line-height: 1.25;
  color: #1a1a2e;
}

.member-profile__meta {
  margin: 2px 0 0;
  font-size: 0.78rem;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.member-profile__actions {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.member-profile__panel {
  background: #fff;
  border: 1px solid #e4e8ef;
  border-radius: 8px;
  padding: 12px 14px;
}

.member-profile__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 10px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eef1f6;
}

.member-profile__tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 10px;
  background: #eef1f6;
  color: #5c6370;
  font-size: 0.72rem;
  font-weight: 500;
}

.member-profile__grid {
  margin: 0;
  display: grid;
  gap: 0;
}

.member-profile__row {
  display: grid;
  grid-template-columns: 110px 1fr;
  gap: 12px;
  padding: 7px 0;
  border-bottom: 1px solid #f3f5f8;
  font-size: 0.82rem;

  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }

  &:first-child {
    padding-top: 0;
  }

  dt {
    color: #8b93a1;
    font-weight: 500;
  }

  dd {
    margin: 0;
    color: #2d3340;
    word-break: break-word;
  }
}

@media (max-width: 480px) {
  .member-profile__row {
    grid-template-columns: 1fr;
    gap: 2px;
    padding: 8px 0;
  }
}
</style>
