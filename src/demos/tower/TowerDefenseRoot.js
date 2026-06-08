import * as THREE from 'three'
import * as xb from 'xrblocks'
import { Board } from './Board.js'
import { Economy } from './economy.js'
import { GameUi } from './GameUi.js'
import { getTowerDef } from './gameRules.js'
import { canPlaceTower } from './placement.js'
import {
  getCampaignWave,
  IR_DURATION_SEC,
} from './waves.js'
import { CombatSystem } from './systems/CombatSystem.js'
import { EnemySystem } from './systems/EnemySystem.js'
import { GameState } from './systems/GameState.js'
import { TowerSystem } from './systems/TowerSystem.js'
import {
  anchorFallback,
  anchorToPlane,
  excludeDetectedPlanesFromRaycast,
  findBestHorizontalPlane,
} from './planeAnchor.js'

/** Frames to wait for plane detection before using the in-front-of-user fallback. */
const PLANE_SEARCH_FRAMES = 90

const _boardHits = []

/**
 * Tower Security root script: board, campaign waves, UI, and combat.
 */
export class TowerDefenseRoot extends xb.Script {
  constructor() {
    super()
    /** @type {'pending' | 'plane' | 'fallback'} */
    this.anchorMode = 'pending'
    /** @type {import('xrblocks').DetectedPlane | null} */
    this.trackedPlane = null
    this.fallbackFrames = 0
    this.fallbackApplied = false
    this.gameState = new GameState()
    this.economy = new Economy()
    /** @type {EnemySystem | null} */
    this.enemySystem = null
    /** @type {TowerSystem | null} */
    this.towerSystem = null
    /** @type {CombatSystem | null} */
    this.combatSystem = null
    /** @type {GameUi | null} */
    this.gameUi = null
    this.aiHintsEnabled =
      xb.getUrlParamBool('ai') ||
      globalThis.__TOWER_SECURITY_AI__ === true
  }

  init() {
    this.add(new THREE.HemisphereLight(0xffffff, 0x334455, 1.4))
    const sun = new THREE.DirectionalLight(0xffffff, 1.2)
    sun.position.set(1.5, 3, 2)
    sun.castShadow = true
    this.add(sun)

    this.anchorRoot = new THREE.Group()
    this.anchorRoot.name = 'BoardAnchor'
    this.add(this.anchorRoot)

    this.board = new Board()
    this.anchorRoot.add(this.board.root)

    this.gameState.beginCampaign()

    this.enemySystem = new EnemySystem(this.board, this.gameState)
    this.enemySystem.onKill = (enemy) => {
      this.economy.rewardKill(enemy.type)
    }
    this.enemySystem.onWaveClear = ({ waveBaseDamage }) => {
      this.economy.rewardWaveClear(waveBaseDamage)
      this.gameState.enterDebrief()
    }

    this.towerSystem = new TowerSystem(this.board)
    this.combatSystem = new CombatSystem(this.towerSystem, this.enemySystem)

    this.gameUi = new GameUi({
      onFlowPrimary: () => this.handleFlowPrimary(),
      onRestart: () => this.restartRun(),
      aiHintsEnabled: this.aiHintsEnabled,
    })
    this.gameUi.build(this)
    this.gameUi.sync(this.gameState, this.enemySystem, this.economy)
  }

  onSimulatorStarted() {
    this.anchorMode = 'pending'
    this.trackedPlane = null
    this.fallbackFrames = 0
    this.fallbackApplied = false
  }

  handleFlowPrimary() {
    const { phase } = this.gameState

    if (phase === 'briefing') {
      this.startCurrentWave()
    } else if (phase === 'debrief') {
      const wave = getCampaignWave(this.gameState.waveIndex)
      if (wave?.irChallenge) {
        this.gameState.startIr(IR_DURATION_SEC)
      } else {
        this.gameState.continueAfterDebrief()
      }
    } else if (phase === 'ir') {
      this.gameState.finishIr()
    } else if (phase === 'victory') {
      this.restartRun()
    }
  }

  startCurrentWave() {
    if (this.gameState.phase !== 'briefing' || !this.enemySystem) return

    const wave = getCampaignWave(this.gameState.waveIndex)
    if (!wave) return

    this.enemySystem.startWave(wave)
    this.gameState.startCombat(wave.title)
    this.board.hideHoverCell()
  }

  restartRun() {
    this.enemySystem?.clear()
    this.towerSystem?.clear()
    this.economy.reset()
    this.gameState.resetRun()
    this.board.hideHoverCell()
    this.gameUi?.sync(this.gameState, this.enemySystem, this.economy)
  }

  /** @param {import('xrblocks').KeyEvent} event */
  onKeyDown(event) {
    if (this.gameState.phase === 'defeat') return
    if (!this.gameState.isPlacementAllowed) return

    if (event.code === 'Digit1') this.gameState.selectTowerIndex(0)
    else if (event.code === 'Digit2') this.gameState.selectTowerIndex(1)
    else if (event.code === 'Digit3') this.gameState.selectTowerIndex(2)
    else if (event.code === 'Digit4') this.gameState.selectTowerIndex(3)
    else if (event.code === 'KeyN') this.gameState.cycleTowerForward()
  }

  update(_time, _frame) {
    const dt = xb.getDeltaTime()

    excludeDetectedPlanesFromRaycast()
    this._updateAnchor()
    this._snapReticlesToBoard()

    if (this.gameState.isPlacementAllowed) {
      this._updateBoardHover()
    } else {
      this.board.hideHoverCell()
    }

    if (this.gameState.phase === 'ir') {
      this.gameState.tickIr(dt)
    }

    this.combatSystem?.update(dt)
    this.enemySystem?.update(dt)
    this.economy.update(dt, this.gameState.phase)
    this.gameUi?.sync(this.gameState, this.enemySystem, this.economy)
  }

  /**
   * @param {import('xrblocks').SelectEvent} event
   */
  onSelectEnd(event) {
    if (!this.gameState.isPlacementAllowed) return

    const hit = this._raycastBoard(event.target)
    if (!hit) return

    const cell = this.board.worldPointToCell(hit.point)
    if (!cell) return

    this._tryPlaceTower(cell.col, cell.row)
  }

  /** @param {number} col @param {number} row */
  _tryPlaceTower(col, row) {
    const type = this.gameState.selectedTowerType
    const def = getTowerDef(type)

    if (
      !canPlaceTower(col, row, this.towerSystem.occupied) ||
      !this.economy.canAfford(def.cost)
    ) {
      this.board.pulseReject()
      return
    }

    if (!this.towerSystem.place(type, col, row)) {
      this.board.pulseReject()
      return
    }

    this.economy.spend(def.cost)
    this.board.pulseSelect()
    this.board.showHoverCell(col, row)
  }

  /**
   * @param {import('three').Object3D} controller
   * @returns {THREE.Intersection | null}
   */
  _raycastBoard(controller) {
    const hitPlane = this.board.hitPlane
    if (!hitPlane || !xb.input) return null

    xb.input.setRaycasterFromController(controller)
    _boardHits.length = 0
    hitPlane.raycast(xb.input.raycaster, _boardHits)
    return _boardHits[0] ?? null
  }

  _snapReticlesToBoard() {
    if (!this.board.hitPlane) return

    for (const controller of xb.user.controllers ?? []) {
      const reticle = controller.reticle
      if (!reticle) continue

      const hit = this._raycastBoard(controller)
      if (!hit) {
        reticle.visible = false
        continue
      }

      reticle.visible = true
      reticle.intersection = hit
      reticle.direction.copy(xb.input.raycaster.ray.direction).normalize()
      reticle.setPoseFromIntersection(hit)
      reticle.setPressed(Boolean(controller.userData.selected))
    }
  }

  _updateBoardHover() {
    let hoverCell = null

    for (const controller of xb.user.controllers ?? []) {
      const hit = this._raycastBoard(controller)
      if (!hit) continue
      const cell = this.board.worldPointToCell(hit.point)
      if (cell) {
        hoverCell = cell
        break
      }
    }

    if (hoverCell) {
      this.board.showHoverCell(hoverCell.col, hoverCell.row)
    } else {
      this.board.hideHoverCell()
    }
  }

  _updateAnchor() {
    if (this.anchorMode === 'plane' && this.trackedPlane) {
      if (this.trackedPlane.parent) {
        anchorToPlane(this.anchorRoot, this.trackedPlane)
      } else {
        this.anchorMode = 'pending'
        this.trackedPlane = null
        this.fallbackFrames = 0
      }
      return
    }

    if (this.anchorMode !== 'pending') return

    const plane = findBestHorizontalPlane()
    if (plane) {
      excludeDetectedPlanesFromRaycast()
      anchorToPlane(this.anchorRoot, plane)
      this.anchorMode = 'plane'
      this.trackedPlane = plane
      return
    }

    if (this.fallbackApplied) return

    this.fallbackFrames += 1
    const heightReady = xb.user.height > 0
    if (heightReady && this.fallbackFrames >= PLANE_SEARCH_FRAMES) {
      anchorFallback(this.anchorRoot)
      this.anchorMode = 'fallback'
      this.fallbackApplied = true
    }
  }
}
