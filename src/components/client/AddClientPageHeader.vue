<template>
  <header class="add-client-page__header">
    <ClientProfilePhotoField
      :file-id="photoFileId"
      :client-id="clientId"
      :disabled="photoDisabled"
      @update:file-id="emit('update:photoFileId', $event)"
    />
    <div class="add-client-page__intro">
      <h1 class="add-client-page__title">
        {{ title }}
      </h1>
      <p class="add-client-page__subtitle">
        {{ subtitle }}
      </p>
      <q-breadcrumbs class="add-client-page__breadcrumbs" gutter="xs">
        <q-breadcrumbs-el
          :label="t('clients')"
          to="/clients"
          :data-testid="clientPageTestIds.breadcrumbClients"
        />
        <q-breadcrumbs-el :label="breadcrumbCurrent" />
        <q-breadcrumbs-el
          v-if="activeTabLabel"
          :label="activeTabLabel"
        />
      </q-breadcrumbs>
    </div>
    <slot name="banner" />
    <div class="add-client-page__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import ClientProfilePhotoField from 'components/ClientProfilePhotoField.vue'
import { clientPageTestIds } from 'src/test-ids/index.js'

defineProps({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    default: '',
  },
  breadcrumbCurrent: {
    type: String,
    required: true,
  },
  activeTabLabel: {
    type: String,
    default: '',
  },
  photoFileId: {
    type: [Number, String],
    default: null,
  },
  clientId: {
    type: [String, Number],
    default: null,
  },
  photoDisabled: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:photoFileId'])

const { t } = useI18n()
</script>
