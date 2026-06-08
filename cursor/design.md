# XR Blocks spatial UI — design notes

Project-specific learnings from the Tower Security demo (`?demo=tower`) and reference samples in this repo. Use this when building or tuning HUD panels, buttons, and interaction.

---

## TextButton sizing (critical)

XR Blocks `TextButton` has three separate sizing systems. Mixing them up produces giant square buttons with microscopic labels.

### 1. Layout fractions (`width`, `height`)

Fractions of the parent grid row/column, **not meters**. View layout sets object scale with:

```
scale = min(parent.rangeX × width, parent.rangeY × height)
```

Set **both** `width` and `height`. Ballpit baseline: **`width: 0.92`**, **`height: 0.82`**.

### 2. Label size — use `fontSizeDp`, not `fontSize`

`TextButton` hard-codes `mode: 'center'`. Unlike `LabelView` (`fitWidth`), the label **does not scale up** when the button grows.

| Property | Behavior | What to do |
|----------|----------|------------|
| `fontSize` | Fixed Troika size in local units | Avoid on large buttons — text stays tiny when the row grows |
| **`fontSizeDp`** | Density-independent px, converted via `dpToLocalUnits()` | **Use this** for action buttons; start at **`28–32 dp`** |

### 3. Visual shape — `uniforms.uBoxSize` (squircle shader)

The rounded background uses a squircle shader. Default **`uBoxSize` is `0.5 × 0.5`**, which draws a **square** on the square hit mesh — even when the panel is wide.

For a horizontal pill, set after construction:

```javascript
button.uniforms.uBoxSize.value.set(0.44, 0.2) // wide × short
```

### Other defaults that bite

| Property | Default / behavior | What to do |
|----------|-------------------|------------|
| `opacity` | Background opacity defaults to **0** (invisible) | Always set `opacity: 1` |
| Panel shape | Tall multi-row panel + large button row | Use a **dedicated flat action panel** for buttons |

### Reference pattern in this repo

**Ballpit spawn panel** (`src/demos/PlanePhysicsScene.js`):

- Panel: `width: 0.52`, `height: 0.11` (meters) — **wide and short**
- Single row, `weight: 1`
- Button: `width: 0.46`, `height: 0.82`, `fontSize: 0.036` (small panel; still works because button scale is small)

**Tower Security** (`src/demos/tower/GameUi.js`):

- **Stats HUD** (text only): `0.78 × 0.2 m`
- **Action panel** (Start / Restart): `0.5 × 0.1 m`, placed below HUD — same proportions as Ballpit
- Button: `width: 0.92`, `height: 0.82`, **`fontSizeDp: 28`**, **`opacity: 1`**, pill `uBoxSize`

### Anti-patterns we hit

- **`fontSize` on a large button row** → huge green square, unreadable speck of text
- **Default square `uBoxSize`** → wrong shape for “Start wave” / “Restart” pills
- **`height: 0.34`** in layout → thin strip, clipped label
- **Embedding the button inside a tall stats panel** → row weight inflates hit target without scaling text
- Forgetting **`updateLayouts()`** after layout edits

---

## SpatialPanel layout

### Panel dimensions (meters)

`SpatialPanel` `width` and `height` are world-space panel size. Labels and buttons inside still use 0–1 layout fractions.

- Keep primary HUD in a comfortable band: roughly **0.5–0.8 m wide**, **0.11–0.3 m tall** depending on content
- Place with `xb.user.panelDistance` (often `z = -Math.min(xb.user.panelDistance * 0.5, 1.05)`) and **`xb.user.height`** for vertical offset
- Call **`panel.updateLayouts()`** after building or mutating the grid

### Grid rows

- Row **`weight`** splits panel height among rows
- Put **primary action buttons in a separate flat panel** (`~0.5 × 0.1 m`), not inside a tall stats panel
- **`child.weight`** splits horizontal space when multiple buttons share a row (see Ballpit: `0.5` / `0.5`)
- **`LabelView`** also needs `width` / `height` fractions so text lays out predictably

### Recommended panel flags (Tower / Ballpit pattern)

```javascript
new xb.SpatialPanel({
  backgroundColor: '#0a0f18ff', // opaque alpha for passthrough legibility
  useDefaultPosition: false,
  draggable: true,
  keepFacingCamera: true,
  showHighlights: true,
  touchable: true,
})
```

- **`keepFacingCamera`**: panel stays readable as the user moves
- **`touchable`**: enables pinch / touch on panel widgets
- **`draggable`**: user can reposition; pair with stable default placement
- **Opaque backgrounds** (`#rrggbbaa` with `ff` alpha): passthrough AR needs contrast; avoid fully transparent HUD chrome

---

## Interaction and raycasting (AR)

- Use a **single intentional hit surface** for board placement (e.g. `boardHitPlane`), not decorative meshes
- **`excludeDetectedPlanesFromRaycast()`** on WebXR detected plane meshes so reticles hit game content, not invisible anchors
- Decorative board geometry: **`disableRaycastDeep()`** so rays pass through to the hit plane
- Snap reticles to the board plane when appropriate so pinch placement aligns with the grid

Input hierarchy: reticle + pinch for placement; panel buttons via XR Blocks touch; keyboard shortcuts acceptable on desktop simulator only.

---

## Placement comfort (platform guidance)

These targets come from [Android XR visual design](https://developer.android.com/design/ui/xr/guides/visual-design), [Android XR spatial UI](https://developer.android.com/design/ui/xr/guides/spatial-ui), and [Meta Horizon OS hit targets](https://developers.meta.com/horizon/design/styles_inputs_hit_targets/). They apply to WebXR / Quest builds even when using XR Blocks instead of Jetpack XR SDK.

### Distance and field of view

| Guideline | Recommendation |
|-----------|----------------|
| Default panel distance | ~**1.5–1.75 m** from user (Android XR); XR Blocks exposes `xb.user.panelDistance` |
| Vertical placement | Slightly **below eye level** (~5°) for comfort |
| Primary content FOV | Keep important UI within central **~41°** so users need minimal head movement |
| Depth range | Avoid cramming UI into **0.5–0.8 m** “middle distance” without clear direct-touch vs raycast affordance (Meta) |

### Touch / reticle target size

Android XR uses **0.868 dp per mm** at nominal distance. At **1.75 m**:

- **Minimum** interactable: ~48 dp → about **22 mm** per side  
- **Recommended**: ~56 dp → about **26 mm** per side  
- **Primary controls with hand tracking (Meta)**: prefer **60×60 dp** minimum where possible  
- **Spacing** between targets: at least **8 dp** (~4 mm) to reduce mis-taps

When tuning `TextButton` fractions, sanity-check the **computed physical size** in meters and compare to ~**0.025 m (25 mm)** minimum height for primary actions at ~1 m panel distance.

### Panels and density

- Put **menus and controls in dedicated panels**, not mixed into the main “world” content panel (Android XR quality guidelines)
- Avoid overlapping panels that hide critical passthrough context
- **`keepFacingCamera`** matches Meta guidance to keep panels oriented toward the user after repositioning
- Test on **actual Quest hardware**; simulator sizing feels different for hand tracking vs mouse

### Visual design

- High **contrast** text on opaque or strongly tinted panel backgrounds (passthrough washes out low-contrast UI)
- Rounded corners: Android XR system default **32 dp**; XR Blocks `radius` on buttons (~`0.1`) for pill shapes
- Limit simultaneous floating panels; prefer one HUD + contextual overlays (defeat, briefing)

---

## XR Blocks samples and docs

| Resource | Use |
|----------|-----|
| [UI Blocks sample](https://xrblocks.github.io/docs/samples/UIBlocks/) | SpatialPanel + TextButton patterns |
| [Ballpit sample](https://xrblocks.github.io/docs/samples/Ballpit/) | Depth mesh, physics, compact button panel |
| [XR Blocks blog](https://research.google/blog/xr-blocks-accelerating-ai-xr-innovation/) | Framework overview |
| `src/demos/PlanePhysicsScene.js` | Local reference for button fractions and panel placement |

---

## Checklist before shipping UI changes

1. Set **`opacity: 1`**, **`width`**, and **`height`** on every `TextButton`
2. Use **`fontSizeDp`** (not `fontSize`) for button labels
3. Set **`uniforms.uBoxSize`** for pill-shaped buttons (default is square)
4. Use a **dedicated flat action panel** for Start / Restart
5. Call **`updateLayouts()`** after layout edits
6. Use **opaque** panel/button colors in AR
7. Verify placement with **`xb.user.panelDistance`** and **`keepFacingCamera`**
8. Test **Start / primary actions** on Quest (not desktop only)
9. Confirm raycasts hit **game hit planes**, not detected-plane debug meshes

---

## Tower Security files

| File | Role |
|------|------|
| `src/demos/tower/GameUi.js` | HUD + defeat panel, button styles |
| `src/demos/tower/TowerDefenseRoot.js` | Panel parent, reticle, game loop |
| `src/demos/tower/planeAnchor.js` | Plane anchor + raycast exclusion |
