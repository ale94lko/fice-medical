import {
  computed,
  onBeforeUnmount,
  onMounted,
  watch,
} from 'vue'
import { useQuasar } from 'quasar'
import {
  resolveViewportLayout,
  viewportLayoutClassList,
  viewportLayoutClassNames,
  viewportLayoutValues,
} from 'src/constants/viewport-layout.js'

const ROOT_CLASS_NAMES = Object.values(viewportLayoutClassNames)

function readWindowWidth($q) {
  const quasarWidth = $q.screen.width
  if (typeof window === 'undefined') {
    return quasarWidth
  }

  return Math.max(quasarWidth, window.innerWidth)
}

function clearViewportClasses(el) {
  if (!el?.classList) {
    return
  }
  ROOT_CLASS_NAMES.forEach(name => {
    el.classList.remove(name)
  })
}

function applyViewportClasses(el, layout) {
  if (!el?.classList) {
    return
  }
  // Drop legacy width-only `tablet` class (never used by Quasar Platform).
  // Do not touch bare `mobile` / `desktop` — Quasar owns those.
  el.classList.remove('tablet')

  const next = viewportLayoutClassList(layout)
  ROOT_CLASS_NAMES.forEach(name => {
    el.classList.toggle(name, Boolean(next[name]))
  })
}

/**
 * Shared viewport layout for the whole app.
 * Syncs `.vp-mobile` / `.vp-tablet` / `.vp-desktop` on body and #q-app.
 */
export function useViewportLayout({ syncDocument = false } = {}) {
  const $q = useQuasar()

  const windowWidth = computed(() => readWindowWidth($q))

  const layout = computed(() => resolveViewportLayout(windowWidth.value))

  const isMobile = computed(
    () => layout.value === viewportLayoutValues.mobile,
  )
  const isTablet = computed(
    () => layout.value === viewportLayoutValues.tablet,
  )
  const isDesktop = computed(
    () => layout.value === viewportLayoutValues.desktop,
  )

  /** For template `:class="viewportClassList"` on a component root. */
  const viewportClassList = computed(() =>
    viewportLayoutClassList(layout.value),
  )

  function syncDocumentClasses() {
    if (typeof document === 'undefined') {
      return
    }
    applyViewportClasses(document.body, layout.value)
    applyViewportClasses(document.getElementById('q-app'), layout.value)
  }

  if (syncDocument) {
    watch(layout, () => {
      syncDocumentClasses()
    }, { immediate: true })

    onMounted(() => {
      syncDocumentClasses()
    })

    onBeforeUnmount(() => {
      if (typeof document === 'undefined') {
        return
      }
      clearViewportClasses(document.body)
      clearViewportClasses(document.getElementById('q-app'))
    })
  }

  return {
    windowWidth,
    layout,
    isMobile,
    isTablet,
    isDesktop,
    viewportClassList,
    syncDocumentClasses,
  }
}
