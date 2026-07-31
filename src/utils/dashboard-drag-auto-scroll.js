/**
 * Smooth auto-scroll while dragging near the top/bottom edge.
 */

const EDGE_PX = 140
/** Max scroll speed in px/second (frame-rate independent). */
const MAX_SPEED_PX_S = 920
/** How quickly velocity eases toward the target (higher = snappier). */
const VELOCITY_LERP = 0.12
/** Stop the loop when |velocity| falls below this (px/s). */
const VELOCITY_EPS = 2

function isDocumentScroller(node) {
  return node === document.documentElement
    || node === document.body
    || node === document.scrollingElement
}

function overflowAllowsScroll(node) {
  if (!node || isDocumentScroller(node)) {
    return true
  }
  const style = window.getComputedStyle(node)
  const overflowY = style.overflowY

  return overflowY === 'auto'
    || overflowY === 'scroll'
    || overflowY === 'overlay'
}

function canScroll(node) {
  if (!node) {
    return false
  }
  if (isDocumentScroller(node)) {
    const el = document.scrollingElement || document.documentElement

    return el.scrollHeight > el.clientHeight + 1
  }
  if (!overflowAllowsScroll(node)) {
    return false
  }

  return node.scrollHeight > node.clientHeight + 1
}

export function findScrollParent(startEl) {
  const page = startEl?.closest?.('.dashboard-page')
    || document.querySelector('.dashboard-page')
  // Prefer the dashboard page even before content overflows so
  // drag-edge scroll targets the right container once it can move.
  if (page && overflowAllowsScroll(page)) {
    return page
  }

  let node = startEl
  while (node && node !== document.documentElement) {
    if (canScroll(node)) {
      return node
    }
    node = node.parentElement
  }

  const byId = document.getElementById('app-content-root')
  if (canScroll(byId)) {
    return byId
  }

  const root = document.scrollingElement || document.documentElement
  if (canScroll(root)) {
    return root
  }

  return page || root
}

/** Ease-in curve: soft near the edge start, faster deeper in. */
function easeInQuad(t) {
  return t * t
}

export function createDragAutoScroll() {
  let container = null
  let targetVelocity = 0
  let velocity = 0
  let carry = 0
  let rafId = null
  let lastTs = 0
  let active = false

  function stopLoop() {
    targetVelocity = 0
    velocity = 0
    carry = 0
    lastTs = 0
    if (rafId != null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
  }

  function applyScroll(delta) {
    if (!container || !delta) {
      return
    }
    if (isDocumentScroller(container)) {
      window.scrollBy({ top: delta, left: 0, behavior: 'auto' })
      return
    }
    const max = Math.max(0, container.scrollHeight - container.clientHeight)
    container.scrollTop = Math.min(
      max,
      Math.max(0, container.scrollTop + delta),
    )
  }

  function tick(ts) {
    if (!active) {
      rafId = null
      return
    }
    if (!lastTs) {
      lastTs = ts
    }
    const dt = Math.min(0.05, (ts - lastTs) / 1000)
    lastTs = ts

    velocity += (targetVelocity - velocity) * VELOCITY_LERP
    if (
      Math.abs(targetVelocity) < VELOCITY_EPS
      && Math.abs(velocity) < VELOCITY_EPS
    ) {
      stopLoop()
      return
    }

    carry += velocity * dt
    const step = carry > 0 ? Math.floor(carry) : Math.ceil(carry)
    if (step !== 0) {
      applyScroll(step)
      carry -= step
    }

    rafId = requestAnimationFrame(tick)
  }

  function ensureLoop() {
    if (rafId == null) {
      lastTs = 0
      rafId = requestAnimationFrame(tick)
    }
  }

  function edgeBounds() {
    if (!container || isDocumentScroller(container)) {
      return { top: 0, bottom: window.innerHeight }
    }
    const rect = container.getBoundingClientRect()

    return { top: rect.top, bottom: rect.bottom }
  }

  function updateFromClientY(clientY) {
    if (!active || !Number.isFinite(clientY)) {
      return
    }
    if (!container) {
      container = findScrollParent(
        document.querySelector('.dashboard-page__grid'),
      )
    }
    const { top, bottom } = edgeBounds()
    let nextTarget = 0
    if (clientY < top + EDGE_PX) {
      const raw = Math.min(
        1,
        Math.max(0, (top + EDGE_PX - clientY) / EDGE_PX),
      )
      nextTarget = -MAX_SPEED_PX_S * easeInQuad(raw)
    } else if (clientY > bottom - EDGE_PX) {
      const raw = Math.min(
        1,
        Math.max(0, (clientY - (bottom - EDGE_PX)) / EDGE_PX),
      )
      nextTarget = MAX_SPEED_PX_S * easeInQuad(raw)
    }
    targetVelocity = nextTarget
    if (targetVelocity || Math.abs(velocity) >= VELOCITY_EPS) {
      ensureLoop()
    }
  }

  function onDocumentDragOver(event) {
    // Required so dragover keeps firing during HTML5 DnD.
    event.preventDefault()
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move'
    }
    updateFromClientY(event.clientY)
  }

  function onDocumentDrag(event) {
    if (Number.isFinite(event.clientY) && event.clientY > 0) {
      updateFromClientY(event.clientY)
    }
  }

  function start(anchorEl) {
    stop()
    active = true
    container = findScrollParent(anchorEl)
    document.addEventListener('dragover', onDocumentDragOver, true)
    document.addEventListener('drag', onDocumentDrag, true)
  }

  function stop() {
    active = false
    document.removeEventListener('dragover', onDocumentDragOver, true)
    document.removeEventListener('drag', onDocumentDrag, true)
    stopLoop()
    container = null
  }

  return { start, stop, updateFromClientY }
}
