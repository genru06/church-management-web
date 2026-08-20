<template>
  <q-btn-toggle
    v-if="sessions.length > 1"
    :model-value="modelValue"
    no-caps
    unelevated
    dense
    toggle-color="primary"
    color="white"
    text-color="grey-8"
    :options="options"
    class="event-day-selector"
    @update:model-value="$emit('update:modelValue', $event)"
  />
</template>

<script setup>
import { computed } from "vue";
import { formatSessionOption } from "src/utils/eventDates";

const props = defineProps({
  modelValue: { type: [String, Number], default: null },
  sessions: { type: Array, default: () => [] }
});

defineEmits(["update:modelValue"]);

const options = computed(() =>
  (props.sessions || []).map((session) => ({
    label: formatSessionOption(session),
    value: session.id
  }))
);
</script>

<style scoped lang="scss">
.event-day-selector {
  flex-wrap: wrap;
  border: 1px solid #e4e8ef;
  border-radius: 6px;

  :deep(.q-btn) {
    min-height: 30px;
    padding: 0 10px;
    font-size: 0.75rem;
  }
}
</style>
