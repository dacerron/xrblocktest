import * as THREE from 'three'
import * as xb from 'xrblocks'
import { isImmersiveSession } from './uiLayout.js'

/** Lift the playfield slightly above the detected plane surface (meters). */
export const BOARD_PLANE_OFFSET = 0.012

const _forward = new THREE.Vector3()

/**
 * XR Blocks keeps invisible DetectedPlane meshes in the scene for anchoring.
 * They still raycast and steal reticle / select hits from the game board.
 */
export function excludeDetectedPlanesFromRaycast() {
  const detector = xb.world?.planes
  if (!detector) return

  for (const plane of detector.get()) {
    plane.ignoreReticleRaycast = true
    plane.raycast = () => {}
  }
}

/**
 * WebXR uses `horizontal-upward` / `horizontal-downward`, not `horizontal`.
 * @param {import('xrblocks').DetectedPlane} plane
 */
export function isHorizontalPlane(plane) {
  const orientation = plane.orientation?.toLowerCase?.() ?? ''
  const label = plane.label?.toLowerCase?.() ?? ''
  const simType = plane.simulatorPlane?.type?.toLowerCase?.() ?? ''

  return (
    orientation.startsWith('horizontal') ||
    orientation === 'horizontal' ||
    label === 'floor' ||
    label === 'table' ||
    label === 'desk' ||
    simType === 'horizontal' ||
    simType.startsWith('horizontal')
  )
}

/**
 * @param {import('xrblocks').DetectedPlane} plane
 */
function planeAreaScore(plane) {
  let score = plane.simulatorPlane?.area ?? 0
  if (score === 0 && plane.geometry) {
    plane.geometry.computeBoundingBox()
    const box = plane.geometry.boundingBox
    if (box) {
      score = (box.max.x - box.min.x) * (box.max.z - box.min.z)
    }
  }
  if (score <= 0) score = 1

  const label = plane.label?.toLowerCase?.() ?? ''
  if (label === 'table' || label === 'desk') score *= 1.5
  if (label === 'floor') score *= 1.1
  return score
}

/**
 * @returns {import('xrblocks').DetectedPlane | null}
 */
export function findBestHorizontalPlane() {
  const detector = xb.world?.planes
  if (!detector) return null

  const planes = detector.get()
  let best = null
  let bestScore = 0

  for (const plane of planes) {
    if (!isHorizontalPlane(plane)) continue
    const score = planeAreaScore(plane)
    if (score > bestScore) {
      bestScore = score
      best = plane
    }
  }

  return best
}

/**
 * Align `anchorRoot` flush with a detected horizontal plane.
 * @param {THREE.Group} anchorRoot
 * @param {import('xrblocks').DetectedPlane} plane
 */
export function anchorToPlane(anchorRoot, plane) {
  plane.updateWorldMatrix(true, false)
  const position = new THREE.Vector3()
  const quaternion = new THREE.Quaternion()
  const scale = new THREE.Vector3()
  plane.matrixWorld.decompose(position, quaternion, scale)
  const normal = new THREE.Vector3(0, 1, 0).applyQuaternion(quaternion)
  anchorRoot.position.copy(position).addScaledVector(normal, BOARD_PLANE_OFFSET)
  anchorRoot.quaternion.copy(quaternion)
}

/**
 * Place the board in front of the user when no plane is available.
 * Uses head-relative placement on Quest; fixed world placement in the simulator.
 * @param {THREE.Group} anchorRoot
 */
export function anchorFallback(anchorRoot) {
  if (isImmersiveSession()) {
    anchorFallbackInFront(anchorRoot)
    return
  }

  anchorRoot.position.set(
    0,
    xb.user.height - 0.78,
    -xb.user.objectDistance,
  )
  anchorRoot.quaternion.identity()
}

/**
 * Head-relative desk placement for immersive AR (Quest).
 * @param {THREE.Group} anchorRoot
 */
export function anchorFallbackInFront(anchorRoot) {
  const cam = xb.camera
  cam.getWorldDirection(_forward)
  _forward.y = 0
  if (_forward.lengthSq() < 1e-4) {
    _forward.set(0, 0, -1)
  } else {
    _forward.normalize()
  }

  const deskY = Math.max(0.65, cam.position.y - 0.9)
  const dist = Math.min(xb.user.objectDistance, 1.05)

  anchorRoot.position.copy(cam.position)
  anchorRoot.position.y = deskY
  anchorRoot.position.addScaledVector(_forward, dist)
  anchorRoot.quaternion.identity()
}
