import { nextTick } from 'vue'
import { useQuasar } from 'quasar'
import { useI18n } from 'vue-i18n'
import { quasarNotifyTypes } from 'components/constants.js'

const PANEL_SCROLL_SELECTOR = '.panel-scroll'

/**
 * Scrolls a dialog body or the Add Client tab panel to top so validation
 * messages are visible after a failed save.
 */
export function useValidationSaveFeedback() {
  const $q = useQuasar()
  const { t } = useI18n()

  function resolveScrollNode(scrollTargetRef) {
    const el = scrollTargetRef?.value
    if (el && typeof el.scrollTop === 'number') {
      return el
    }
    const panel = document.querySelector(PANEL_SCROLL_SELECTOR)
    if (panel && typeof panel.scrollTop === 'number') {
      return panel
    }

    return null
  }

  async function scrollValidationErrorsIntoView(scrollTargetRef) {
    await nextTick()
    const node = resolveScrollNode(scrollTargetRef)
    if (node) {
      node.scrollTop = 0
    }
  }

  async function notifyAndScrollToValidationErrors(
    scrollTargetRef,
    { skipNotify = false } = {},
  ) {
    if (!skipNotify) {
      $q.notify({
        type: quasarNotifyTypes.negative,
        message: t('validationFixErrorsBeforeProceed'),
        position: 'top',
      })
    }
    await scrollValidationErrorsIntoView(scrollTargetRef)
  }

  return {
    notifyAndScrollToValidationErrors,
    scrollValidationErrorsIntoView,
  }
}
