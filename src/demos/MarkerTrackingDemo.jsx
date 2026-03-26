import { useEffect, useRef, useState } from 'react'
import 'xrblocks/addons/simulator/SimulatorAddons.js'
import * as xb from 'xrblocks'
import { applyMarkerDemoFormFactor } from '../xr/applyMarkerDemoFormFactor.js'
import { applySimulatorAutostart } from '../xr/applySimulatorAutostart.js'
import {
  applyWebXRImageTracking,
  createMarkerImageBitmap,
  downloadPrintableMarkerPNG,
} from '../xr/configureWebXRImageTracking.js'
import { MarkerTrackingScene } from './MarkerTrackingScene.js'

/**
 * WebXR image tracking (browser-native): requests optional `image-tracking` and
 * a `trackedImages` entry, then updates a scene object from `getImageTrackingResults`.
 * Fails with a clear on-page message when WebXR, the feature, or frame APIs are missing.
 */
export default function MarkerTrackingDemo() {
  const canvasRef = useRef(null)
  const [banner, setBanner] = useState(null)

  useEffect(() => {
    if (globalThis.__XR_BLOCKS_INIT__) return
    globalThis.__XR_BLOCKS_INIT__ = true

    async function run() {
      const canvas = canvasRef.current
      if (!canvas) return

      if (typeof navigator === 'undefined' || !navigator.xr) {
        setBanner(
          'WebXR is not available in this browser. Use a WebXR-capable browser (e.g. Quest Browser) over HTTPS.',
        )
        return
      }

      let bitmap
      try {
        bitmap = await createMarkerImageBitmap()
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        setBanner(`Could not prepare tracking image: ${msg}`)
        return
      }

      applyWebXRImageTracking(xb.core.webXRSettings, bitmap, {
        widthInMeters: 0.25,
      })

      xb.add(new MarkerTrackingScene(setBanner))

      const options = new xb.Options()
      options.canvas = canvas
      options.setAppTitle('Image tracking')
      applyMarkerDemoFormFactor(options)
      await applySimulatorAutostart(options)

      try {
        await xb.init(options)
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err)
        setBanner(`XR Blocks failed to initialize: ${msg}`)
      }
    }

    void run()
  }, [])

  return (
    <>
      <div className="demo-marker-download">
        <button
          type="button"
          className="demo-marker-download-btn"
          onClick={() => downloadPrintableMarkerPNG()}
        >
          Download printable marker (PNG)
        </button>
        <p className="demo-marker-download-hint">
          Use this file for printing — it matches the runtime tracking image
          pixel-for-pixel. Print at 25&nbsp;cm wide to match the default
          physical size (see <code>widthInMeters</code> in the demo).
        </p>
      </div>
      {banner ? (
        <div className="demo-status-banner" role="status">
          {banner}
        </div>
      ) : null}
      <canvas ref={canvasRef} className="xb-canvas" />
    </>
  )
}
