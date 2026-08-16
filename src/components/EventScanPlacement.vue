<template>
  <div v-if="placement" class="event-scan-placement">
    <q-icon :name="placement.icon" size="20px" color="primary" />
    <div class="event-scan-placement__text">
      <div class="event-scan-placement__kind">{{ placement.kindLabel }}</div>
      <div v-if="placement.kind !== 'unassigned'" class="event-scan-placement__label">
        {{ placement.label }}
      </div>
      <div v-else-if="placement.tags.length" class="event-scan-placement__tags">
        <q-badge
          v-for="tag in placement.tags"
          :key="tag"
          outline
          color="grey-7"
          :label="tag"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  placement: { type: Object, default: null }
});
</script>

<style scoped lang="scss">
.event-scan-placement {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 8px;
  margin: 8px auto 10px;
  max-width: 280px;
  text-align: left;
}

.event-scan-placement__text {
  min-width: 0;
}

.event-scan-placement__kind {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #6b7280;
}

.event-scan-placement__label {
  margin-top: 1px;
  font-size: 0.9rem;
  font-weight: 600;
  color: #111827;
  line-height: 1.25;
}

.event-scan-placement__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 4px;
}
</style>
