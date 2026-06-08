import * as xb from 'xrblocks'
import { getCampaignWave, WAVE_COUNT } from './waves.js'
import { getBriefingHint, getIrChallenge } from './lessonService.js'
import { LEGEND_SECTIONS } from './legendContent.js'
import {
  isImmersiveSession,
  panelViewDistance,
  placePanelFacingUser,
} from './uiLayout.js'

/** Flat action panel size (matches Ballpit spawn panel proportions). */
const ACTION_PANEL = { width: 0.5, height: 0.1 }

const BUTTON_STYLE = {
  opacity: 1,
  radius: 0.1,
  fontColor: 0xffffff,
  hoverColor: 0xffffff,
  selectedFontColor: 0xffffff,
  width: 0.92,
  height: 0.82,
  fontSizeDp: 28,
}

const PILL_BOX_SIZE = { x: 0.44, y: 0.2 }

/** @param {xb.TextButton} button */
function shapeAsPill(button) {
  button.uniforms.uBoxSize.value.set(PILL_BOX_SIZE.x, PILL_BOX_SIZE.y)
}

class FlowButton extends xb.TextButton {
  /**
   * @param {() => void} onPress
   * @param {string} label
   * @param {string} backgroundColor
   */
  constructor(onPress, label, backgroundColor) {
    super({
      ...BUTTON_STYLE,
      text: label,
      backgroundColor,
    })
    shapeAsPill(this)
    this.onPress = onPress
  }

  setLabel(label) {
    this.text = label
  }

  onTriggered() {
    this.onPress()
  }
}

class RestartButton extends xb.TextButton {
  /** @param {() => void} onRestart */
  constructor(onRestart) {
    super({
      ...BUTTON_STYLE,
      text: 'Restart',
      backgroundColor: '#b83232',
    })
    shapeAsPill(this)
    this.onRestart = onRestart
  }

  onTriggered() {
    this.onRestart()
  }
}

const PANEL_FLAGS = {
  useDefaultPosition: false,
  draggable: true,
  keepFacingCamera: true,
  showHighlights: true,
  touchable: true,
}

/**
 * Spatial HUD, campaign flow (briefing / debrief / IR / victory), and defeat overlay.
 */
export class GameUi {
  /**
   * @param {{
   *   onFlowPrimary: () => void,
   *   onRestart: () => void,
   *   aiHintsEnabled?: boolean,
   * }} actions
   */
  constructor(actions) {
    this.actions = actions
    this.hudPanel = null
    this.flowPanel = null
    this.flowActionPanel = null
    this.defeatPanel = null
    this.defeatActionPanel = null
    this.statusView = null
    this.towerView = null
    this.enemyCountView = null
    this.flowTitleView = null
    this.flowBodyView = null
    this.flowSubView = null
    this.flowButton = null
    this.restartButton = null
    this.legendPanel = null
    this.panelZ = -1
    /** @type {'world' | 'head'} */
    this.layoutMode = 'world'
  }

  build(parent) {
    const z = -Math.min(xb.user.panelDistance * 0.5, 1.05)
    this.panelZ = z
    const hudY = xb.user.height - 0.1

    this.hudPanel = new xb.SpatialPanel({
      ...PANEL_FLAGS,
      backgroundColor: '#0a0f18ff',
      width: 0.78,
      height: 0.2,
    })
    this.hudPanel.isRoot = true
    this.hudPanel.name = 'TowerHud'
    parent.add(this.hudPanel)

    const grid = this.hudPanel.addGrid()
    const statusRow = grid.addRow({ weight: 0.38 })
    this.statusView = new xb.LabelView({
      text: 'Briefing · Wave 1/8',
      fontSize: 0.03,
      fontColor: 0xffffff,
      width: 1,
      height: 0.4,
    })
    statusRow.add(this.statusView)

    const towerRow = grid.addRow({ weight: 0.34 })
    this.towerView = new xb.LabelView({
      text: 'Credits 28',
      fontSize: 0.026,
      fontColor: 0xd8e4f0,
      width: 1,
      height: 0.35,
    })
    towerRow.add(this.towerView)

    const countRow = grid.addRow({ weight: 0.28 })
    this.enemyCountView = new xb.LabelView({
      text: 'Threats: 0',
      fontSize: 0.024,
      fontColor: 0xb8c8d8,
      width: 1,
      height: 0.3,
    })
    countRow.add(this.enemyCountView)

    this.hudPanel.position.set(0, hudY, z)
    this.hudPanel.updateLayouts()

    this._buildLegendPanel(parent, hudY, z)

    this.flowPanel = new xb.SpatialPanel({
      ...PANEL_FLAGS,
      backgroundColor: '#101828ff',
      width: 0.72,
      height: 0.32,
    })
    this.flowPanel.isRoot = true
    this.flowPanel.name = 'CampaignFlowPanel'
    parent.add(this.flowPanel)

    const flowGrid = this.flowPanel.addGrid()
    const flowTitleRow = flowGrid.addRow({ weight: 0.22 })
    this.flowTitleView = new xb.LabelView({
      text: 'Wave 1 · Reconnaissance',
      fontSize: 0.034,
      fontColor: 0xffffff,
      width: 1,
      height: 0.5,
    })
    flowTitleRow.add(this.flowTitleView)

    const flowBodyRow = flowGrid.addRow({ weight: 0.48 })
    this.flowBodyView = new xb.LabelView({
      text: 'Briefing text',
      fontSize: 0.026,
      fontColor: 0xd0dce8,
      width: 1,
      height: 0.55,
      maxWidth: 0.95,
    })
    flowBodyRow.add(this.flowBodyView)

    const flowSubRow = flowGrid.addRow({ weight: 0.3 })
    this.flowSubView = new xb.LabelView({
      text: '',
      fontSize: 0.024,
      fontColor: 0x9ec9a8,
      width: 1,
      height: 0.45,
      maxWidth: 0.95,
    })
    flowSubRow.add(this.flowSubView)

    this.flowPanel.position.set(0, hudY - 0.22, z)
    this.flowPanel.updateLayouts()

    this.flowActionPanel = new xb.SpatialPanel({
      ...PANEL_FLAGS,
      backgroundColor: '#101828ff',
      width: ACTION_PANEL.width,
      height: ACTION_PANEL.height,
    })
    this.flowActionPanel.isRoot = true
    this.flowActionPanel.name = 'CampaignFlowAction'
    parent.add(this.flowActionPanel)

    const flowActionGrid = this.flowActionPanel.addGrid()
    const flowActionRow = flowActionGrid.addRow({ weight: 1 })
    this.flowButton = new FlowButton(
      this.actions.onFlowPrimary,
      'Begin wave',
      '#1a7f4a',
    )
    this.flowButton.weight = 1
    flowActionRow.add(this.flowButton)

    this.flowActionPanel.position.set(0, hudY - 0.42, z)
    this.flowActionPanel.updateLayouts()

    this.defeatPanel = new xb.SpatialPanel({
      ...PANEL_FLAGS,
      backgroundColor: '#18080cff',
      width: 0.72,
      height: 0.16,
    })
    this.defeatPanel.isRoot = true
    this.defeatPanel.name = 'DefeatPanel'
    this.defeatPanel.visible = false
    parent.add(this.defeatPanel)

    const defeatGrid = this.defeatPanel.addGrid()
    const defeatTextRow = defeatGrid.addRow({ weight: 1 })
    this.defeatText = new xb.LabelView({
      text: 'Base compromised',
      fontSize: 0.034,
      fontColor: 0xffffff,
      width: 1,
      height: 0.45,
    })
    defeatTextRow.add(this.defeatText)

    this.defeatPanel.position.set(0, xb.user.height - 0.04, z * 0.85)
    this.defeatPanel.updateLayouts()

    this.defeatActionPanel = new xb.SpatialPanel({
      ...PANEL_FLAGS,
      backgroundColor: '#18080cff',
      width: ACTION_PANEL.width,
      height: ACTION_PANEL.height,
    })
    this.defeatActionPanel.isRoot = true
    this.defeatActionPanel.name = 'DefeatActionPanel'
    this.defeatActionPanel.visible = false
    parent.add(this.defeatActionPanel)

    const defeatActionGrid = this.defeatActionPanel.addGrid()
    const defeatBtnRow = defeatActionGrid.addRow({ weight: 1 })
    this.restartButton = new RestartButton(this.actions.onRestart)
    this.restartButton.weight = 1
    defeatBtnRow.add(this.restartButton)

    this.defeatActionPanel.position.set(0, xb.user.height - 0.18, z * 0.85)
    this.defeatActionPanel.updateLayouts()

    this.layoutMode = isImmersiveSession() ? 'head' : 'world'
    this.updateLayout()
  }

  /**
   * Reposition panels each frame on Quest (head-relative) or once for simulator (world).
   * @param {boolean} [forceHeadRelative]
   */
  updateLayout(forceHeadRelative = false) {
    const headRelative = forceHeadRelative || this.layoutMode === 'head' || isImmersiveSession()
    this.layoutMode = headRelative ? 'head' : 'world'

    const z = panelViewDistance()
    this.panelZ = -z
    const hudY = xb.user.height - 0.1

    if (headRelative) {
      placePanelFacingUser(this.hudPanel, 0, 0.06, -z)
      placePanelFacingUser(this.flowPanel, 0, -0.16, -z)
      placePanelFacingUser(this.flowActionPanel, 0, -0.36, -z)
      placePanelFacingUser(this.legendPanel, 0.38, -0.04, -z * 0.98)
      placePanelFacingUser(this.defeatPanel, 0, 0.1, -z * 0.9)
      placePanelFacingUser(this.defeatActionPanel, 0, -0.08, -z * 0.9)
      return
    }

    if (this.hudPanel) {
      this.hudPanel.position.set(0, hudY, -z)
    }
    if (this.flowPanel) {
      this.flowPanel.position.set(0, hudY - 0.22, -z)
    }
    if (this.flowActionPanel) {
      this.flowActionPanel.position.set(0, hudY - 0.42, -z)
    }
    if (this.legendPanel) {
      this.legendPanel.position.set(0.5, hudY - 0.12, -z * 0.98)
    }
    if (this.defeatPanel) {
      this.defeatPanel.position.set(0, xb.user.height - 0.04, -z * 0.85)
    }
    if (this.defeatActionPanel) {
      this.defeatActionPanel.position.set(0, xb.user.height - 0.18, -z * 0.85)
    }
  }

  /**
   * Draggable legend — maps board colors and mesh shapes to game meaning.
   * @param {import('three').Object3D} parent
   * @param {number} hudY
   * @param {number} z
   */
  _buildLegendPanel(parent, hudY, z) {
    this.legendPanel = new xb.SpatialPanel({
      ...PANEL_FLAGS,
      backgroundColor: '#0c1420ff',
      width: 0.46,
      height: 0.58,
    })
    this.legendPanel.isRoot = true
    this.legendPanel.name = 'TowerLegend'
    parent.add(this.legendPanel)

    const grid = this.legendPanel.addGrid()

    const titleRow = grid.addRow({ weight: 0.1 })
    titleRow.add(
      new xb.LabelView({
        text: 'Legend — shapes & colors',
        fontSize: 0.027,
        fontColor: 0xffffff,
        width: 1,
        height: 0.45,
      }),
    )

    for (const section of LEGEND_SECTIONS) {
      const headerRow = grid.addRow({ weight: 0.07 })
      headerRow.add(
        new xb.LabelView({
          text: section.title,
          fontSize: 0.022,
          fontColor: 0x8aa4bc,
          width: 1,
          height: 0.4,
        }),
      )

      for (const entry of section.entries) {
        const row = grid.addRow({ weight: 0.068 })
        row.add(
          new xb.LabelView({
            text: `${entry.glyph} ${entry.name} — ${entry.detail}`,
            fontSize: 0.02,
            fontColor: entry.color ?? 0xd8e4f0,
            width: 1,
            height: 0.38,
            maxWidth: 0.98,
          }),
        )
      }
    }

    this.legendPanel.position.set(0.5, hudY - 0.12, z * 0.98)
    this.legendPanel.updateLayouts()
  }

  /**
   * @param {import('./systems/GameState.js').GameState} gameState
   * @param {import('./systems/EnemySystem.js').EnemySystem} enemySystem
   * @param {import('./economy.js').Economy} economy
   */
  sync(gameState, enemySystem, economy) {
    if (this.layoutMode === 'head' || isImmersiveSession()) {
      this.updateLayout(true)
    }

    if (this.statusView) {
      this.statusView.text = gameState.statusLine
    }
    if (this.towerView) {
      this.towerView.text = gameState.towerLine(economy.credits)
    }
    if (this.enemyCountView) {
      const pending = enemySystem.remainingSpawns
      const active = enemySystem.activeCount
      const pendingText = pending > 0 ? ` · ${pending} queued` : ''
      const incomeFlash = economy.getIncomeFlash()
      const threatLine =
        gameState.phase === 'combat'
          ? `Threats active: ${active}${pendingText}`
          : ''
      this.enemyCountView.text = incomeFlash
        ? `${incomeFlash}${threatLine ? ` · ${threatLine}` : ''}`
        : threatLine || ' '
    }

    this._syncFlowPanels(gameState)

    const showDefeat = gameState.phase === 'defeat'
    if (this.defeatPanel) {
      this.defeatPanel.visible = showDefeat
      if (showDefeat && this.defeatText) {
        this.defeatText.text =
          gameState.defeatReason || 'Base compromised — restart to try again'
      }
    }
    if (this.defeatActionPanel) {
      this.defeatActionPanel.visible = showDefeat
    }
  }

  /** @param {import('./systems/GameState.js').GameState} gameState */
  _syncFlowPanels(gameState) {
    const flowPhases = ['briefing', 'debrief', 'ir', 'victory']
    const showFlow = flowPhases.includes(gameState.phase)

    if (this.flowPanel) this.flowPanel.visible = showFlow
    if (this.flowActionPanel) this.flowActionPanel.visible = showFlow

    if (!showFlow || !this.flowButton) return

    const wave = getCampaignWave(gameState.waveIndex)

    if (gameState.phase === 'briefing' && wave) {
      this.flowTitleView.text = `${wave.title} · ${wave.phase}`
      this.flowBodyView.text = wave.briefing
      this.flowSubView.text =
        this.actions.aiHintsEnabled && wave
          ? getBriefingHint(wave, true)
          : ''
      this.flowButton.setLabel('Begin wave')
    } else if (gameState.phase === 'debrief' && wave) {
      this.flowTitleView.text = `Wave ${wave.id} cleared · ${wave.phase}`
      this.flowBodyView.text = wave.debrief
      this.flowSubView.text = wave.habit
      this.flowButton.setLabel(
        wave.irChallenge
          ? 'Continue to IR'
          : gameState.waveIndex >= WAVE_COUNT - 1
            ? 'Finish campaign'
            : 'Next briefing',
      )
    } else if (gameState.phase === 'ir') {
      const ir = wave ? getIrChallenge(wave.irChallenge) : null
      this.flowTitleView.text = ir?.title ?? 'Incident response'
      this.flowBodyView.text = ir?.prompt ?? 'Complete the IR step.'
      const seconds = Math.max(0, Math.ceil(gameState.irTimeLeft))
      this.flowSubView.text = `${ir?.hint ?? ''} · ${seconds}s remaining`
      this.flowButton.setLabel('Acknowledge')
    } else if (gameState.phase === 'victory') {
      this.flowTitleView.text = 'Campaign complete'
      this.flowBodyView.text =
        'All eight waves cleared. Your trust boundary held through recon, access, persistence, and exfil.'
      this.flowSubView.text =
        'Habit: share one lesson from this run with your team this week.'
      this.flowButton.setLabel('Play again')
    }
  }
}
