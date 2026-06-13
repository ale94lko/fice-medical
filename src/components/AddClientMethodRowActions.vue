<template>
  <div class="field-action">
    <q-btn
      v-if="showRemove"
      outline
      no-caps
      color="primary"
      icon="remove"
      class="method-btn"
      :data-testid="removeTestId || undefined"
      :aria-label="removeLabel"
      @click="emit('remove')"
    />
    <q-btn
      v-if="showAdd"
      outline
      no-caps
      color="primary"
      icon="add"
      class="method-btn"
      :data-testid="addTestId || undefined"
      :aria-label="addLabel"
      @click="emit('add')"
    />
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  isLast: {
    type: Boolean,
    required: true,
  },
  total: {
    type: Number,
    required: true,
  },
  addLabel: {
    type: String,
    default: 'Add',
  },
  removeLabel: {
    type: String,
    default: 'Remove',
  },
  addTestId: {
    type: String,
    default: '',
  },
  removeTestId: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['add', 'remove'])

const showRemove = computed(() => props.total > 1)

const showAdd = computed(() => props.isLast)
</script>
