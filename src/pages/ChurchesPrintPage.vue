<template>
  <q-page class="flex flex-center">
    <q-spinner size="36px" color="primary" />
  </q-page>
</template>

<script setup>
import { onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { getMembersPrintUrl } from "src/utils/memberPrint";

const props = defineProps({
  networkOnly: { type: Boolean, default: false }
});

const route = useRoute();
const router = useRouter();

onMounted(() => {
  const churchId = Array.isArray(route.query.churchId)
    ? route.query.churchId[0]
    : route.query.churchId;

  router.replace(
    getMembersPrintUrl({
      networkOnly: props.networkOnly,
      churchId: churchId || null,
      groupByChurch: !churchId
    })
  );
});
</script>
