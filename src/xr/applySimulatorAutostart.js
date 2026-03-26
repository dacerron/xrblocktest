/**
 * When no immersive WebXR session is available (typical desktop without a headset),
 * auto-start the XR Blocks desktop simulator so users can move with WASD and look
 * with the mouse. When immersive VR/AR is supported (e.g. Quest), leave the normal
 * "Enter XR" flow so the real session can start instead of forcing the simulator.
 *
 * WASD movement is handled by the simulator's shared control stack (A/D strafe,
 * W/S forward/back, Q/E vertical) once the simulator is running.
 */
export async function applySimulatorAutostart(options) {
  let autostart = true
  if (typeof navigator !== 'undefined' && navigator.xr) {
    try {
      const [vr, ar] = await Promise.all([
        navigator.xr.isSessionSupported('immersive-vr'),
        navigator.xr.isSessionSupported('immersive-ar'),
      ])
      autostart = !vr && !ar
    } catch {
      autostart = true
    }
  }
  options.xrButton.alwaysAutostartSimulator = autostart
}
