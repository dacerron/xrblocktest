# Tower Security

**Tower Security** is a mixed-reality tower defense prototype themed around **cybersecurity education**. It runs in the browser as **WebXR** (immersive AR) using **[XR Blocks](https://research.google/blog/xr-blocks-accelerating-ai-xr-innovation/)** and **three.js**, with **Meta Quest 2 / Quest 3** (Meta Quest Browser) as a primary headset target alongside the desktop XR simulator.

The experience teaches a simple loop: **recognize threats → spend limited budget on controls → survive waves → read short briefings** that tie gameplay to real security habits.

---

## Features

### Campaign and learning

- **Eight scripted waves** with titles tied to attack lifecycle phases (recon, initial access, persistence, lateral movement, exfil). Each wave includes a **pre-wave briefing**, a **post-wave debrief**, and a concrete **habit** suggestion (see [`src/waves.ts`](../src/waves.ts)).
- **Spatial UI panels** (XR Blocks) for briefings, debriefs, victory, and defeat—readable in passthrough AR.
- **Optional “AI-style” hints**: deterministic, offline copy (no API keys). Enable with **`?ai=1`** in the page URL, or set `window.__TOWER_SECURITY_AI__ = true` before load (see [`src/main.ts`](../src/main.ts), [`src/lessonService.ts`](../src/lessonService.ts)).

### Threats (enemies)

Each enemy type maps to a security metaphor (definitions and tooltips live in [`src/gameRules.ts`](../src/gameRules.ts)):

| Type | Theme (short) |
|------|------------------|
| Scout drone | Recon / exposed surface |
| Trojan wagon | Disguised / supply-chain style risk |
| Worm | Propagation along the path |
| Bot swarm | High-volume automated pressure |
| Insider spy | Stealth; weaker until **revealed** |
| Ransom glyph | Armored; availability impact |
| Phish hook | Social / deceptive pressure |

**Stealth:** spies are harder to hurt until an **IDS** tower tags them (temporary reveal window).

### Defenses (towers)

Four tower types, each framed as a **security control** (not a weapon):

| Tower | Role |
|-------|------|
| **Firewall segment** | Chokepoint damage and **slows** enemies |
| **EDR sentinel** | High single-target damage, longer cooldown |
| **IDS lookout** | Reveals **stealth** for follow-up damage |
| **MFA gate** | Extra effective against **bot swarm** (volume) threats |

### Economy and map rules

- **Credits** are finite “security budget”; you gain credits from **kills**, **wave clear bonuses**, and a small **passive trickle** (good hygiene metaphor—see [`src/economy.ts`](../src/economy.ts)).
- **Base health:** enemies that reach the end of the path **reduce base HP**; at zero you get a defeat screen and can restart.
- **Trust boundary (DMZ):** building in the **left band** of the grid grants a small **bonus vs recon (scout)** enemies (see [`src/constants.ts`](../src/constants.ts) `DMZ_MAX_COL` and placement helpers in [`src/placement.ts`](../src/placement.ts)).
- **Path cells** cannot hold towers; only **off-path** cells are buildable.

### Incident response (IR) beats

After certain waves, a short **timed IR panel** appears (shield / key icon). Complete it before the timer expires to continue (see [`src/lessonService.ts`](../src/lessonService.ts) `irChallengeCopy`).

### Performance and stability

- **Cap on simultaneous enemies** to keep Quest-class devices responsive ([`src/constants.ts`](../src/constants.ts) `MAX_ACTIVE_ENEMIES`).
- **Pinned engine versions** in code and **import map** in [`index.html`](../index.html) (XR Blocks **0.14.0**, three.js **0.182.0**).

### Glossary

Educational one-line entries for terms live in [`src/glossary.ts`](../src/glossary.ts) (usable for future UI).

---

## How to play

### 1. Build and run locally

From the repository root:

```bash
npm install
npm run build
npm run dev
```

Open the URL printed by the static server (default script uses port **5173**). For **WebXR on a headset**, serve the same files over **HTTPS** (tunnel or static host), then open the site in **Meta Quest Browser**.

### 2. Enter the experience

Use the **XR Blocks** entry UI to start **immersive AR** (or use the **desktop simulator** when developing on a PC). The playfield anchors to a **detected horizontal plane** when available, otherwise **in front of you** at a comfortable height.

### 3. Wave flow

1. Read the **briefing** panel for the current wave, then press **play** to begin combat.
2. **Enemies** spawn and move along the **highlighted path** toward your base.
3. When the wave is clear, read the **debrief** and **habit**, then continue. Some waves add an **IR beat** before the next briefing.
4. Clear **all eight waves** to see the **victory** summary; you can loop the campaign from there.

### 4. Placing towers

- **Combat phase only:** start the wave from the briefing panel first; placement is ignored during briefings, debriefs, and IR prompts.
- Aim the **reticle** at the **board** (translucent surface or path strip) and use **trigger / pinch** on **either hand or controller**. The game reads the reticle hit from XR Blocks’ **`user`** reticle for **both** controller indices (0 and 1), so the active hand should register.
- The corner **HUD** is marked so rays pass through it to the board; wave **menus** still receive taps normally when they are on screen.
- You **cannot** build on the **path** row or on an **occupied** cell.

### 5. Choosing tower type

- Keyboard (desktop / simulator): **`1`–`4`** pick tower slot; **`N`** cycles forward.
- The **HUD** shows credits, base HP, wave index, phase, and the selected tower with its cost.

### 6. Tips

- Mix **IDS** with damage towers when **spies** appear.
- Use **MFA** when **bots** are announced in the briefing.
- Use **firewall** slow plus **EDR** burst on **tanky** waves (e.g. ransom).

---

## Project layout (high level)

| Area | Purpose |
|------|---------|
| [`index.html`](../index.html) | Import map + entry script `./out/main.js` |
| [`src/`](../src/) | TypeScript source |
| [`out/`](../out/) | Compiled JavaScript (after `npm run build`; gitignored) |
| [`src/TowerDefenseRoot.ts`](../src/TowerDefenseRoot.ts) | XR Blocks `Script`: board, waves, UI, combat loop |

For XR Blocks APIs and templates, see the official docs: [Getting Started | XR Blocks](https://xrblocks.github.io/docs/).
