<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    data-testid="active-encounter-auto-complete-dialog"
    transition-show="scale"
    transition-hide="scale"
    @update:model-value="onUpdateOpen">
    <q-card class="active-encounter-auto-complete app-dialog-card">
      <q-card-section class="active-encounter-auto-complete__body">
        <div
          class="active-encounter-auto-complete__icon-wrap"
          aria-hidden="true">
          <q-icon name="timer" size="26px" />
        </div>

        <h2 class="active-encounter-auto-complete__title">
          {{ t('activeEncounterAutoCompleteTitle') }}
        </h2>

        <p class="active-encounter-auto-complete__message">
          {{ t('activeEncounterAutoCompleteMessage') }}
        </p>

        <div
          class="active-encounter-auto-complete__timer"
          :class="{
            'active-encounter-auto-complete__timer--urgent':
              countdownSeconds <= 3,
          }"
          role="timer"
          :aria-live="countdownSeconds <= 3 ? 'assertive' : 'polite'"
          :aria-label="t('activeEncounterAutoCompleteCountdownAria', {
            seconds: countdownSeconds,
          })">
          <p class="active-encounter-auto-complete__timer-label">
            {{ t('activeEncounterAutoCompleteCountdownHint') }}
          </p>
          <p class="active-encounter-auto-complete__timer-value">
            {{ countdownSeconds }}
            <span class="active-encounter-auto-complete__timer-unit">
              {{ t('activeEncounterAutoCompleteSeconds') }}
            </span>
          </p>
        </div>

        <div class="active-encounter-auto-complete__actions">
          <q-btn
            no-caps
            unelevated
            dense
            outline
            color="primary"
            class="app-btn-outline active-encounter-auto-complete__btn"
            :disable="busy"
            :label="t('activeEncounterAutoCompleteNow')"
            data-testid="active-encounter-auto-complete-now"
            @click="emit('complete')"
          />
          <q-btn
            no-caps
            unelevated
            dense
            color="primary"
            class="app-btn-primary active-encounter-auto-complete__btn"
            :disable="busy"
            :loading="busy"
            :label="t('activeEncounterContinue')"
            data-testid="active-encounter-auto-complete-continue"
            @click="emit('continue')"
          />
        </div>

        <p class="active-encounter-auto-complete__footer">
          <q-icon name="medical_services" size="12px" />
          <span>{{ t('activeEncounterAutoCompleteFooter') }}</span>
        </p>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  countdownSeconds: {
    type: Number,
    default: 10,
  },
  busy: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'continue', 'complete'])

const { t } = useI18n()

function onUpdateOpen(open) {
  if (!open) {
    emit('continue')

    return
  }
  emit('update:modelValue', open)
}
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables.scss';

.active-encounter-auto-complete {
  width: min(100%, 440px);
  max-width: 440px;

  &__body {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    padding: 24px 22px 20px;
  }

  &__icon-wrap {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    margin-bottom: 14px;
    border-radius: 50%;
    background: rgba($primary, 0.12);
    color: $primary;
  }

  &__title {
    margin: 0 0 10px;
    font-size: 1.125rem;
    font-weight: 700;
    line-height: 1.25;
    color: $text-strong;
    letter-spacing: -0.02em;
  }

  &__message {
    margin: 0;
    max-width: 34ch;
    font-size: 0.875rem;
    line-height: 1.45;
    color: $table-text-secondary;
  }

  &__timer {
    width: 100%;
    margin-top: 18px;
    padding: 14px 16px;
    border-radius: $radius-md;
    background: rgba($primary, 0.08);
    border: 1px solid rgba($primary, 0.16);
    transition:
      background-color 0.2s ease,
      border-color 0.2s ease;
  }

  &__timer--urgent {
    background: rgba($warning, 0.14);
    border-color: rgba($warning, 0.28);

    .active-encounter-auto-complete__timer-label,
    .active-encounter-auto-complete__timer-value,
    .active-encounter-auto-complete__timer-unit {
      color: $warning;
    }
  }

  &__timer-label {
    margin: 0 0 6px;
    font-size: 0.75rem;
    font-weight: 600;
    line-height: 1.3;
    color: $primary;
  }

  &__timer-value {
    margin: 0;
    display: inline-flex;
    align-items: baseline;
    justify-content: center;
    gap: 6px;
    font-size: 2rem;
    font-weight: 700;
    line-height: 1;
    letter-spacing: 0.02em;
    color: $primary;
    font-variant-numeric: tabular-nums;
  }

  &__timer-unit {
    font-size: 0.8125rem;
    font-weight: 600;
    letter-spacing: 0.01em;
    opacity: 0.9;
  }

  &__actions {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px;
    width: 100%;
    margin-top: 18px;
  }

  &__btn {
    min-width: min(100%, 150px);
    flex: 1 1 0;
    min-height: 36px;
    padding-left: 10px !important;
    padding-right: 10px !important;
    font-size: 0.8125rem;
  }

  &__footer {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 5px;
    margin: 14px 0 0;
    font-size: 0.75rem;
    line-height: 1.35;
    color: $text-muted;

    .q-icon {
      color: $text-muted;
    }
  }
}
</style>
