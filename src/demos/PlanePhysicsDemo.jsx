import { useEffect, useRef } from 'react'
import 'xrblocks/addons/simulator/SimulatorAddons.js'
import * as xb from 'xrblocks'
import RAPIER from '@dimforge/rapier3d-simd-compat'
import { PlanePhysicsScene } from './PlanePhysicsScene.js'
import { applySimulatorAutostart } from '../xr/applySimulatorAutostart.js'

/**
 * Ballpit-style: depth mesh → Rapier environment colliders (Core), plus local spawns.
 * Spawn UI: SpatialPanel + TextButtons (reticle / hand touch).
 * @see https://xrblocks.github.io/docs/samples/Ballpit/
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
      options.setAppTitle('Depth physics')
      // Same preset as demos/ballpit/main.js (default path, not ?scenemesh).
      options.depth = new xb.DepthOptions(xb.xrDepthMeshPhysicsOptions)
      options.depth.matchDepthView = false
      options.depth.depthMesh.colliderUpdateFps = 5
      options.enableReticles()
      options.enableHands()
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
