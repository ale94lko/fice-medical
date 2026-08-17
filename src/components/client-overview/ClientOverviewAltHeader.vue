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
                  client-overview-alt-header__avatar">
                <StoredFileAvatar
                  :file-id="header.photoFileId"
                  previewable
                  spinner-size="32px"
                  :preview-label="t('photoPreviewAria')"
                />
              </div>
              <span
                v-if="header.statusLabel"
                class="client-overview-header__status-badge">
                {{ header.statusLabel }}
              </span>
            </div>

            <div
              v-if="isCompactHeader"
              class="client-overview-header__meta-cell
                client-overview-header__meta-cell--client-number
                client-overview-alt-header__meta-cell--client-number
                client-overview-alt-header__meta-cell--client-number-mid">
              <div class="client-overview-alt-header__meta-label-row">
                <span class="client-overview-header__meta-label
                  client-overview-alt-header__meta-label">
                  <q-icon name="badge" size="16px" />
                  {{ t('clientNumber') }}
                </span>
                <button
                  v-if="missingItems.length"
                  type="button"
                  class="client-overview-alt-header__missing-alert-btn
                    client-overview-alt-header__missing-alert-btn--inline"
                  :data-testid="clientOverviewAltTestIds.reviewMissing"
                  :aria-label="t('clientOverviewMissingInformation', {
                    count: missingItems.length,
                  })"
                  @click="emit('review-missing')">
                  <q-icon
                    name="warning_amber"
                    size="16px"
                  />
                  <q-tooltip anchor="bottom middle" self="top middle">
                    {{ t('clientOverviewMissingInformation', {
                      count: missingItems.length,
                    }) }}
                  </q-tooltip>
                </button>
              </div>
              <div class="client-overview-header__meta-value-row
                client-overview-alt-header__client-number-row">
                <span
                  v-if="header.clientNumber"
                  class="client-overview-header__client-number-badge">
                  <span
                    class="client-overview-header__client-number-text">
                    {{ header.clientNumber }}
                  </span>
                  <q-btn
                    flat
                    dense
                    round
                    size="xs"
                    icon="content_copy"
                    class="client-overview-header__copy-btn"
                    :data-testid="clientOverviewAltTestIds.copyMrn"
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
              v-if="isCompactHeader"
              class="client-overview-alt-header__avatar-menu">
              <q-btn
                flat
                dense
                round
                icon="more_vert"
                :aria-label="t('moreActions')"
                :disable="loading"
                :data-testid="clientOverviewAltTestIds.actionsMenu">
                <q-menu
                  anchor="bottom right"
                  self="top right"
                  :offset="[0, 8]"
                  class="app-light-menu
                    client-overview-alt-header__actions-menu"
                  :data-testid="
                    clientOverviewAltTestIds.actionsMenuPanel
                  ">
                  <q-list>
                    <q-item
                      v-if="canEditAnyClientSection"
                      v-close-popup
                      clickable
                      :disable="loading"
                      :data-testid="clientOverviewAltTestIds.edit"
                      @click="emit('edit')">
                      <q-item-section avatar>
                        <q-icon
                          name="edit"
                          size="20px"
                          color="primary"
                        />
                      </q-item-section>
                      <q-item-section>
                        <q-item-label>
                          {{ t('editClient') }}
                        </q-item-label>
                      </q-item-section>
                    </q-item>

                    <GenerateDocumentAction
                      v-if="clientId"
                      :document-type="documentTypes.clientProfile"
                      :context="{ clientId }"
                      :label="t('generateDocumentFaceSheet')"
                      icon="contact_page"
                      @generated="emit('document-generated')">
                      <template #trigger="{ open }">
                        <q-item
                          v-close-popup
                          clickable
                          @click="open()">
                          <q-item-section avatar>
                            <q-icon
                              name="contact_page"
                              size="20px"
                              color="primary"
                            />
                          </q-item-section>
                          <q-item-section>
                            <q-item-label>
                              {{ t('generateDocumentFaceSheet') }}
                            </q-item-label>
                          </q-item-section>
                        </q-item>
                      </template>
                    </GenerateDocumentAction>

                    <StartEncounterMenuButton
                      as-overflow-item
                      :show="showStartEncounter"
                      :has-active-encounter="hasActiveEncounter"
                      :client-id="clientId"
                      :loading="loading"
                      :busy="startEncounterBusy"
                      @select="emit('start-encounter', $event)"
                      @open-active="emit('open-active-encounter')"
                      @request-dialog="onRequestEncounterDialog"
                    />
                  </q-list>
                </q-menu>
              </q-btn>
            </div>
          </div>

          <div class="client-overview-header__profile-body">
            <div
              v-if="!isCompactHeader"
              class="client-overview-alt-header__name-row">
              <h2 class="client-overview-header__name
                client-overview-alt-header__name">
                {{ header.fullName }}
              </h2>
              <q-btn
                v-if="header.fullName"
                flat
                dense
                round
                size="sm"
                icon="content_copy"
                class="client-overview-header__copy-btn
                  client-overview-alt-header__name-copy"
                :aria-label="t('clientOverviewCopyClientName')"
                :data-testid="clientOverviewAltTestIds.copyName"
                @click="copyClientName"
              />
            </div>

            <div
              class="client-overview-header__meta-row
                client-overview-header__meta-row--client-actions
                client-overview-alt-header__meta-row">
              <div
                v-if="!isCompactHeader"
                class="client-overview-header__meta-cell
                  client-overview-header__meta-cell--client-number
                  client-overview-alt-header__meta-cell--client-number">
                <div class="client-overview-alt-header__meta-label-row">
                  <span class="client-overview-header__meta-label
                    client-overview-alt-header__meta-label">
                    <q-icon name="badge" size="16px" />
                    {{ t('clientNumber') }}
                  </span>
                  <button
                    v-if="missingItems.length"
                    type="button"
                    class="client-overview-alt-header__missing-alert-btn
                      client-overview-alt-header__missing-alert-btn--inline"
                    :data-testid="clientOverviewAltTestIds.reviewMissing"
                    :aria-label="t('clientOverviewMissingInformation', {
                      count: missingItems.length,
                    })"
                    @click="emit('review-missing')">
                    <q-icon
                      name="warning_amber"
                      size="16px"
                    />
                    <q-tooltip anchor="bottom middle" self="top middle">
                      {{ t('clientOverviewMissingInformation', {
                        count: missingItems.length,
                      }) }}
                    </q-tooltip>
                  </button>
                </div>
                <div class="client-overview-header__meta-value-row
                  client-overview-alt-header__client-number-row">
                  <span
                    v-if="header.clientNumber"
                    class="client-overview-header__client-number-badge">
                    <span
                      class="client-overview-header__client-number-text">
                      {{ header.clientNumber }}
                    </span>
                    <q-btn
                      flat
                      dense
                      round
                      size="xs"
                      icon="content_copy"
                      class="client-overview-header__copy-btn"
                      :data-testid="clientOverviewAltTestIds.copyMrn"
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
                v-if="!isCompactHeader && hasDobAge"
                class="client-overview-header__meta-divider"
                aria-hidden="true"
              />

              <div
                class="client-overview-header__meta-cell
                  client-overview-header__meta-cell--dob
                  client-overview-alt-header__meta-cell--dob">
                <template v-if="hasDobAge">
                  <div class="client-overview-alt-header__meta-label-row">
                    <span class="client-overview-header__meta-label
                      client-overview-alt-header__meta-label">
                      <q-icon name="cake" size="16px" />
                      {{ t('clientOverviewDobAge') }}
                    </span>
                    <q-btn
                      flat
                      dense
                      round
                      size="xs"
                      icon="content_copy"
                      class="client-overview-header__copy-btn"
                      :aria-label="t('clientOverviewCopyDobAge')"
                      :data-testid="clientOverviewAltTestIds.copyDob"
                      @click="copyDobAge">
                      <q-tooltip
                        class="app-info-tooltip"
                        anchor="top middle"
                        self="bottom middle"
                        :offset="[0, 6]">
                        {{ t('copy') }}
                      </q-tooltip>
                    </q-btn>
                  </div>
                  <div class="client-overview-alt-header__dob-value-row">
                    <strong
                      v-if="dobDisplay"
                      class="client-overview-header__meta-value">
                      {{ dobDisplay }}
                    </strong>
                    <span
                      v-if="ageLabel"
                      class="client-overview-alt-header__age-badge">
                      {{ ageLabel }}
                    </span>
                  </div>
                </template>
              </div>

              <div
                v-if="hasPhone"
                class="client-overview-header__meta-divider"
                aria-hidden="true"
              />

              <div
                class="client-overview-header__meta-cell
                  client-overview-alt-header__meta-cell--phone">
                <template v-if="hasPhone">
                  <div class="client-overview-alt-header__meta-label-row">
                    <span class="client-overview-header__meta-label
                      client-overview-alt-header__meta-label">
                      <q-icon name="phone" size="16px" />
                      {{ t('phone') }}
                    </span>
                    <span
                      v-if="isCompactHeader && phoneTypeLabel"
                      class="client-overview-alt-header__phone-type-badge">
                      {{ phoneTypeLabel }}
                    </span>
                    <q-btn
                      flat
                      dense
                      round
                      size="xs"
                      icon="content_copy"
                      class="client-overview-header__copy-btn"
                      :aria-label="t('clientOverviewCopyPhone')"
                      :data-testid="clientOverviewAltTestIds.copyPhone"
                      @click="copyPhone">
                      <q-tooltip
                        class="app-info-tooltip"
                        anchor="top middle"
                        self="bottom middle"
                        :offset="[0, 6]">
                        {{ t('copy') }}
                      </q-tooltip>
                    </q-btn>
                  </div>
                  <AdminTableContactOverflow
                    class="client-overview-alt-header__phones"
                    :class="{
                      'client-overview-alt-header__phones--compact':
                        isCompactHeader,
                    }"
                    :entries="headerPhones"
                    icon="phone"
                    variant="header"
                  />
                </template>
              </div>

              <div
                v-if="hasAddress"
                class="client-overview-header__meta-divider"
                aria-hidden="true"
              />

              <div
                class="client-overview-header__meta-cell
                  client-overview-alt-header__meta-cell--address">
                <template v-if="hasAddress">
                  <div class="client-overview-alt-header__meta-label-row">
                    <span class="client-overview-header__meta-label
                      client-overview-alt-header__meta-label">
                      <q-icon name="location_on" size="16px" />
                      {{ t('address') }}
                    </span>
                    <q-btn
                      flat
                      dense
                      round
                      size="xs"
                      icon="content_copy"
                      class="client-overview-header__copy-btn"
                      :aria-label="t('clientOverviewCopyAddress')"
                      :data-testid="clientOverviewAltTestIds.copyAddress"
                      @click="copyAddress">
                      <q-tooltip
                        class="app-info-tooltip"
                        anchor="top middle"
                        self="bottom middle"
                        :offset="[0, 6]">
                        {{ t('copy') }}
                      </q-tooltip>
                    </q-btn>
                  </div>
                  <strong class="client-overview-header__meta-value
                    client-overview-alt-header__address-value">
                    {{ header.addressLine }}
                  </strong>
                </template>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        v-if="!isCompactHeader"
        class="client-overview-alt-header__actions">
        <div class="client-overview-alt-header__actions-row">
          <q-btn
            v-if="canEditAnyClientSection"
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
            :label="t('generateDocumentFaceSheet')"
            icon="contact_page"
            button-class="app-btn-outline"
            @generated="emit('document-generated')"
          />
          <StartEncounterMenuButton
            :show="showStartEncounter"
            :has-active-encounter="hasActiveEncounter"
            :client-id="clientId"
            :loading="loading"
            :busy="startEncounterBusy"
            @select="emit('start-encounter', $event)"
            @open-active="emit('open-active-encounter')"
          />
        </div>
      </div>
    </div>

    <StartEncounterMenuButton
      dialog-host
      v-model:dialog-open="encounterDialogOpen"
      :show="showStartEncounter"
      :has-active-encounter="hasActiveEncounter"
      :client-id="clientId"
      :loading="loading"
      :busy="startEncounterBusy"
      @select="emit('start-encounter', $event)"
    />
  </section>
</template>

<script setup>
import { computed, nextTick, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuasar, copyToClipboard } from 'quasar'
import { quasarNotifyTypes } from 'components/constants.js'
import AdminTableContactOverflow from
  'components/admin-table/AdminTableContactOverflow.vue'
import StoredFileAvatar from 'components/StoredFileAvatar.vue'
import GenerateDocumentAction from
  'components/documents/GenerateDocumentAction.vue'
import StartEncounterMenuButton from
  'components/StartEncounterMenuButton.vue'
import { documentTypes } from 'src/utils/document-generation-constants.js'
import {
  clientOverviewAltTestIds,
} from 'src/test-ids/index.js'
import { useSyncAppPageTitle } from
  'src/composables/useAppPageTitle.js'
import { useClientPermissions } from
  'src/composables/useClientPermissions.js'

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
  showStartEncounter: {
    type: Boolean,
    default: false,
  },
  hasActiveEncounter: {
    type: Boolean,
    default: false,
  },
  startEncounterBusy: {
    type: Boolean,
    default: false,
  },
})

useSyncAppPageTitle(computed(() =>
  String(props.header?.fullName ?? '').trim(),
))

const emit = defineEmits([
  'review-missing',
  'edit',
  'document-generated',
  'start-encounter',
  'open-active-encounter',
])

const { t } = useI18n()
const $q = useQuasar()
const { canEditAnyClientSection } = useClientPermissions()

const encounterDialogOpen = ref(false)

const isCompactHeader = computed(() => $q.screen.width < 900)

function onRequestEncounterDialog() {
  // Menu unmounts the overflow item; open host dialog after it closes.
  void nextTick(() => {
    encounterDialogOpen.value = true
  })
}

const headerPhones = computed(() =>
  Array.isArray(props.header?.phones) ? props.header.phones : [],
)

const dobDisplay = computed(() =>
  String(props.header?.dobDisplay ?? '').trim(),
)

const ageLabel = computed(() =>
  String(props.header?.ageLabel ?? '').trim(),
)

const hasDobAge = computed(() => {
  if (dobDisplay.value || ageLabel.value) {
    return true
  }
  const line = String(props.header?.dobAgeLine ?? '').trim()

  return Boolean(line) && line !== '—'
})

const hasPhone = computed(() => headerPhones.value.length > 0)

const phoneTypeLabel = computed(() =>
  String(headerPhones.value[0]?.type ?? '').trim(),
)

const hasAddress = computed(() => {
  const line = String(props.header?.addressLine ?? '').trim()

  return Boolean(line) && line !== '—'
})

function notifyCopied(messageKey) {
  $q.notify({
    type: quasarNotifyTypes.positive,
    message: t(messageKey),
    position: 'top',
  })
}

function copyText(value, successKey) {
  const text = String(value ?? '').trim()
  if (!text) {
    return
  }

  copyToClipboard(text)
    .then(() => {
      notifyCopied(successKey)
    })
    .catch(() => {})
}

function copyClientNumber() {
  copyText(
    props.header.clientNumber,
    'clientOverviewCopiedClientNumber',
  )
}

function copyClientName() {
  copyText(
    props.header.fullName,
    'clientOverviewCopiedClientName',
  )
}

function copyDobAge() {
  copyText(
    props.header.dobAgeLine,
    'clientOverviewCopiedDobAge',
  )
}

function copyPhone() {
  copyText(
    props.header.phone,
    'clientOverviewCopiedPhone',
  )
}

function copyAddress() {
  copyText(
    props.header.addressLine,
    'clientOverviewCopiedAddress',
  )
}
</script>
