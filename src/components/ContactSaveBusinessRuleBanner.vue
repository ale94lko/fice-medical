<template>
  <div
    v-if="banner"
    class="contact-save-business-rule-banner q-mb-md"
    role="alert"
    data-testid="add-client-contact-save-business-rule-banner">
    <div class="contact-save-business-rule-banner__icon-wrap">
      <q-icon
        :name="banner.icon"
        size="28px"
        class="contact-save-business-rule-banner__icon"
      />
    </div>
    <div class="contact-save-business-rule-banner__content">
      <p
        v-if="banner.title"
        class="contact-save-business-rule-banner__title q-mb-xs">
        {{ banner.title }}
      </p>
      <p class="contact-save-business-rule-banner__message q-mb-none">
        {{ banner.message }}
      </p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  resolveContactSaveBusinessRuleBanner,
} from 'src/utils/client-contact-save-business-rule.js'

const props = defineProps({
  errorKey: { type: String, default: null },
})

const { t } = useI18n()

const banner = computed(() =>
  resolveContactSaveBusinessRuleBanner(props.errorKey, t),
)
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables.scss';

.contact-save-business-rule-banner {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border: 1px solid rgba($negative, 0.22);
  border-radius: $radius-md;
  background: rgba($negative, 0.05);
}

.contact-save-business-rule-banner__icon-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: rgba($negative, 0.12);
}

.contact-save-business-rule-banner__icon {
  color: $negative;
}

.contact-save-business-rule-banner__title {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.35;
  color: $text-strong;
}

.contact-save-business-rule-banner__message {
  font-size: 14px;
  line-height: 1.45;
  color: $text-muted;
}
</style>
