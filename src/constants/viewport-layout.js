import {
  drawerMobileMaxPx,
  siteBreakpointsPx,
} from 'components/constants.js'

/**
 * Viewport layout class names applied on document.body / #q-app.
 *
 * Use `vp-*` (not bare `.mobile` / `.desktop`) so we never clash with
 * Quasar Platform body classes (`mobile` / `desktop`).
 *
 * Prefer CSS under these classes over @media when fixing responsive UI,
 * so laptop/desktop styles stay isolated from mobile/tablet changes.
 */
export const viewportLayoutClassNames = {
  mobile: 'vp-mobile',
  tablet: 'vp-tablet',
  desktop: 'vp-desktop',
}

/** Inclusive max width for `.vp-mobile` (matches drawer overlay). */
export const viewportMobileMaxPx = drawerMobileMaxPx

/**
 * Inclusive max width for `.vp-tablet`.
 * Widths above this are `.vp-desktop` (>= siteBreakpointsPx.MD).
 */
export const viewportTabletMaxPx = siteBreakpointsPx.MD - 1

export const viewportLayoutValues = {
  mobile: 'mobile',
  tablet: 'tablet',
  desktop: 'desktop',
}

/**
 * @param {number} width
 * @returns {'mobile' | 'tablet' | 'desktop'}
 */
export function resolveViewportLayout(width) {
  const w = Number(width) || 0
  if (w <= viewportMobileMaxPx) {
    return viewportLayoutValues.mobile
  }
  if (w <= viewportTabletMaxPx) {
    return viewportLayoutValues.tablet
  }

  return viewportLayoutValues.desktop
}

export function viewportLayoutClassList(layout) {
  return {
    [viewportLayoutClassNames.mobile]:
      layout === viewportLayoutValues.mobile,
    [viewportLayoutClassNames.tablet]:
      layout === viewportLayoutValues.tablet,
    [viewportLayoutClassNames.desktop]:
      layout === viewportLayoutValues.desktop,
  }
}
