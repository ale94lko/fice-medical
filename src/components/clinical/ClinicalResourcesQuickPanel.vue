<template>
  <q-btn
    flat
    round
    dense
    icon="menu_book"
    class="clinical-resources-quick-panel__trigger"
    :aria-label="t('navClinicalResources')"
    :data-testid="clinicalResourceTestIds.quickPanelTrigger"
  >
    <q-menu
      v-model="menuOpen"
      fit
      anchor="bottom right"
      self="top right"
      class="clinical-resources-quick-panel app-light-menu"
      :data-testid="clinicalResourceTestIds.quickPanelMenu"
      @before-show="onMenuBeforeShow">
      <q-card flat class="clinical-resources-quick-panel__card">
        <q-card-section class="clinical-resources-quick-panel__header">
          <div class="row items-center no-wrap q-gutter-sm">
            <div
              class="clinical-resources-quick-panel__header-icon"
              aria-hidden="true">
              <q-icon name="menu_book" size="18px" />
            </div>
            <div
              class="col text-subtitle1 text-weight-bold
                clinical-resources-quick-panel__header-title">
              {{ t('clinicalResourceQuickPanelTitle') }}
            </div>
            <q-btn
              flat
              round
              dense
              icon="close"
              class="clinical-resources-quick-panel__close-btn"
              :aria-label="t('close')"
              @click="closeMenu"
            />
          </div>
        </q-card-section>

        <q-card-section class="clinical-resources-quick-panel__body q-pt-none">
          <div
            v-if="!pinned.length"
            class="clinical-resources-quick-panel__empty text-body2
              text-grey-7">
            {{ t('clinicalResourceQuickPanelPinnedEmpty') }}
          </div>
          <div v-else class="clinical-resources-quick-panel__items">
            <div
              v-for="item in pinned.slice(0, clinicalResourcePinnedMax)"
              :key="item.id"
              class="clinical-resources-quick-panel__item"
              :data-testid="clinicalResourceTestIds.quickPanelItem(item.id)">
              <button
                type="button"
                class="clinical-resources-quick-panel__item-main"
                @click="onOpenResource(item)">
                <div
                  class="clinical-resources-quick-panel__item-icon"
                  aria-hidden="true">
                  <q-icon :name="item.typeIcon" size="16px" />
                </div>
                <div class="clinical-resources-quick-panel__item-content">
                  <div class="clinical-resources-quick-panel__item-title">
                    {{ item[fk.title] || '—' }}
                  </div>
                  <div
                    v-if="resolveItemDescription(item)"
                    class="clinical-resources-quick-panel__item-description">
                    {{ resolveItemDescription(item) }}
                  </div>
                </div>
              </button>
              <q-btn
                flat
                dense
                class="clinical-resources-quick-panel__item-action"
                :icon="resolveItemActionIcon(item)"
                :aria-label="resolveItemActionLabel(item)"
                @click="onItemAction(item)"
              />
            </div>
          </div>
        </q-card-section>

        <q-card-section
          class="clinical-resources-quick-panel__footer q-pt-none">
          <router-link
            :to="{ name: 'ClinicalResourcesList' }"
            class="clinical-resources-quick-panel__browse"
            :data-testid="clinicalResourceTestIds.quickPanelBrowseAll"
            @click="closeMenu">
            <div
              class="clinical-resources-quick-panel__browse-icon"
              aria-hidden="true">
              <q-icon name="folder_open" size="16px" />
            </div>
            <div class="clinical-resources-quick-panel__browse-content">
              <div class="clinical-resources-quick-panel__browse-title">
                {{ t('clinicalResourceQuickPanelBrowseAll') }}
              </div>
            </div>
            <q-icon
              name="arrow_forward"
              size="16px"
              class="clinical-resources-quick-panel__browse-arrow"
            />
          </router-link>
        </q-card-section>
      </q-card>
    </q-menu>
  </q-btn>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { useQuasar } from 'quasar'
import {
  clinicalResourceFieldKeys as fk,
  clinicalResourcePinnedMax,
  clinicalResourceTypeValues,
} from 'components/constants.js'
import { isAuthSessionEndUIError } from 'src/utils/api-session-error.js'
import { previewClinicalResourceDocument } from
  'src/utils/clinical-resource-document-actions.js'
import { listPinnedClinicalResources } from 'src/utils/clinical-resource-api.js'
import { clinicalResourceTestIds } from 'src/test-ids/index.js'

const { t } = useI18n()
const $q = useQuasar()
const router = useRouter()

const pinned = ref([])
const menuOpen = ref(false)

function trim(value) {
  return String(value ?? '').trim()
}

function resolveItemDescription(item) {
  const keywords = item[fk.keywords]
  if (Array.isArray(keywords) && keywords.length) {
    return trim(keywords[0])
  }

  const category = trim(item[fk.category])
  if (category) {
    return category
  }

  const subtitle = trim(item.subtitle)
  if (!subtitle) {
    return ''
  }

  return subtitle.length > 72 ? `${subtitle.slice(0, 69)}...` : subtitle
}

function isExternalLinkItem(item) {
  return item.type === clinicalResourceTypeValues.externalLink
}

function resolveItemActionIcon(item) {
  return isExternalLinkItem(item) ? 'open_in_new' : 'description'
}

function resolveItemActionLabel(item) {
  return isExternalLinkItem(item)
    ? t('clinicalResourceOpenExternal')
    : t('view')
}

async function loadPinned() {
  try {
    pinned.value = await listPinnedClinicalResources(t)
  } catch (error) {
    if (!isAuthSessionEndUIError(error)) {
      pinned.value = []
    }
  }
}

function onMenuBeforeShow() {
  void loadPinned()
}

function closeMenu() {
  menuOpen.value = false
}

function openExternalLink(item) {
  const url = trim(item[fk.url])
  if (url) {
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}

function isDocumentItem(item) {
  return item.type === clinicalResourceTypeValues.document
}

function openResourceListWithId(item) {
  void router.push({
    name: 'ClinicalResourcesList',
    query: { resourceId: String(item.id) },
  })
}

async function openDocumentItem(item) {
  const previewed = await previewClinicalResourceDocument(item.id, { t, $q })
  if (!previewed) {
    openResourceListWithId(item)
  }
}

function onOpenResource(item) {
  closeMenu()
  if (isExternalLinkItem(item)) {
    openExternalLink(item)

    return
  }
  if (isDocumentItem(item)) {
    void openDocumentItem(item)

    return
  }
  openResourceListWithId(item)
}

function onItemAction(item) {
  closeMenu()
  if (isExternalLinkItem(item)) {
    openExternalLink(item)

    return
  }
  if (isDocumentItem(item)) {
    void openDocumentItem(item)

    return
  }
  openResourceListWithId(item)
}

onMounted(() => {
  void loadPinned()
})
</script>

<style lang="scss" scoped>
@import 'src/css/quasar.variables.scss';

.clinical-resources-quick-panel {
  &__card {
    width: 420px;
    max-width: 92vw;
    border-radius: 12px;
    overflow: hidden;
  }

  &__header {
    padding: 14px 16px 10px;
  }

  &__header-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: $secondary-2;
    color: $primary;
    flex: 0 0 32px;
  }

  &__header-title {
    color: $text-strong;
    font-size: 0.9375rem;
    line-height: 1.2;
  }

  &__close-btn {
    color: $text-muted;
  }

  &__body {
    padding: 0 16px 6px;
  }

  &__empty {
    padding: 12px 8px;
    text-align: center;
  }

  &__items {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__item {
    display: flex;
    align-items: center;
    gap: 8px;
    min-height: 48px;
    padding: 2px;
    border: 1px solid $table-border;
    border-radius: 8px;
    background: $surface;
    transition: border-color 0.15s ease, box-shadow 0.15s ease;

    &:hover {
      border-color: rgba($primary, 0.28);
      box-shadow: 0 1px 6px rgba(15, 122, 116, 0.08);
    }
  }

  &__item-main {
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1 1 auto;
    min-width: 0;
    padding: 6px 2px 6px 8px;
    border: 0;
    background: transparent;
    text-align: left;
    cursor: pointer;
  }

  &__item-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    border: 1px solid $table-border;
    background: $surface;
    color: $primary;
    flex: 0 0 32px;
  }

  &__item-content {
    min-width: 0;
    flex: 1 1 auto;
  }

  &__item-title {
    font-size: 0.8125rem;
    font-weight: 600;
    line-height: 1.2;
    color: $text-strong;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__item-description {
    margin-top: 1px;
    font-size: 0.75rem;
    line-height: 1.2;
    color: $text-muted;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__item-action {
    flex: 0 0 30px;
    width: 30px;
    height: 30px;
    min-height: 30px;
    margin-right: 6px;
    padding: 0;
    border: 1px solid $table-border;
    border-radius: 6px;
    color: $primary;

    :deep(.q-icon) {
      font-size: 16px;
    }
  }

  &__footer {
    padding: 6px 16px 14px;
  }

  &__browse {
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 6px 10px;
    min-height: 34px;
    border-radius: 8px;
    background: $secondary-2;
    text-decoration: none;
    color: inherit;
    transition: background-color 0.15s ease;

    &:hover {
      background: rgba($primary, 0.12);
    }
  }

  &__browse-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 20px;
    color: $primary;
  }

  &__browse-content {
    flex: 1 1 auto;
    min-width: 0;
  }

  &__browse-title {
    font-size: 0.8125rem;
    font-weight: 600;
    line-height: 1.2;
    color: $primary;
  }

  &__browse-arrow {
    flex: 0 0 16px;
    color: $primary;
  }
}
</style>
