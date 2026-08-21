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
  createPendingSecureMessage,
  dropMatchedPendingMessages,
  lastNumericMessageId,
  mergeSecureMessages,
  replacePendingSecureMessage,
} from 'src/utils/secure-message-normalize.js'

const POLL_MS = 5000

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
  const sendInFlight = ref(0)
  const threadLoading = ref(false)
  const searchQuery = ref('')
  let pollTimer = null
  let openSeq = 0

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
    const seq = openSeq + 1
    openSeq = seq
    const previousId = active.value?.id
    const showLoader = refresh && (
      previousId !== conversationId
      || !messages.value.length
    )
    if (showLoader) {
      threadLoading.value = true
    }
    try {
      if (refresh || previousId !== conversationId) {
        const conversation = await getStaffConversation(
          conversationId,
        )
        if (seq !== openSeq) {
          return
        }
        active.value = conversation
        const listed = await listStaffMessages(conversationId)
        if (seq !== openSeq) {
          return
        }
        if (listed.length || previousId !== conversationId) {
          messages.value = listed
        }
      }
      if (seq !== openSeq) {
        return
      }
      if (messages.value.length) {
        await markRead(conversationId)
      }
    } finally {
      if (seq === openSeq) {
        threadLoading.value = false
      }
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
      if (sendInFlight.value) {
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
    if (active.value?.id !== row.id) {
      active.value = row
      messages.value = []
    }
    const opening = openConversation(row.id)
    if (conversationIdFromRoute(route) !== row.id) {
      await router.push(clinicMessagesLocation(row.id))
    }
    try {
      await opening
    } catch (error) {
      notifyOpenError(error)
    }
  }

  function closeThread() {
    active.value = null
    messages.value = []
    void router.replace(clinicMessagesLocation())
  }

  async function poll() {
    if (document.hidden) {
      return
    }
    try {
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
      messages.value = dropMatchedPendingMessages(
        mergeSecureMessages(messages.value, incoming),
        incoming,
      )
      await markRead(conversationId)
    } catch {
      // Keep the last successful snapshot.
    }
  }

  function onVisibilityChange() {
    if (!document.hidden) {
      void poll()
    }
  }

  function notifySendError(error) {
    if (isAuthSessionEndUIError(error)) {
      return
    }
    $q.notify({
      type: quasarNotifyTypes.negative,
      message: t('portalMessagesSendError'),
    })
  }

  function patchInboxPreview(conversationId, pending) {
    const preview = pending.body
      || pending.file?.originalFilename
      || ''
    inbox.value = inbox.value.map((row) => {
      if (row.id !== conversationId) {
        return row
      }

      return {
        ...row,
        lastMessageAt: pending.createdAt,
        lastMessagePreview: preview,
      }
    })
  }

  async function persistPending(pending, send) {
    const conversationId = active.value?.id
    if (!conversationId) {
      return
    }
    messages.value = mergeSecureMessages(
      messages.value,
      [pending],
    )
    patchInboxPreview(conversationId, pending)
    sendInFlight.value += 1
    try {
      const saved = await send()
      if (saved) {
        messages.value = replacePendingSecureMessage(
          messages.value,
          pending.id,
          saved,
        )
      } else {
        await mergeSent(saved)
      }
      await loadInbox()
    } catch (error) {
      messages.value = replacePendingSecureMessage(
        messages.value,
        pending.id,
        null,
      )
      notifySendError(error)
    } finally {
      sendInFlight.value -= 1
    }
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
        messages.value = dropMatchedPendingMessages(
          mergeSecureMessages(messages.value, listed),
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
    const conversationId = active.value.id
    const pending = createPendingSecureMessage({
      conversationId,
      body,
    })
    await persistPending(
      pending,
      () => sendStaffMessage(conversationId, body),
    )
  }

  async function onUpload(file) {
    if (!active.value?.id || !canSend.value) {
      return
    }
    const conversationId = active.value.id
    const pending = createPendingSecureMessage({
      conversationId,
      file,
    })
    await persistPending(
      pending,
      () => sendStaffMessageFile(conversationId, file),
    )
  }

  async function onDownload(file) {
    const fileId = Number(file?.id)
    if (!active.value?.id
      || !Number.isFinite(fileId)
      || fileId <= 0) {
      return
    }
    const payload = await downloadStaffMessageFile(
      active.value.id,
      fileId,
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
    try {
      await loadInbox()
      await syncFromRoute()
    } catch (error) {
      notifyOpenError(error)
    }
    pollTimer = window.setInterval(() => {
      void poll()
    }, POLL_MS)
    document.addEventListener(
      'visibilitychange',
      onVisibilityChange,
    )
  })

  onUnmounted(() => {
    if (pollTimer) {
      window.clearInterval(pollTimer)
    }
    document.removeEventListener(
      'visibilitychange',
      onVisibilityChange,
    )
  })

  return {
    canSend,
    inbox,
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
    openClientChart,
  }
}
