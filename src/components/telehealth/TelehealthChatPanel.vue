<template>
  <div class="telehealth-room__panel">
    <h3 class="telehealth-room__panel-title">
      {{ t('telehealthChatTitle') }}
    </h3>
    <div class="telehealth-chat-list">
      <div
        v-for="msg in messages"
        :key="msg.id"
        class="telehealth-chat-item">
        <div class="telehealth-chat-item__meta row items-center no-wrap">
          <span class="col">
            {{ msg.displayName || msg.role || t('telehealthChatUnknown') }}
          </span>
          <q-btn
            v-if="canDeleteMessage(msg)"
            flat
            dense
            round
            size="sm"
            icon="delete"
            :aria-label="t('delete')"
            @click="$emit('delete', msg.id)">
            <q-tooltip>{{ t('delete') }}</q-tooltip>
          </q-btn>
        </div>
        <div>{{ msg.body }}</div>
      </div>
      <p
        v-if="!messages.length"
        class="text-caption"
        style="opacity: 0.7">
        {{ t('telehealthChatEmpty') }}
      </p>
    </div>
    <div
      v-if="canSend"
      class="row q-gutter-sm items-end">
      <q-input
        v-model="draft"
        dense
        outlined
        dark
        class="col"
        :maxlength="maxLength"
        :placeholder="t('telehealthChatPlaceholder')"
        @keyup.enter="onSend"
      />
      <q-btn
        unelevated
        color="primary"
        icon="send"
        :disable="!draftTrimmed"
        :aria-label="t('telehealthChatSend')"
        @click="onSend">
        <q-tooltip>{{ t('telehealthChatSend') }}</q-tooltip>
      </q-btn>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { telehealthChatBodyMaxLength } from 'components/constants.js'

const props = defineProps({
  messages: { type: Array, default: () => [] },
  canSend: { type: Boolean, default: true },
  canDeleteAny: { type: Boolean, default: false },
  selfParticipantId: { type: [Number, String], default: null },
})

const emit = defineEmits(['send', 'delete'])
const { t } = useI18n()
const draft = ref('')
const maxLength = telehealthChatBodyMaxLength
const draftTrimmed = computed(() => String(draft.value ?? '').trim())

function canDeleteMessage(msg) {
  if (props.canDeleteAny) {
    return true
  }
  if (props.selfParticipantId == null || msg?.participantId == null) {
    return false
  }

  return Number(msg.participantId) === Number(props.selfParticipantId)
}

function onSend() {
  const text = draftTrimmed.value
  if (!text) {
    return
  }
  emit('send', text)
  draft.value = ''
}
</script>
