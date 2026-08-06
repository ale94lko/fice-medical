import { computed } from 'vue'
import { useQuasar } from 'quasar'
import { siteBreakpointsPx } from 'components/constants.js'

/**
 * Shared mobile grid (card) mode for AdminQTable list pages.
 * Matches Client / Staff list phone breakpoint.
 */
export function useAdminTableMobileGrid() {
  const $q = useQuasar()

  const showGrid = computed(
    () => $q.screen.width <= siteBreakpointsPx.XXS,
  )

  return { showGrid }
}
