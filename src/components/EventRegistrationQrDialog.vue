<template>
  <q-dialog :model-value="modelValue" @update:model-value="$emit('update:modelValue', $event)">
    <q-card class="entity-dialog">
      <header class="entity-dialog__header">
        <div>
          <h2 class="entity-dialog__title">Registration QR</h2>
          <p class="entity-dialog__subtitle">{{ event?.name || "Scan to register" }}</p>
        </div>
        <q-btn flat round dense icon="close" color="grey-7" @click="close" />
      </header>

      <q-separator />

      <q-card-section class="entity-dialog__body">
        <EventRegistrationQrCard
          v-if="eventId"
          :event-id="eventId"
          :event="event"
          :size="260"
        />
      </q-card-section>

      <q-separator />

      <footer class="entity-dialog__footer">
        <q-btn flat no-caps label="Close" color="grey-8" @click="close" />
      </footer>
    </q-card>
  </q-dialog>
</template>

<script setup>
import EventRegistrationQrCard from "src/components/EventRegistrationQrCard.vue";

defineProps({
  modelValue: { type: Boolean, default: false },
  eventId: { type: [String, Number], default: null },
  event: { type: Object, default: null }
});

const emit = defineEmits(["update:modelValue"]);

function close() {
  emit("update:modelValue", false);
}
</script>
