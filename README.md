# XR Blocks Quest 3 Demo (Vite + React)

This project renders a first **non-AI** [XR Blocks](https://xrblocks.github.io/) scene (a cylinder that changes color when you select/pinch).

It is intended to be hosted as a static site so you can open it in the **Quest 3 standalone browser**.

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
4. Confirm:
   - You can see the cylinder in front of you.
   - Selecting/pinching changes the cylinder color.
