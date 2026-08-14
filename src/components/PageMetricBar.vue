<template>
  <div class="page-metric-bar" :class="{ 'page-metric-bar--compact': compact }">
    <div class="page-metric-bar__stat">
      <q-icon v-if="!compact" name="groups" size="15px" color="grey-7" />
      <span class="page-metric-bar__value">{{ formatCount(total) }}</span>
      <span class="page-metric-bar__label">Total</span>
    </div>
    <div class="page-metric-bar__stat page-metric-bar__stat--adults">
      <q-icon v-if="!compact" name="person" size="15px" color="primary" />
      <span class="page-metric-bar__value">{{ formatCount(adults) }}</span>
      <span class="page-metric-bar__label">Adults</span>
    </div>
    <div class="page-metric-bar__stat page-metric-bar__stat--kids">
      <q-icon v-if="!compact" name="child_care" size="15px" color="orange-8" />
      <span class="page-metric-bar__value">{{ formatCount(kids) }}</span>
      <span class="page-metric-bar__label">Kids</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  total: { type: Number, default: 0 },
  adults: { type: Number, default: 0 },
  kids: { type: Number, default: 0 },
  compact: { type: Boolean, default: false }
});

function formatCount(value) {
  return Number(value || 0).toLocaleString();
}
</script>

<style scoped lang="scss">
.page-metric-bar {
  display: inline-flex;
  align-items: stretch;
  max-width: 100%;
  background: #fff;
  border: 1px solid #e4e8ef;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(26, 26, 46, 0.04);
  overflow: hidden;
}

.page-metric-bar__stat {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-height: 30px;
  padding: 0 11px;
  border-right: 1px solid #eef1f6;
  white-space: nowrap;

  &:last-child {
    border-right: none;
  }
}

.page-metric-bar__value {
  font-size: 0.82rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.02em;
  color: #1a1a2e;
  line-height: 1;
}

.page-metric-bar__label {
  font-size: 0.62rem;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: #8b93a1;
  line-height: 1;
}

.page-metric-bar__stat--adults .page-metric-bar__label {
  color: #5b82c4;
}

.page-metric-bar__stat--kids .page-metric-bar__label {
  color: #d97706;
}

.page-metric-bar--compact {
  display: flex;
  width: 100%;
  box-shadow: none;

  .page-metric-bar__stat {
    flex: 1 1 0;
    min-width: 0;
    min-height: 44px;
    flex-direction: column;
    justify-content: center;
    gap: 3px;
    padding: 6px 4px;
  }

  .page-metric-bar__value {
    font-size: 0.92rem;
  }

  .page-metric-bar__label {
    font-size: 0.58rem;
  }
}
</style>
