import * as THREE from 'three'
import * as xb from 'xrblocks'

const _offset = new THREE.Vector3()
const _forward = new THREE.Vector3()

/**
 * Distance panels sit in front of the viewer (meters, camera-local −Z).
 * @returns {number}
 */
export function panelViewDistance() {
  return Math.min(xb.user.panelDistance * 0.5, 1.05)
}

/**
 * Place a spatial panel in front of the active camera with a local offset.
 * Local axes: +X right, +Y up, −Z forward (view direction).
 *
 * @param {import('xrblocks').SpatialPanel} panel
 * @param {number} localX
 * @param {number} localY
 * @param {number} localZ negative = in front of the user
 */
export function placePanelFacingUser(panel, localX, localY, localZ) {
  const cam = xb.camera
  _offset.set(localX, localY, localZ)
  _offset.applyQuaternion(cam.quaternion)
  panel.position.copy(cam.position).add(_offset)
  panel.quaternion.copy(cam.quaternion)
}

/**
 * @returns {boolean} True when an immersive WebXR session is active (not desktop simulator).
 */
export function isImmersiveSession() {
  return Boolean(xb.core?.renderer?.xr?.isPresenting) && !xb.core?.simulatorRunning
}
