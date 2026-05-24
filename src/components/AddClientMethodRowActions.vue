<template>
  <div class="add-client-form__field-action">
    <q-btn
      v-if="showRemove"
      outline
      no-caps
      color="primary"
      icon="remove"
      class="add-client-form__method-btn"
      :aria-label="removeLabel"
      @click="emit('remove')"
    />
    <q-btn
      v-if="showAdd"
      outline
      no-caps
      color="primary"
      icon="add"
      class="add-client-form__method-btn"
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
})

const emit = defineEmits(['add', 'remove'])

const showRemove = computed(() => props.total > 1)

const showAdd = computed(() => props.isLast)
</script>
