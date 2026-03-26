import { useEffect } from 'react'
import 'xrblocks/addons/simulator/SimulatorAddons.js'
import * as THREE from 'three'
import * as xb from 'xrblocks'
import { applySimulatorAutostart } from '../xr/applySimulatorAutostart.js'

/**
 * Non-AI XR Blocks demo:
 * - Renders a cylinder in front of the user
 * - Pinch/select (or click in desktop simulator) randomizes cylinder color
 * - Without a headset, the desktop simulator can auto-start; use WASD + mouse
 */
export default function BasicPinchDemo() {
  useEffect(() => {
    // React StrictMode can run effects twice in dev; guard globally to avoid
    // double-initializing WebXR / renderer resources.
    if (globalThis.__XR_BLOCKS_INIT__) return
    globalThis.__XR_BLOCKS_INIT__ = true

    async function run() {
      class MainScript extends xb.Script {
        init() {
          this.add(new THREE.HemisphereLight(0xffffff, 0x666666, 3))

          const geometry = new THREE.CylinderGeometry(0.2, 0.2, 0.4, 32)
          const material = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8,
          })
          this.player = new THREE.Mesh(geometry, material)

          // Position the object in front of the user.
          this.player.position.set(
            0,
            xb.user.height - 0.5,
            -xb.user.objectDistance,
          )
          this.add(this.player)
        }

        onSelectEnd(event) {
          // event is unused; XR blocks passes controller/hand select info.
          this.player.material.color.set(Math.random() * 0xffffff)
        }

        onSelecting(event) {
          // Optional feedback while the user is pinching/selecting.
          this.player.material.color.set(0x66ccff)
        }
      }

      xb.add(new MainScript())
      const options = new xb.Options()
      options.setAppTitle('Basic pinch')
      await applySimulatorAutostart(options)
      await xb.init(options)
    }

    void run()
  }, [])

  // XR Blocks manages its own canvas/DOM.
  return null
}

