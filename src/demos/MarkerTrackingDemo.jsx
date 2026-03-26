import { useEffect, useRef, useState } from 'react'
import 'xrblocks/addons/simulator/SimulatorAddons.js'
import * as xb from 'xrblocks'
import { applyMarkerDemoFormFactor } from '../xr/applyMarkerDemoFormFactor.js'
import { applySimulatorAutostart } from '../xr/applySimulatorAutostart.js'
import { requestMarkerCameraPermission } from '../xr/requestMarkerCameraPermission.js'
import {
  applyWebXRImageTracking,
  createMarkerImageBitmap,
  downloadPrintableMarkerPNG,
} from '../xr/configureWebXRImageTracking.js'
import { detectImageTrackingSupport } from '../xr/imageTrackingSupport.js'
import { MarkerTrackingScene } from './MarkerTrackingScene.js'

/**
 * WebXR image tracking (browser-native): requests optional `image-tracking` and
 * a `trackedImages` entry, then updates a scene object from `getImageTrackingResults`.
 * Fails with a clear on-page message when WebXR, the feature, or frame APIs are missing.
 */
export default function MarkerTrackingDemo() {
  const canvasRef = useRef(null)
  const [banner, setBanner] = useState(null)
  /** When mobile form factor enables device camera, show an explicit tap-to-allow control (Android). */
  const [cameraGate, setCameraGate] = useState({
    visible: false,
    status: 'idle',
    lastError: null,
  })

  useEffect(() => {
    if (globalThis.__XR_BLOCKS_INIT__) return
    globalThis.__XR_BLOCKS_INIT__ = true

    async function run() {
      const canvas = canvasRef.current
      if (!canvas) return

      const trackingSupport = await detectImageTrackingSupport()
      if (!trackingSupport.ok && trackingSupport.message) {
        window.alert(
          `Image tracking may not work in this environment.\n\n${trackingSupport.message}`,
        )
      }

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

      if (options.permissions?.camera) {
        setCameraGate({
          visible: true,
          status: 'idle',
          lastError: null,
        })
      }

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
        {cameraGate.visible && cameraGate.status !== 'granted' ? (
          <div className="demo-marker-camera-prompt" role="region" aria-label="Camera access">
            <p className="demo-marker-camera-prompt-text">
              On Android, the camera permission must follow a tap. If you did not
              see a system prompt, tap below before or after &quot;Enter XR&quot;.
            </p>
            <button
              type="button"
              className="demo-marker-camera-prompt-btn"
              disabled={cameraGate.status === 'pending'}
              onClick={() => {
                void (async () => {
                  setCameraGate((g) => ({ ...g, status: 'pending', lastError: null }))
                  const r = await requestMarkerCameraPermission()
                  if (r.ok) {
                    setCameraGate((g) => ({ ...g, status: 'granted', visible: false }))
                  } else {
                    setCameraGate((g) => ({
                      ...g,
                      status: 'idle',
                      lastError: r.error ?? 'Unknown error',
                    }))
                  }
                })()
              }}
            >
              {cameraGate.status === 'pending' ? 'Requesting…' : 'Allow camera'}
            </button>
            {cameraGate.lastError ? (
              <p className="demo-marker-camera-prompt-err" role="alert">
                {cameraGate.lastError}
              </p>
            ) : null}
          </div>
        ) : null}
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
