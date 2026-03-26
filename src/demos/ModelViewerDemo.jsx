import { useEffect } from 'react'
import 'xrblocks/addons/simulator/SimulatorAddons.js'
import * as xb from 'xrblocks'
import { ModelViewerScene } from './ModelViewerScene.js'
import { applySimulatorAutostart } from '../xr/applySimulatorAutostart.js'

/**
 * Model viewer sample (see docs). Loads remote GLTF/splat assets from xrblocks CDNs.
 */
export default function ModelViewerDemo() {
  useEffect(() => {
    if (globalThis.__XR_BLOCKS_INIT__) return
    globalThis.__XR_BLOCKS_INIT__ = true

    async function run() {
      const modelViewerScene = new ModelViewerScene()
      xb.add(modelViewerScene)
      const options = new xb.Options()
      options.setAppTitle('Model Viewer')
      options.simulator.instructions.customInstructions = [
        {
          header: 'Model Viewer',
          description:
            'Click or pinch the object to rotate. Drag the platform to move. Use WASD to move, A/D to strafe, Q/E for up/down, mouse to look. Press ` to toggle help.',
        },
      ]
      await applySimulatorAutostart(options)
      await xb.init(options)
    }

    void run()
  }, [])

  return null
}
