<template>
  <q-page
    class="admin-page admin-list-page clinic-messages-page"
    :data-testid="clinicMessagesTestIds.page"
  >
    <AppLoadingOverlay
      scope="content"
      :showing="loading || sending"
    />

    <AdminListPageHeader
      :title="t('portalMessagesTitle')"
      :subtitle="t('portalMessagesSubtitle')"
    >
      <template #actions>
        <q-btn
          no-caps
          outline
          color="primary"
          class="app-btn-outline"
          icon="sync"
          :disable="loading"
          :data-testid="clinicMessagesTestIds.refresh"
          :label="t('claimQueueRefresh')"
          @click="loadInbox"
        />
      </template>
    </AdminListPageHeader>

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
          dense
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
          :data-testid="clinicMessagesTestIds.inboxItem(row.id)"
          @click="selectConversation(row)"
        >
          <div class="clinic-messages__row-head">
            <span class="clinic-messages__row-name ellipsis">
              {{ row.clientDisplayName || row.clientNumber }}
            </span>
            <q-badge
              v-if="row.unreadCount"
              rounded
              color="primary"
              :label="row.unreadCount"
            />
          </div>
          <div class="clinic-messages__row-preview ellipsis">
            {{ row.lastMessagePreview }}
          </div>
          <div
            v-if="formatMessageTime(row.lastMessageAt)"
            class="clinic-messages__row-time"
          >
            {{ formatMessageTime(row.lastMessageAt) }}
          </div>
        </button>
      </aside>
      <section
        v-show="showThreadPanel"
        class="clinic-messages__thread"
        :data-testid="clinicMessagesTestIds.thread"
      >
        <div
          v-if="active"
          class="clinic-messages__thread-head"
        >
          <q-btn
            v-if="isMobile"
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
              {{ active.clientDisplayName || active.clientNumber }}
            </div>
            <div
              v-if="active.clientNumber"
              class="text-caption text-grey-7 ellipsis"
            >
              {{ active.clientNumber }}
            </div>
          </div>
          <q-btn
            v-if="isMobile"
            flat
            dense
            round
            :icon="infoOpen ? 'chat' : 'info'"
            :aria-label="infoOpen
              ? t('portalMessagesShowChat')
              : t('portalMessagesShowClient')"
            :data-testid="clinicMessagesTestIds.clientInfoToggle"
            @click="infoOpen = !infoOpen"
          />
          <q-btn
            v-if="active.clientNumber"
            flat
            no-caps
            color="primary"
            icon="person"
            :label="isMobile
              ? undefined
              : t('portalMessagesOpenClient')"
            :aria-label="t('portalMessagesOpenClient')"
            :data-testid="clinicMessagesTestIds.clientLink"
            @click="openClientChart"
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
            :sending="sending"
            :client-label="active.clientDisplayName
              || active.clientNumber"
            :preview-urls="previewUrls"
            @send="onSend"
            @upload="onUpload"
            @download="onDownload"
          />
          <ClinicMessageClientPanel
            :client-number="active.clientNumber"
            :fallback-name="active.clientDisplayName
              || active.clientNumber"
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
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import AdminListPageHeader from
  'components/admin-table/AdminListPageHeader.vue'
import AppLoadingOverlay from 'components/AppLoadingOverlay.vue'
import ClinicMessageClientPanel from
  'src/components/messages/ClinicMessageClientPanel.vue'
import ClinicMessageThread from
  'src/components/messages/ClinicMessageThread.vue'
import { useClinicMessagesInbox } from
  'src/composables/useClinicMessagesInbox.js'
import { useSyncAppPageTitle } from
  'src/composables/useAppPageTitle.js'
import { clinicMessagesTestIds } from 'src/test-ids/index.js'
import { formatMessageTime } from
  'src/utils/secure-message-normalize.js'

const { t } = useI18n()
useSyncAppPageTitle(computed(() => t('portalMessagesTitle')))
const infoOpen = ref(false)

const {
  canSend,
  filteredInbox,
  active,
  messages,
  sending,
  loading,
  searchQuery,
  previewUrls,
  isMobile,
  showInboxPanel,
  showThreadPanel,
  loadInbox,
  selectConversation,
  closeThread,
  onSend,
  onUpload,
  onDownload,
  openClientChart,
} = useClinicMessagesInbox()

watch(
  () => active.value?.id,
  () => {
    infoOpen.value = false
  },
)

function onMobileBack() {
  if (infoOpen.value) {
    infoOpen.value = false

    return
  }
  closeThread()
}
</script>
