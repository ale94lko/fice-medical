<template>
  <q-dialog
    v-model="open"
    persistent
    transition-show="scale"
    transition-hide="scale">
    <q-card
      class="insurance-dialog app-dialog-card
        encounter-clinical-all-records-dialog">
      <AppDialogHeader
        :close-label="t('close')"
        @close="open = false">
        {{ title }}
      </AppDialogHeader>

      <q-card-section
        class="app-dialog-card__body q-px-lg q-pt-md q-pb-md">
        <p
          v-if="hint"
          class="text-body2 text-grey-7 q-mb-md">
          {{ hint }}
        </p>

        <div
          v-if="loading"
          class="row flex-center q-pa-xl">
          <AppBrandLoading inline />
        </div>

        <p
          v-else-if="error"
          class="text-body2 text-negative q-mb-none">
          {{ error }}
        </p>

        <AdminTablePanel
          v-else
          class="admin-table-panel--wide"
          :show-column-settings="false">
          <slot />
        </AdminTablePanel>
      </q-card-section>

      <q-card-actions align="right" class="app-dialog-card__actions">
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          :label="t('close')"
          @click="open = false"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminTablePanel from 'components/admin-table/AdminTablePanel.vue'
import AppBrandLoading from 'components/AppBrandLoading.vue'
import AppDialogHeader from 'components/AppDialogHeader.vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    required: true,
  },
  hint: {
    type: String,
    default: '',
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])
const { t } = useI18n()

const open = computed({
  get: () => props.modelValue,
  set: value => emit('update:modelValue', value),
})
</script>
