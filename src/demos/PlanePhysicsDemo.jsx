import { useEffect, useRef } from 'react'
import 'xrblocks/addons/simulator/SimulatorAddons.js'
import * as xb from 'xrblocks'
import RAPIER from '@dimforge/rapier3d-compat'
import { PlanePhysicsScene } from './PlanePhysicsScene.js'
import { applySimulatorAutostart } from '../xr/applySimulatorAutostart.js'

/**
 * Plane detection (XR Blocks) + Rapier physics (explicit compat package, same hook as Core).
 * Spawn controls are a SpatialPanel with TextButtons (reticle trigger / hand touch).
 */
export default function PlanePhysicsDemo() {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (globalThis.__XR_BLOCKS_INIT__) return
    globalThis.__XR_BLOCKS_INIT__ = true

    async function run() {
      const canvas = canvasRef.current
      if (!canvas) return

      await RAPIER.init()

      xb.add(new PlanePhysicsScene())
      const options = new xb.Options()
      options.canvas = canvas
      options.setAppTitle('Plane physics')
      options.enablePlaneDetection()
      options.enableReticles()
      options.enableHands()
      options.world.planes.showDebugVisualizations = true
      options.physics = {
        RAPIER,
        gravity: { x: 0, y: -9.81, z: 0 },
        worldStep: true,
      }

      await applySimulatorAutostart(options)
      await xb.init(options)
    }

    void run()
  }, [])

  return <canvas ref={canvasRef} className="xb-canvas" />
}
