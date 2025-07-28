import { defineStore } from 'pinia'
import { siteBreakpoints } from 'components/constants.js'

export const useViewStore = defineStore('view', {
  state: () => ({
    windowWidth: null,
  }),
  getters: {
    isMobileView: (state) => state.windowWidth <= siteBreakpoints.MOBILE,
    isTabletView: (state) => state.windowWidth > siteBreakpoints.MOBILE
      && state.windowWidth < siteBreakpoints.TABLET,
    isDesktopView: (state) => state.windowWidth >= siteBreakpoints.TABLET,
  },
  actions: {
    setWindowWidth(windowWidth) {
      this.windowWidth = windowWidth
    },
  }
})
