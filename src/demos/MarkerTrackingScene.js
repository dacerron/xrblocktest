import * as THREE from 'three'
import * as xb from 'xrblocks'

/** Same CDN and path as `ModelViewerScene` (`models/Cat/cat.gltf`). */
const ASSETS_BASE_URL = 'https://cdn.jsdelivr.net/gh/xrblocks/assets@main/'

/**
 * Places the Model Viewer cat on the tracked image when the browser exposes
 * `XRFrame.getImageTrackingResults` and the session enables `image-tracking`.
 */
export class MarkerTrackingScene extends xb.Script {
  /**
   * @param {(message: string | null) => void} [onStatus] - Human-readable status; null clears.
   */
  constructor(onStatus) {
    super()
    this.onStatus = onStatus
    this.referenceSpace = null
    this.imageTrackingEnabled = false
    this._warnedNoFrameApi = false
    this._tmpMatrix = new THREE.Matrix4()
    this._catLoadStarted = false
  }

  init() {
    this.add(new THREE.HemisphereLight(0xffffff, 0x444444, 2.5))

    this.markerRoot = new THREE.Group()
    this.markerRoot.visible = false
    this.add(this.markerRoot)
  }

  onXRSessionStarted(session) {
    void this._bootstrapSession(session)
  }

  async _bootstrapSession(session) {
    const features = session.enabledFeatures
    const enabled =
      Array.isArray(features) && features.includes('image-tracking')

    this.imageTrackingEnabled = enabled

    if (!enabled) {
      this.onStatus?.(
        'Image tracking is not enabled for this session. The browser may not support it, or the optional feature was not granted.',
      )
      return
    }

    try {
      this.referenceSpace = await session.requestReferenceSpace('local')
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : String(err)
      this.onStatus?.(`Could not create XR reference space: ${msg}`)
      this.referenceSpace = null
      return
    }

    this.onStatus?.(null)
    void this._loadCatModel()
  }

  /**
   * Loads the same animated cat GLTF as the model viewer demo, parented to the
   * marker root (only after `image-tracking` is enabled).
   */
  async _loadCatModel() {
    if (this._catLoadStarted) {
      return
    }
    this._catLoadStarted = true

    const model = new xb.ModelViewer({})
    model.draggable = false
    model.rotatable = false
    model.scalable = false

    this.markerRoot.add(model)

    try {
      await model.loadGLTFModel({
        data: {
          scale: { x: 0.1, y: 0.1, z: 0.1 },
          path: ASSETS_BASE_URL,
          model: 'models/Cat/cat.gltf',
        },
        setupRaycastCylinder: false,
        setupPlatform: false,
        renderer: xb.core.renderer,
      })
      if (!this.imageTrackingEnabled) {
        this.markerRoot.remove(model)
        return
      }
      // Slight lift so feet sit above the image plane (avoids z-fighting).
      model.position.set(0, 0.04, 0)
    } catch (err) {
      this.markerRoot.remove(model)
      const msg = err instanceof Error ? err.message : String(err)
      this.onStatus?.(`Could not load cat model: ${msg}`)
      const box = new THREE.Mesh(
        new THREE.BoxGeometry(0.06, 0.06, 0.06),
        new THREE.MeshStandardMaterial({
          color: 0xaa3bff,
          metalness: 0.2,
          roughness: 0.4,
        }),
      )
      box.position.set(0, 0.03, 0)
      this.markerRoot.add(box)
    }
  }

  onXRSessionEnded() {
    this.referenceSpace = null
    this.imageTrackingEnabled = false
    this.markerRoot.visible = false
    this._warnedNoFrameApi = false
    this._catLoadStarted = false
    this.markerRoot.clear()
  }

  update(_time, frame) {
    if (!this.imageTrackingEnabled || !this.referenceSpace) {
      return
    }
    if (!frame || typeof frame.getImageTrackingResults !== 'function') {
      if (!this._warnedNoFrameApi) {
        this._warnedNoFrameApi = true
        this.onStatus?.(
          'Image tracking APIs are not available on this frame (e.g. desktop simulator or older runtime). Use a supported AR browser on device.',
        )
      }
      return
    }

    const results = frame.getImageTrackingResults()
    if (!results?.length) {
      this.markerRoot.visible = false
      return
    }

    let pose = null
    for (const result of results) {
      const state = result.trackingState
      if (state !== 'tracked' && state !== 'emulated') {
        continue
      }
      const p = frame.getPose(result.imageSpace, this.referenceSpace)
      if (p) {
        pose = p
        break
      }
    }

    if (!pose?.transform?.matrix) {
      this.markerRoot.visible = false
      return
    }

    this._tmpMatrix.fromArray(pose.transform.matrix)
    this.markerRoot.matrix.copy(this._tmpMatrix)
    this.markerRoot.matrixAutoUpdate = false
    this.markerRoot.visible = true
  }
}
