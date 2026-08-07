import { useViewportLayout } from 'src/composables/useViewportLayout.js'

/**
 * Shared mobile grid (card) mode for AdminQTable list pages.
 * Uses the app `.vp-mobile` viewport (≤ 499px).
 */
export function useAdminTableMobileGrid() {
  const { isMobile } = useViewportLayout()

  return {
    showGrid: isMobile,
  }
}
