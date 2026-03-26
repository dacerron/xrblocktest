import {
  DEFAULT_DEVICE_CAMERA_HEIGHT,
  DEFAULT_DEVICE_CAMERA_WIDTH,
} from 'xrblocks'

/**
 * Requests camera access in a **user gesture** (tap/click). Browsers (especially
 * Android Chrome) often block or skip prompts when `getUserMedia` runs only after
 * WebXR starts (e.g. `offerSession`) without a prior gesture-driven call.
 *
 * Mirrors xrblocks `xrDeviceCameraEnvironmentOptions` constraints, then stops
 * tracks so the hardware is not left running until XR Blocks opens its stream.
 *
 * @returns {Promise<{ ok: boolean, error?: string }>}
 */
export async function requestMarkerCameraPermission() {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    return { ok: false, error: 'Camera API is not available (needs HTTPS).' }
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'environment',
        width: { ideal: DEFAULT_DEVICE_CAMERA_WIDTH },
        height: { ideal: DEFAULT_DEVICE_CAMERA_HEIGHT },
      },
    })
    stream.getTracks().forEach((t) => t.stop())
    return { ok: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { ok: false, error: message }
  }
}
