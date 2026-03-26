/**
 * Image-tracking demo: use XR Blocks `formFactor` `mobile` on phones/tablets so the
 * desktop simulator is not forced like desktop, and enable the environment camera
 * (`enableCamera('environment')`) for RGB alignment / passthrough integration.
 *
 * `?formFactor=mobile` is parsed by `xb.Options` before this runs; we only auto-detect
 * when `formFactor` is still `auto`.
 *
 * @param {object} options - `xb.Options` instance
 */
export function applyMarkerDemoFormFactor(options) {
  if (options.formFactor === 'auto' && isCoarseMobileDevice()) {
    options.formFactor = 'mobile'
  }
  if (options.formFactor === 'mobile') {
    options.enableCamera('environment')
  }
}

function isCoarseMobileDevice() {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return false
  }
  const coarse = window.matchMedia?.('(pointer: coarse)')?.matches
  if (coarse) {
    return true
  }
  const narrow = window.matchMedia?.('(max-width: 768px)')?.matches
  if (narrow) {
    return true
  }
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  )
}
