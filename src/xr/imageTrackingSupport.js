/**
 * Best-effort detection before an XR session. There is no standard
 * `navigator.xr.isImageTrackingSupported()`; we combine AR session support
 * with presence of `XRFrame.getImageTrackingResults` when exposed on the prototype.
 *
 * @returns {Promise<{ ok: boolean, message?: string }>}
 */
export async function detectImageTrackingSupport() {
  if (typeof navigator === 'undefined' || !navigator.xr) {
    return {
      ok: false,
      message:
        'WebXR is not available. Use a compatible browser (e.g. Chrome with AR, Meta Quest Browser) over HTTPS.',
    }
  }

  let arSupported = false
  try {
    arSupported = await navigator.xr.isSessionSupported('immersive-ar')
  } catch {
    return {
      ok: false,
      message:
        'Could not query immersive AR support. Image tracking needs an immersive-ar session.',
    }
  }

  if (!arSupported) {
    return {
      ok: false,
      message:
        'Immersive AR is not supported here. Image tracking requires a device and browser that support immersive-ar.',
    }
  }

  // Some runtimes (e.g. Meta Quest Browser) may not hang getImageTrackingResults
  // on XRFrame.prototype until a session exists — skip to avoid false alarms.
  if (isLikelyQuestOrMetaBrowser()) {
    return { ok: true }
  }

  if (typeof XRFrame !== 'undefined' && XRFrame.prototype) {
    if (typeof XRFrame.prototype.getImageTrackingResults !== 'function') {
      return {
        ok: false,
        message:
          'This browser does not expose WebXR image tracking (XRFrame.getImageTrackingResults). Try an up-to-date Chrome / Edge with AR, or Meta Quest Browser. Flags or OS support may be required.',
      }
    }
  }

  return { ok: true }
}

function isLikelyQuestOrMetaBrowser() {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : ''
  return /OculusBrowser|Quest|Meta Quest|SamsungBrowser.*VR/i.test(ua)
}
