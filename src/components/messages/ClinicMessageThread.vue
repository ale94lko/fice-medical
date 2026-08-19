<template>
  <div class="clinic-messages-thread">
    <div
      class="clinic-messages-thread__list"
      :data-testid="clinicMessagesTestIds.list"
    >
      <div
        v-if="!messages.length"
        class="clinic-messages-thread__empty"
      >
        {{ t('portalMessagesEmptyThread') }}
      </div>
      <article
        v-for="msg in messages"
        :key="msg.id"
        class="clinic-messages-thread__item"
        :class="{
          'clinic-messages-thread__item--mine': msg.mine,
        }"
        :data-testid="clinicMessagesTestIds.item(msg.id)"
      >
        <div class="clinic-messages-thread__meta">
          <span class="clinic-messages-thread__author ellipsis">
            {{ authorLabel(msg) }}
          </span>
          <span
            v-if="formatMessageClock(msg.createdAt)"
            class="clinic-messages-thread__time"
          >
            {{ formatMessageClock(msg.createdAt) }}
          </span>
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
          :data-testid="clinicMessagesTestIds.file(msg.file.id)"
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
          :data-testid="clinicMessagesTestIds.file(msg.file.id)"
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
      <q-btn
        flat
        dense
        round
        icon="attach_file"
        :disable="sending"
        :aria-label="t('portalMessagesAttach')"
        :data-testid="clinicMessagesTestIds.attach"
        @click="fileInputRef?.click()"
      />
      <q-input
        v-model="draft"
        outlined
        dense
        autogrow
        hide-bottom-space
        class="clinic-messages-thread__input col"
        :disable="sending"
        :placeholder="t('portalMessagesPlaceholder')"
        :data-testid="clinicMessagesTestIds.input"
        @keydown.enter.exact.prevent="onSubmit"
      />
      <q-btn
        unelevated
        round
        color="primary"
        icon="send"
        type="submit"
        :loading="sending"
        :disable="!canSubmit"
        :aria-label="t('portalMessagesSend')"
        :data-testid="clinicMessagesTestIds.send"
      />
    </form>
  </div>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { clinicMessagesTestIds } from 'src/test-ids/index.js'
import {
  formatMessageClock,
  isImageContentType,
} from 'src/utils/secure-message-normalize.js'

const props = defineProps({
  messages: { type: Array, default: () => [] },
  canSend: { type: Boolean, default: false },
  sending: { type: Boolean, default: false },
  clientLabel: { type: String, default: '' },
  previewUrls: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['send', 'upload', 'download'])
const { t } = useI18n()
const draft = ref('')
const bottomRef = ref(null)
const fileInputRef = ref(null)

const canSubmit = computed(() => Boolean(draft.value.trim()))

function isImageFile(file) {
  return isImageContentType(file?.contentType)
}

function authorLabel(msg) {
  if (msg?.mine) {
    return t('portalMessagesYou')
  }
  if (msg?.senderType === 'PORTAL') {
    return props.clientLabel || t('portalMessagesClient')
  }
  if (msg?.senderDisplayName) {
    return msg.senderDisplayName
  }

  return t('portalMessagesClinic')
}

function onSubmit() {
  const body = draft.value.trim()
  if (!props.canSend || !body || props.sending) {
    return
  }
  emit('send', body)
  draft.value = ''
}

function onPickFile(event) {
  const file = event.target?.files?.[0]
  event.target.value = ''
  if (!file || !props.canSend || props.sending) {
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
