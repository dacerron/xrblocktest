import { useEffect, useRef } from 'react'
import 'xrblocks/addons/simulator/SimulatorAddons.js'
import * as xb from 'xrblocks'
import { TowerDefenseRoot } from './TowerDefenseRoot.js'
import { applySimulatorAutostart } from '../../xr/applySimulatorAutostart.js'

/**
 * Tower Security (Phase 1): anchored playfield with grid, path strip, and base marker.
 */
export default function TowerDefenseDemo() {
  const canvasRef = useRef(null)

  useEffect(() => {
    if (globalThis.__XR_BLOCKS_INIT__) return
    globalThis.__XR_BLOCKS_INIT__ = true

    async function run() {
      const canvas = canvasRef.current
      if (!canvas) return

      xb.add(new TowerDefenseRoot())
      const options = new xb.Options()
      options.canvas = canvas
      options.setAppTitle('Tower Security')
      options.setAppDescription(
        'Cybersecurity tower defense — place controls on the board to stop threats.',
      )
      options.enablePlaneDetection()
      options.enableReticles()
      options.enableHands()

      options.simulator.instructions.customInstructions = [
        {
          header: 'Tower Security',
          description:
            'Enter immersive AR to anchor the board. Read each wave briefing, begin combat, place controls on buildable cells, then continue through debrief and IR beats. Keys 1-4 pick tower type, N cycles. WASD to move, mouse to look.',
        },
      ]

      await applySimulatorAutostart(options)
      await xb.init(options)
    }

    void run()
  }, [])

  return <canvas ref={canvasRef} className="xb-canvas" />
}
