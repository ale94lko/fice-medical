<template>
  <div class="clinic-messages-thread">
    <div
      class="clinic-messages-thread__list"
      :data-testid="clinicMessagesTestIds.list"
    >
      <div
        v-if="loading"
        class="clinic-messages-thread__loading"
        :data-testid="clinicMessagesTestIds.threadLoading"
      >
        <q-spinner color="primary" size="28px" />
      </div>
      <div
        v-else-if="!messages.length"
        class="clinic-messages-thread__empty"
      >
        {{ t('portalMessagesEmptyThread') }}
      </div>
      <template v-if="!loading">
        <template
          v-for="group in groupedMessages"
          :key="group.key"
        >
        <div
          v-if="group.label && group.label !== '_'"
          class="clinic-messages-thread__date"
        >
          <span>{{ group.label }}</span>
        </div>
        <div
          v-for="msg in group.messages"
          :key="msg.id"
          class="clinic-messages-thread__row"
          :class="{
            'clinic-messages-thread__row--mine':
              isClinicMessage(msg),
          }"
        >
          <ClinicMessageAvatar
            v-if="!isClinicMessage(msg)"
            size="sm"
            :name="clientLabel"
            :file-id="clientPhotoFileId"
          />
          <article
            class="clinic-messages-thread__item"
            :class="{
              'clinic-messages-thread__item--mine':
                isClinicMessage(msg),
            }"
            :data-testid="clinicMessagesTestIds.item(msg.id)"
          >
            <div class="clinic-messages-thread__meta">
              <span
                class="clinic-messages-thread__author ellipsis"
              >
                {{ authorLabel(msg) }}
              </span>
              <span
                v-if="formatMessageClock(msg.createdAt)"
                class="clinic-messages-thread__time"
              >
                {{ formatMessageClock(msg.createdAt) }}
              </span>
              <q-spinner
                v-if="isPending(msg)"
                color="primary"
                size="12px"
                :aria-label="t('portalMessagesSending')"
                :data-testid="
                  clinicMessagesTestIds.sending(msg.id)
                "
              />
            </div>
            <p
              v-if="msg.body"
              class="clinic-messages-thread__body"
            >
              {{ msg.body }}
            </p>
            <button
              v-if="msg.file && isImageFile(msg.file)"
              type="button"
              class="clinic-messages-thread__file
                clinic-messages-thread__file--image"
              :data-testid="
                clinicMessagesTestIds.file(msg.file.id)
              "
              @click="$emit('download', msg.file)"
            >
              <img
                v-if="previewUrls[msg.file.id]"
                class="clinic-messages-thread__preview"
                :src="previewUrls[msg.file.id]"
                :alt="msg.file.originalFilename
                  || t('portalMessagesAttachment')"
              >
              <span
                v-else
                class="ellipsis"
              >
                {{ msg.file.originalFilename
                  || t('portalMessagesAttachment') }}
              </span>
            </button>
            <button
              v-else-if="msg.file"
              type="button"
              class="clinic-messages-thread__file"
              :data-testid="
                clinicMessagesTestIds.file(msg.file.id)
              "
              @click="$emit('download', msg.file)"
            >
              <q-icon
                name="picture_as_pdf"
                size="18px"
              />
              <span class="ellipsis">
                {{ msg.file.originalFilename
                  || t('portalMessagesAttachment') }}
              </span>
            </button>
          </article>
        </div>
        </template>
      </template>
      <div
        ref="bottomRef"
        class="clinic-messages-thread__anchor"
        aria-hidden="true"
      />
    </div>
    <form
      v-if="canSend"
      class="clinic-messages-thread__composer"
      @submit.prevent="onSubmit"
    >
      <input
        ref="fileInputRef"
        class="hidden"
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,.webp,
          image/png,image/jpeg,application/pdf"
        :data-testid="clinicMessagesTestIds.fileInput"
        @change="onPickFile"
      >
      <div class="clinic-messages-thread__composer-box">
        <q-btn
          flat
          dense
          round
          icon="attach_file"
          class="clinic-messages-thread__attach"
          :aria-label="t('portalMessagesAttach')"
          :data-testid="clinicMessagesTestIds.attach"
          @click="fileInputRef?.click()"
        />
        <q-input
          v-model="draft"
          borderless
          dense
          autogrow
          hide-bottom-space
          class="clinic-messages-thread__input col"
          :placeholder="t('portalMessagesPlaceholder')"
          :data-testid="clinicMessagesTestIds.input"
          @keydown.enter.exact.prevent="onSubmit"
        />
      </div>
      <q-btn
        unelevated
        round
        color="primary"
        icon="send"
        type="submit"
        :disable="!canSubmit"
        :aria-label="t('portalMessagesSend')"
        :data-testid="clinicMessagesTestIds.send"
      />
    </form>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import ClinicMessageAvatar from
  'src/components/messages/ClinicMessageAvatar.vue'
import { useAuthStore } from 'src/stores/auth-store.js'
import { clinicMessagesTestIds } from 'src/test-ids/index.js'
import {
  firstGivenName,
  groupMessagesByDate,
  usableStaffSenderName,
} from 'src/utils/clinic-message-display.js'
import {
  formatMessageClock,
  isImageContentType,
  isPendingSecureMessage,
} from 'src/utils/secure-message-normalize.js'

const props = defineProps({
  messages: { type: Array, default: () => [] },
  canSend: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  clientLabel: { type: String, default: '' },
  clientPhotoFileId: {
    type: [Number, String],
    default: null,
  },
  previewUrls: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['send', 'upload', 'download'])
const { t } = useI18n()
const { userInfo } = storeToRefs(useAuthStore())
const draft = ref('')
const bottomRef = ref(null)
const fileInputRef = ref(null)

const canSubmit = computed(() => Boolean(draft.value.trim()))
const groupedMessages = computed(() =>
  groupMessagesByDate(props.messages),
)

function isImageFile(file) {
  return isImageContentType(file?.contentType)
}

function isPending(msg) {
  return isPendingSecureMessage(msg)
}

function isClinicMessage(msg) {
  return String(msg?.senderType ?? '').toUpperCase() === 'STAFF'
}

function isOwnStaffMessage(msg) {
  if (msg?.mine) {
    return true
  }
  if (!isClinicMessage(msg)) {
    return false
  }
  const currentId = Number(userInfo.value?.id)
  const senderId = Number(msg?.senderStaffUserId)
  return Number.isFinite(currentId)
    && Number.isFinite(senderId)
    && currentId === senderId
}

function authorLabel(msg) {
  if (isOwnStaffMessage(msg)) {
    return t('portalMessagesYou')
  }
  if (String(msg?.senderType ?? '').toUpperCase() === 'PORTAL') {
    return firstGivenName(props.clientLabel)
      || firstGivenName(msg.senderDisplayName)
      || t('portalMessagesClient')
  }
  const name = usableStaffSenderName(msg?.senderDisplayName)
  if (name) {
    return name
  }

  return t('portalMessagesClinic')
}

function onSubmit() {
  const body = draft.value.trim()
  if (!props.canSend || !body) {
    return
  }
  emit('send', body)
  draft.value = ''
}

function onPickFile(event) {
  const file = event.target?.files?.[0]
  event.target.value = ''
  if (!file || !props.canSend) {
    return
  }
  emit('upload', file)
}

async function scrollToBottom() {
  await nextTick()
  bottomRef.value?.scrollIntoView?.({ block: 'end' })
}

watch(
  () => props.messages.length,
  () => {
    void scrollToBottom()
  },
)
</script>
