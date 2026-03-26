const DEFAULT_MARKER_SIZE = 512

/**
 * Draws the same high-contrast asymmetric pattern used for WebXR `trackedImages`.
 * The printable file must match these pixels exactly (use {@link downloadPrintableMarkerPNG}).
 *
 * @param {HTMLCanvasElement} canvas
 * @param {number} [size]
 */
export function drawMarkerCanvas(canvas, size = DEFAULT_MARKER_SIZE) {
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  if (!ctx) {
    throw new Error('2D canvas is not available.')
  }
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, size, size)
  ctx.fillStyle = '#000000'
  const block = size / 8
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      if ((row * 7 + col * 3) % 5 === 0) {
        ctx.fillRect(col * block, row * block, block, block)
      }
    }
  }
}

/**
 * Builds a high-contrast asymmetric pattern and returns an ImageBitmap for
 * WebXR `trackedImages` (browser-native image tracking).
 */
export async function createMarkerImageBitmap() {
  const canvas = document.createElement('canvas')
  drawMarkerCanvas(canvas)
  if (typeof createImageBitmap !== 'function') {
    throw new Error('createImageBitmap is not supported in this browser.')
  }
  return createImageBitmap(canvas)
}

/**
 * Downloads a PNG that is pixel-identical to the runtime tracking image — print this
 * at the same physical width you pass as `widthInMeters` (default 0.25 m).
 *
 * @param {string} [filename]
 */
export function downloadPrintableMarkerPNG(filename = 'xr-marker-print.png') {
  const canvas = document.createElement('canvas')
  drawMarkerCanvas(canvas)
  canvas.toBlob((blob) => {
    if (!blob) {
      return
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.rel = 'noopener'
    a.click()
    URL.revokeObjectURL(url)
  }, 'image/png')
}

/**
 * Mutates the xrblocks `webXRSettings` object (same reference passed as
 * WebXR session init) so the next `requestSession` includes optional
 * `image-tracking` and `trackedImages`. Must run **before** `xb.init()`.
 *
 * @param {Record<string, unknown>} webXRSettings - `xb.core.webXRSettings`
 * @param {ImageBitmap} imageBitmap
 * @param {{ widthInMeters?: number }} [opts]
 */
export function applyWebXRImageTracking(webXRSettings, imageBitmap, opts = {}) {
  const widthInMeters = opts.widthInMeters ?? 0.25
  const merged = new Set([
    'image-tracking',
    ...(webXRSettings.optionalFeatures || []),
  ])
  webXRSettings.optionalFeatures = [...merged]
  webXRSettings.trackedImages = [{ image: imageBitmap, widthInMeters }]
}
