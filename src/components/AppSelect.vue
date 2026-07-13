<template>
  <q-select
    v-bind="$attrs"
    :options="displayedOptions"
    :use-input="isInputEnabled"
    :input-debounce="isInputEnabled ? inputDebounce : undefined"
    @filter="handleFilter"
  >
    <template v-for="(_, slot) in $slots" #[slot]="scope">
      <slot :name="slot" v-bind="scope || {}" />
    </template>
  </q-select>
</template>

<script setup>
import { computed, toRef } from "vue";
import { useSearchableSelect } from "src/utils/searchableSelect";

const props = defineProps({
  options: { type: Array, default: () => [] },
  alwaysSearchable: { type: Boolean, default: false },
  inputDebounce: { type: [Number, String], default: 0 }
});

defineOptions({ inheritAttrs: false });

const emit = defineEmits(["filter"]);

const optionsRef = toRef(props, "options");
const { displayedOptions, searchable, onFilter } = useSearchableSelect(optionsRef);

const isInputEnabled = computed(() => props.alwaysSearchable || searchable.value);

function handleFilter(val, update) {
  if (props.alwaysSearchable) {
    emit("filter", val, update);
    return;
  }
  onFilter(val, update);
}
</script>
