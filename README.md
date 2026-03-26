# XR Blocks Quest 3 Demo (Vite + React)

This project hosts **non-AI** [XR Blocks](https://xrblocks.github.io/) demos as a static Vite + React site.

It is intended to be hosted so you can open it in a **desktop browser** (simulator + keyboard) or on a **Quest 3** standalone browser.

## Demos

Use the query parameter `demo` (full page load):

- **Basic pinch** (default): `?demo=basic` — cylinder in front of you; pinch/select changes color.
- **Model viewer** (from the [docs sample](https://xrblocks.github.io/docs/samples/ModelViewer/)): `?demo=modelviewer` — `xb.ModelViewer` scenes loading remote GLTF/splat assets.
- **Depth physics** (`?demo=planes`): Ballpit-style **depth mesh** collision — `options.depth = new xb.DepthOptions(xb.xrDepthMeshPhysicsOptions)` so Core attaches Rapier colliders to the environment mesh (not plane detection). Spawned spheres/cubes use the same **Rapier** world. Requires a session with **depth-sensing** (e.g. Quest MR). Spawning uses an XR Blocks **SpatialPanel** with **TextButton** targets.

Example on GitHub Pages:

- `https://dacerron.github.io/xrblocktest/?demo=modelviewer`

**External library used for physics:** XR Blocks wires physics when you pass `options.physics.RAPIER`. This demo loads **`@dimforge/rapier3d-compat`** (WASM, same family as XR Blocks’ Rapier integration) and passes it into options. With **`options.depth`** enabled, Core calls **`depth.depthMesh.initRapierPhysics(RAPIER, blendedWorld)`** so the depth mesh collides with the same world as your spawns ([Ballpit](https://xrblocks.github.io/docs/samples/Ballpit/) uses the same pattern).

Remote 3D assets and CDN bases are listed in [docs/ASSETS.md](docs/ASSETS.md).

## Desktop without a headset (WASD)

On browsers where **immersive WebXR is not available**, the app sets `alwaysAutostartSimulator` so the XR Blocks **desktop simulator** starts automatically. You can move with **WASD** (A/D strafe, W/S forward/back, Q/E vertical), look with the **mouse**, and use `` ` `` to toggle simulator UI (see XR Blocks simulator help). When immersive VR/AR *is* available (e.g. Quest), the normal **Enter XR** flow is used instead of forcing the simulator.

## Local development

1. Install dependencies:
   - `npm install`
2. Start dev server:
   - `npm run dev`

## Build for static hosting

- `npm run build`
- Output: `dist/`

## Test on Quest 3 standalone

XR Blocks requires a secure context, so serve the `dist/` directory over **HTTPS**.

1. Host `dist/` on an HTTPS static host (for example: GitHub Pages, Netlify, or Vercel).
2. Make sure your Quest 3 can reach the site URL.
3. Open the URL in Quest 3’s standalone browser and allow any permission prompts (WebXR/hand tracking).
4. Confirm (basic demo):
   - You can see the cylinder in front of you.
   - Selecting/pinching changes the cylinder color.

For the model viewer demo, open `?demo=modelviewer` and confirm models load from the network (may take a few seconds).
