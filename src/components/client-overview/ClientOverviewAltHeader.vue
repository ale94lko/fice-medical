<template>
  <section
    class="client-overview-header client-overview-alt-header"
    :data-testid="clientOverviewAltTestIds.header">
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
                :aria-label="t('clientOverviewProfilePhotoPlaceholder')">
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
                  {{ t('clientNumber') }}
                </span>
                <div class="client-overview-header__meta-value-row">
                  <span
                    v-if="header.clientNumber"
                    class="client-overview-header__client-number-badge">
                    <span class="client-overview-header__client-number-text">
                      {{ header.clientNumber }}
                    </span>
                    <q-btn
                      flat
                      dense
                      round
                      size="xs"
                      icon="content_copy"
                      class="client-overview-header__copy-btn"
                      :aria-label="t('clientOverviewCopyClientNumber')"
                      @click="copyClientNumber"
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

              <div
                class="client-overview-header__meta-cell
                  client-overview-header__meta-cell--dob">
                <span class="client-overview-header__meta-label">
                  {{ t('clientOverviewDobAge') }}
                </span>
                <strong class="client-overview-header__meta-value">
                  {{ header.dobAgeLine }}
                </strong>
              </div>

              <div
                class="client-overview-header__meta-divider
                  client-overview-header__meta-divider--compact"
                aria-hidden="true"
              />

              <div
                class="client-overview-header__meta-cell
                  client-overview-header__meta-cell--sex">
                <span class="client-overview-header__meta-label">
                  {{ t('clientOverviewSex') }}
                </span>
                <strong class="client-overview-header__meta-value">
                  {{ header.gender }}
                </strong>
              </div>

              <div
                class="client-overview-header__meta-divider"
                aria-hidden="true"
              />

              <div
                class="client-overview-header__meta-cell
                  client-overview-header__meta-cell--last-visit">
                <span class="client-overview-header__meta-label">
                  {{ t('clientOverviewLastVisit') }}
                </span>
                <strong class="client-overview-header__meta-value">
                  {{ header.lastVisit?.date || '—' }}
                </strong>
              </div>

              <div
                class="client-overview-header__meta-divider"
                aria-hidden="true"
              />

              <div
                class="client-overview-header__meta-cell
                  client-overview-header__meta-cell--next-appt">
                <span class="client-overview-header__meta-label">
                  {{ t('clientOverviewNextAppointment') }}
                </span>
                <strong class="client-overview-header__meta-value">
                  {{ header.nextAppointment?.dateTimeLine || '—' }}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="client-overview-alt-header__actions">
        <button
          v-if="missingItems.length"
          type="button"
          class="client-overview-alt-header__missing-alert-btn"
          :data-testid="clientOverviewAltTestIds.reviewMissing"
          :aria-label="t('clientOverviewMissingInformation', {
            count: missingItems.length,
          })"
          @click="emit('review-missing')">
          <q-icon
            name="warning_amber"
            size="28px"
          />
          <q-tooltip anchor="bottom middle" self="top middle">
            {{ t('clientOverviewMissingInformation', {
              count: missingItems.length,
            }) }}
          </q-tooltip>
        </button>
        <q-btn
          no-caps
          unelevated
          color="primary"
          class="app-btn-primary"
          icon="edit"
          :data-testid="clientOverviewAltTestIds.edit"
          :disable="loading"
          :label="t('editClient')"
          @click="emit('edit')"
        />
        <GenerateDocumentAction
          v-if="clientId"
          :document-type="documentTypes.clientProfile"
          :context="{ clientId }"
          :label="t('generateDocumentAction')"
          button-class="app-btn-outline"
          @generated="emit('document-generated')"
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
import { clientOverviewAltTestIds } from 'src/test-ids/index.js'

const props = defineProps({
  clientId: {
    type: [String, Number],
    default: null,
  },
  header: {
    type: Object,
    required: true,
  },
  missingItems: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['review-missing', 'edit', 'document-generated'])

const { t } = useI18n()
const $q = useQuasar()

function copyClientNumber() {
  copyToClipboard(props.header.clientNumber)
    .then(() => {
      $q.notify({
        type: quasarNotifyTypes.positive,
        message: t('clientOverviewCopiedClientNumber'),
        position: 'top',
      })
    })
    .catch(() => {})
}
</script>
