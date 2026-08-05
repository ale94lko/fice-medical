<template>
  <section class="client-overview-header client-overview-alt-header
    staff-profile-header">
    <div class="client-overview-header__layout
      client-overview-alt-header__layout">
      <div class="client-overview-header__main">
        <div class="client-overview-header__profile-head">
          <div class="client-overview-header__avatar-wrap">
            <div class="client-overview-header__avatar-block">
              <div
                class="client-overview-header__avatar
                  client-overview-alt-header__avatar"
                role="img"
                :aria-label="t('staffProfilePhotoPlaceholder')">
                <StoredFileAvatar
                  :file-id="header.photoFileId"
                  spinner-size="32px"
                />
              </div>
              <span
                v-if="header.statusLabel"
                class="client-overview-header__status-badge">
                {{ header.statusLabel }}
              </span>
            </div>
          </div>

          <div class="client-overview-header__profile-body">
            <h2 class="client-overview-header__name
              client-overview-alt-header__name">
              {{ header.fullName }}
            </h2>

            <div
              class="client-overview-header__meta-row
                client-overview-header__meta-row--client-actions">
              <div
                class="client-overview-header__meta-cell
                  client-overview-header__meta-cell--client-number">
                <span class="client-overview-header__meta-label">
                  {{ t('staffListColStaffNo') }}
                </span>
                <div class="client-overview-header__meta-value-row">
                  <span
                    v-if="header.staffNo"
                    class="client-overview-header__client-number-badge">
                    <span class="client-overview-header__client-number-text">
                      {{ header.staffNo }}
                    </span>
                    <q-btn
                      flat
                      dense
                      round
                      size="xs"
                      icon="content_copy"
                      class="client-overview-header__copy-btn"
                      :aria-label="t('staffProfileCopyStaffNo')"
                      @click="copyStaffNo"
                    />
                  </span>
                  <strong
                    v-else
                    class="client-overview-header__meta-value">
                    —
                  </strong>
                </div>
              </div>

              <div
                class="client-overview-header__meta-divider"
                aria-hidden="true"
              />

              <div class="client-overview-header__meta-cell">
                <span class="client-overview-header__meta-label">
                  {{ t('dob') }}
                </span>
                <strong class="client-overview-header__meta-value">
                  {{ header.dob || '—' }}
                </strong>
              </div>

              <div
                class="client-overview-header__meta-divider
                  client-overview-header__meta-divider--compact"
                aria-hidden="true"
              />

              <div class="client-overview-header__meta-cell">
                <span class="client-overview-header__meta-label">
                  {{ t('gender') }}
                </span>
                <strong class="client-overview-header__meta-value">
                  {{ header.sexLabel || '—' }}
                </strong>
              </div>

              <div
                class="client-overview-header__meta-divider"
                aria-hidden="true"
              />

              <div class="client-overview-header__meta-cell">
                <span class="client-overview-header__meta-label">
                  {{ t('staffListColPosition') }}
                </span>
                <strong class="client-overview-header__meta-value">
                  {{ header.position || '—' }}
                </strong>
              </div>

              <div
                class="client-overview-header__meta-divider"
                aria-hidden="true"
              />

              <div class="client-overview-header__meta-cell">
                <span class="client-overview-header__meta-label">
                  {{ t('staffListColHireDate') }}
                </span>
                <strong class="client-overview-header__meta-value">
                  {{ header.hireDate || '—' }}
                </strong>
              </div>

              <div
                class="client-overview-header__meta-divider"
                aria-hidden="true"
              />

              <div class="client-overview-header__meta-cell">
                <span class="client-overview-header__meta-label">
                  {{ t('staffListColClinician') }}
                </span>
                <strong class="client-overview-header__meta-value">
                  {{ header.clinicianLabel || '—' }}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="client-overview-alt-header__actions">
        <q-btn
          v-if="canEdit"
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          icon="edit"
          :disable="loading"
          :label="t('edit')"
          @click="emit('edit')"
        />
        <GenerateDocumentAction
          v-if="staffId"
          :document-type="documentTypes.staffProfile"
          :context="{ staffId }"
          :label="t('generateDocumentAction')"
          button-class="app-btn-outline"
        />
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          :disable="loading"
          :label="t('close')"
          @click="emit('close')"
        />
      </div>
    </div>
  </section>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useQuasar, copyToClipboard } from 'quasar'
import { quasarNotifyTypes } from 'components/constants.js'
import StoredFileAvatar from 'components/StoredFileAvatar.vue'
import GenerateDocumentAction from
  'components/documents/GenerateDocumentAction.vue'
import { documentTypes } from 'src/utils/document-generation-constants.js'

const props = defineProps({
  staffId: {
    type: [String, Number],
    default: null,
  },
  header: {
    type: Object,
    required: true,
  },
  canEdit: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['edit', 'close'])

const { t } = useI18n()
const $q = useQuasar()

function copyStaffNo() {
  copyToClipboard(props.header.staffNo)
    .then(() => {
      $q.notify({
        type: quasarNotifyTypes.positive,
        message: t('staffProfileCopiedStaffNo'),
        position: 'top',
      })
    })
    .catch(() => {})
}
</script>
