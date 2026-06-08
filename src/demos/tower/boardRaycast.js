/**
 * Remove an object (and descendants) from XR Blocks / three.js raycasts.
 * Decorative board geometry must not compete with the single hit plane.
 * @param {import('three').Object3D} root
 */
export function disableRaycastDeep(root) {
  root.traverse((object) => {
    object.raycast = () => {}
  })
}
