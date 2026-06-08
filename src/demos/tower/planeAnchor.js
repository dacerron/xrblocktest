import * as THREE from 'three'
import * as xb from 'xrblocks'

/** Lift the playfield slightly above the detected plane surface (meters). */
export const BOARD_PLANE_OFFSET = 0.012

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
 * @returns {import('xrblocks').DetectedPlane | null}
 */
export function findBestHorizontalPlane() {
  const detector = xb.world?.planes
  if (!detector) return null

  const planes = detector.get()
  let best = null
  let bestScore = 0

  for (const plane of planes) {
    const orientation = plane.orientation?.toLowerCase?.() ?? ''
    const label = plane.label?.toLowerCase?.() ?? ''
    const isHorizontal =
      orientation === 'horizontal' ||
      label === 'floor' ||
      label === 'table' ||
      plane.simulatorPlane?.type === 'horizontal'

    if (!isHorizontal) continue

    let score = plane.simulatorPlane?.area ?? 0
    if (score === 0 && plane.geometry) {
      plane.geometry.computeBoundingBox()
      const box = plane.geometry.boundingBox
      if (box) {
        score = (box.max.x - box.min.x) * (box.max.z - box.min.z)
      }
    }
    if (score <= 0) score = 1

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

/** Place the board in front of the user when no plane is available. */
export function anchorFallback(anchorRoot) {
  anchorRoot.position.set(
    0,
    xb.user.height - 0.78,
    -xb.user.objectDistance,
  )
  // Level with the horizontal plane (no pitch) — matches detected-plane anchoring.
  anchorRoot.quaternion.identity()
}
