import {
  computed,
  onUnmounted,
  ref,
  unref,
  watch,
} from 'vue'

const appPageTitle = ref('')
let syncGeneration = 0

/**
 * Shared page title for the mobile app header (next to the menu button).
 * List/page headers call useSyncAppPageTitle(); MainLayout reads it.
 */
export function useAppPageTitle() {
  return {
    appPageTitle: computed(() => appPageTitle.value),
  }
}

/**
 * Keep the mobile header title in sync with a page header title prop.
 * @param {import('vue').MaybeRefOrGetter<string>} titleSource
 */
export function useSyncAppPageTitle(titleSource) {
  const generation = ++syncGeneration

  watch(
    () => unref(titleSource),
    value => {
      if (generation !== syncGeneration) {
        return
      }
      appPageTitle.value = String(value ?? '').trim()
    },
    { immediate: true },
  )

  onUnmounted(() => {
    if (generation === syncGeneration) {
      appPageTitle.value = ''
    }
  })
}
