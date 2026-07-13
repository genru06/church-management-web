import { computed, ref, unref, watch } from "vue";

export const SEARCHABLE_SELECT_MIN_OPTIONS = 10;

export function optionLabel(option) {
  if (option == null) return "";
  if (typeof option === "string" || typeof option === "number") return String(option);
  return String(option.label ?? option.name ?? "");
}

export function isSearchableSelect(options) {
  return Array.isArray(options) && options.length > SEARCHABLE_SELECT_MIN_OPTIONS;
}

export function filterSelectOptions(allOptionsSource, displayedOptionsRef, val, update) {
  update(() => {
    const all = unref(allOptionsSource) ?? [];
    if (!val) {
      displayedOptionsRef.value = all;
      return;
    }
    const needle = val.toLowerCase();
    displayedOptionsRef.value = all.filter((opt) =>
      optionLabel(opt).toLowerCase().includes(needle)
    );
  });
}

export function useSearchableSelect(allOptionsSource) {
  const displayedOptions = ref([]);

  const searchable = computed(() => isSearchableSelect(unref(allOptionsSource)));

  watch(
    allOptionsSource,
    (opts) => {
      displayedOptions.value = opts ?? [];
    },
    { immediate: true }
  );

  function onFilter(val, update) {
    if (!searchable.value) {
      update(() => {});
      return;
    }
    filterSelectOptions(allOptionsSource, displayedOptions, val, update);
  }

  function resetDisplayedOptions() {
    displayedOptions.value = unref(allOptionsSource) ?? [];
  }

  return { displayedOptions, searchable, onFilter, resetDisplayedOptions };
}
