<template>
  <q-page
    class="admin-page admin-list-page clinic-messages-page"
    :data-testid="clinicMessagesTestIds.page"
  >
    <AdminListPageHeader
      :title="t('portalMessagesTitle')"
      :subtitle="t('portalMessagesSubtitle')"
    />

    <div
      class="clinic-messages"
      :class="{
        'clinic-messages--thread-open': Boolean(active),
      }"
    >
      <aside
        v-show="showInboxPanel"
        class="clinic-messages__inbox"
        :data-testid="clinicMessagesTestIds.inbox"
      >
        <q-input
          v-model="searchQuery"
          outlined
          clearable
          hide-bottom-space
          class="clinic-messages__search"
          :data-testid="clinicMessagesTestIds.search"
          :placeholder="t('portalMessagesSearch')"
          :aria-label="t('portalMessagesSearch')"
        >
          <template #prepend>
            <q-icon name="search" size="18px" />
          </template>
        </q-input>
        <div
          class="clinic-messages__list"
        >
          <div
            v-if="!filteredInbox.length"
            class="clinic-messages__empty"
          >
            {{ t('portalMessagesEmptyInbox') }}
          </div>
          <button
            v-for="row in filteredInbox"
            :key="row.id"
            type="button"
            class="clinic-messages__row"
            :class="{
              'clinic-messages__row--active':
                row.id === active?.id,
            }"
            :data-testid="
              clinicMessagesTestIds.inboxItem(row.id)
            "
            @click="selectConversation(row)"
          >
            <ClinicMessageAvatar
              :name="row.clientDisplayName
                || row.clientNumber"
              :file-id="row.clientPhotoFileId"
            />
            <div class="clinic-messages__row-body">
              <div class="clinic-messages__row-head">
                <span
                  class="clinic-messages__row-name ellipsis"
                >
                  {{ row.clientDisplayName
                    || row.clientNumber }}
                </span>
                <span
                  v-if="inboxStamp(row)"
                  class="clinic-messages__row-time"
                >
                  {{ inboxStamp(row) }}
                </span>
              </div>
              <div class="clinic-messages__row-foot">
                <div
                  class="clinic-messages__row-preview ellipsis"
                >
                  {{ row.lastMessagePreview }}
                </div>
                <span
                  v-if="row.unreadCount"
                  class="clinic-messages__unread"
                  :aria-label="t('portalMessagesUnread')"
                />
              </div>
            </div>
          </button>
        </div>
      </aside>
      <section
        v-show="showThreadPanel"
        class="clinic-messages__thread"
        :data-testid="clinicMessagesTestIds.thread"
      >
        <div
          v-if="active && isMobile"
          class="clinic-messages__thread-head"
        >
          <q-btn
            flat
            dense
            round
            icon="arrow_back"
            :aria-label="t('portalMessagesBack')"
            :data-testid="clinicMessagesTestIds.back"
            @click="onMobileBack"
          />
          <div class="clinic-messages__thread-title">
            <div class="ellipsis text-weight-medium">
              {{ active.clientDisplayName
                || active.clientNumber }}
            </div>
          </div>
          <q-btn
            flat
            dense
            round
            :icon="infoOpen ? 'chat' : 'info'"
            :aria-label="infoOpen
              ? t('portalMessagesShowChat')
              : t('portalMessagesShowClient')"
            :data-testid="
              clinicMessagesTestIds.clientInfoToggle
            "
            @click="infoOpen = !infoOpen"
          />
        </div>
        <div
          v-if="active"
          class="clinic-messages__thread-split"
          :class="{
            'clinic-messages__thread-split--info':
              isMobile && infoOpen,
          }"
        >
          <ClinicMessageThread
            :messages="messages"
            :can-send="canSend"
            :loading="threadLoading"
            :client-label="active.clientDisplayName
              || active.clientNumber"
            :client-photo-file-id="active.clientPhotoFileId"
            :preview-urls="previewUrls"
            @send="onSend"
            @upload="onUpload"
            @download="onDownload"
          />
          <ClinicMessageClientPanel
            :client-number="active.clientNumber"
            :fallback-name="active.clientDisplayName
              || active.clientNumber"
            :photo-file-id="active.clientPhotoFileId"
          />
        </div>
        <div
          v-else
          class="clinic-messages__placeholder"
        >
          {{ t('portalMessagesSelectThread') }}
        </div>
      </section>
    </div>
  </q-page>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminListPageHeader from
  'components/admin-table/AdminListPageHeader.vue'
import ClinicMessageAvatar from
  'src/components/messages/ClinicMessageAvatar.vue'
import ClinicMessageClientPanel from
  'src/components/messages/ClinicMessageClientPanel.vue'
import ClinicMessageThread from
  'src/components/messages/ClinicMessageThread.vue'
import { useClinicMessagesInbox } from
  'src/composables/useClinicMessagesInbox.js'
import { clinicMessagesTestIds } from 'src/test-ids/index.js'
import { formatInboxStamp } from
  'src/utils/clinic-message-display.js'

const { t } = useI18n()
const infoOpen = ref(false)

const {
  canSend,
  filteredInbox,
  active,
  messages,
  searchQuery,
  previewUrls,
  isMobile,
  showInboxPanel,
  showThreadPanel,
  threadLoading,
  selectConversation,
  closeThread,
  onSend,
  onUpload,
  onDownload,
} = useClinicMessagesInbox()

watch(
  () => active.value?.id,
  () => {
    infoOpen.value = false
  },
)

function inboxStamp(row) {
  return formatInboxStamp(row?.lastMessageAt, t)
}

function onMobileBack() {
  if (infoOpen.value) {
    infoOpen.value = false

    return
  }
  closeThread()
}
</script>
