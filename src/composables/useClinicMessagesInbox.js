import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'
import { quasarNotifyTypes } from 'components/constants.js'
import { usePortalMessagePermissions } from
  'src/composables/usePortalMessagePermissions.js'
import { useSecureMessageImagePreviews } from
  'src/composables/useSecureMessageImagePreviews.js'
import { isAuthSessionEndUIError } from
  'src/utils/api-session-error.js'
import {
  clinicMessagesLocation,
  conversationIdFromRoute,
} from 'src/utils/clinic-messages-route.js'
import {
  downloadStaffMessageFile,
  getStaffConversation,
  getStaffConversationForClient,
  listStaffMessageInbox,
  listStaffMessages,
  markStaffMessagesRead,
  sendStaffMessage,
  sendStaffMessageFile,
  triggerBlobDownload,
} from 'src/utils/secure-message-api.js'
import {
  conversationMatchesQuery,
  lastNumericMessageId,
  mergeSecureMessages,
} from 'src/utils/secure-message-normalize.js'

const POLL_MS = 15000

function routeClientNumber(route) {
  return String(route.query.clientNumber ?? '').trim()
}

function lastMessageId(messages) {
  return lastNumericMessageId(messages)
}

export function useClinicMessagesInbox() {
  const $q = useQuasar()
  const { t } = useI18n()
  const route = useRoute()
  const router = useRouter()
  const { canSend } = usePortalMessagePermissions()
  const inbox = ref([])
  const active = ref(null)
  const messages = ref([])
  const sending = ref(false)
  const loading = ref(false)
  const searchQuery = ref('')
  let pollTimer = null

  const previewUrls = useSecureMessageImagePreviews(
    messages,
    (fileId) => downloadStaffMessageFile(active.value?.id, fileId),
  )

  const isMobile = computed(() => $q.screen.lt.md)

  const filteredInbox = computed(() =>
    inbox.value.filter(row =>
      conversationMatchesQuery(row, searchQuery.value),
    ),
  )

  const showInboxPanel = computed(() =>
    !isMobile.value || !active.value,
  )

  const showThreadPanel = computed(() =>
    !isMobile.value || Boolean(active.value),
  )

  async function loadInbox() {
    inbox.value = await listStaffMessageInbox()
  }

  async function markRead(conversationId) {
    await markStaffMessagesRead(conversationId)
    inbox.value = inbox.value.map((row) => {
      if (row.id !== conversationId) {
        return row
      }

      return { ...row, unreadCount: 0 }
    })
  }

  function notifyOpenError(error) {
    if (isAuthSessionEndUIError(error)) {
      return
    }
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: t('portalMessagesOpenError'),
    })
  }

  async function openConversation(conversationId, refresh = true) {
    if (!conversationId) {
      return
    }
    const previousId = active.value?.id
    if (refresh || previousId !== conversationId) {
      active.value = await getStaffConversation(conversationId)
      const listed = await listStaffMessages(conversationId)
      if (listed.length || previousId !== conversationId) {
        messages.value = listed
      }
    }
    if (messages.value.length) {
      await markRead(conversationId)
    }
  }

  async function syncFromRoute() {
    const clientNumber = routeClientNumber(route)
    if (clientNumber) {
      try {
        const conversation = await getStaffConversationForClient(
          clientNumber,
        )
        if (!conversation?.id) {
          return
        }
        await loadInbox()
        await openConversation(conversation.id)
        await router.replace(clinicMessagesLocation(conversation.id))
      } catch (error) {
        notifyOpenError(error)
      }

      return
    }
    const conversationId = conversationIdFromRoute(route)
    if (!conversationId) {
      if (sending.value) {
        return
      }
      active.value = null
      messages.value = []

      return
    }
    if (active.value?.id === conversationId) {
      return
    }
    try {
      await openConversation(conversationId)
    } catch (error) {
      active.value = null
      messages.value = []
      notifyOpenError(error)
    }
  }

  async function selectConversation(row) {
    if (!row?.id) {
      return
    }
    await openConversation(row.id)
    if (conversationIdFromRoute(route) !== row.id) {
      await router.push(clinicMessagesLocation(row.id))
    }
  }

  function closeThread() {
    active.value = null
    messages.value = []
    void router.replace(clinicMessagesLocation())
  }

  async function poll() {
    if (document.hidden || sending.value) {
      return
    }
    await loadInbox()
    const conversationId = active.value?.id
    if (!conversationId) {
      return
    }
    const incoming = await listStaffMessages(
      conversationId,
      lastMessageId(messages.value),
    )
    if (!incoming.length) {
      return
    }
    messages.value = mergeSecureMessages(messages.value, incoming)
    await markRead(conversationId)
  }

  async function mergeSent(saved) {
    if (saved) {
      messages.value = mergeSecureMessages(
        messages.value,
        [saved],
      )

      return
    }
    const conversationId = active.value?.id
    if (!conversationId) {
      return
    }
    try {
      const listed = await listStaffMessages(conversationId)
      if (listed.length) {
        messages.value = mergeSecureMessages(
          messages.value,
          listed,
        )
      }
    } catch {
      // Keep the local thread if the follow-up list fails.
    }
  }

  async function onSend(body) {
    if (!active.value?.id || !canSend.value) {
      return
    }
    sending.value = true
    try {
      const saved = await sendStaffMessage(active.value.id, body)
      await mergeSent(saved)
      await loadInbox()
    } finally {
      sending.value = false
    }
  }

  async function onUpload(file) {
    if (!active.value?.id || !canSend.value) {
      return
    }
    sending.value = true
    try {
      const saved = await sendStaffMessageFile(
        active.value.id,
        file,
      )
      await mergeSent(saved)
      await loadInbox()
    } finally {
      sending.value = false
    }
  }

  async function onDownload(file) {
    if (!active.value?.id || !file?.id) {
      return
    }
    const payload = await downloadStaffMessageFile(
      active.value.id,
      file.id,
    )
    triggerBlobDownload(
      payload.blob,
      payload.filename || file.originalFilename || 'file',
    )
  }

  function openClientChart() {
    const number = active.value?.clientNumber
    if (!number) {
      return
    }
    void router.push({
      name: 'ClientOverview',
      params: { id: String(number) },
    })
  }

  watch(
    () => [
      route.params.conversationId,
      route.query.conversationId,
      route.query.clientNumber,
    ],
    () => {
      void syncFromRoute()
    },
  )

  onMounted(async() => {
    loading.value = true
    try {
      await loadInbox()
      await syncFromRoute()
    } catch (error) {
      notifyOpenError(error)
    } finally {
      loading.value = false
    }
    pollTimer = window.setInterval(() => {
      void poll()
    }, POLL_MS)
  })

  onUnmounted(() => {
    if (pollTimer) {
      window.clearInterval(pollTimer)
    }
  })

  return {
    canSend,
    inbox,
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
  }
}
