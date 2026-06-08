import { BASE_HP_MAX } from '../constants.js'
import { getTowerDef, towerTypeAtIndex, TOWER_ORDER } from '../gameRules.js'
import { WAVE_COUNT } from '../waves.js'

/**
 * @typedef {'briefing' | 'combat' | 'debrief' | 'ir' | 'victory' | 'defeat'} GamePhase
 */

export class GameState {
  constructor() {
    /** @type {GamePhase} */
    this.phase = 'briefing'
    this.baseHp = BASE_HP_MAX
    this.baseHpMax = BASE_HP_MAX
    this.waveIndex = 0
    this.waveTitle = ''
    this.selectedTowerIndex = 0
    this.waveBaseDamage = 0
    this.irTimeLeft = 0
    this.defeatReason = ''
  }

  beginCampaign() {
    this.phase = 'briefing'
    this.baseHp = this.baseHpMax
    this.waveIndex = 0
    this.waveTitle = ''
    this.selectedTowerIndex = 0
    this.waveBaseDamage = 0
    this.irTimeLeft = 0
    this.defeatReason = ''
  }

  resetRun() {
    this.beginCampaign()
  }

  /** @param {string} title */
  startCombat(title) {
    if (this.phase !== 'briefing') return
    this.phase = 'combat'
    this.waveTitle = title
    this.waveBaseDamage = 0
  }

  /** @param {number} amount */
  damageBase(amount) {
    if (this.phase !== 'combat') return
    this.waveBaseDamage += amount
    this.baseHp = Math.max(0, this.baseHp - amount)
    if (this.baseHp <= 0) {
      this.phase = 'defeat'
      this.defeatReason = 'Base compromised'
    }
  }

  enterDebrief() {
    if (this.phase !== 'combat') return
    this.phase = 'debrief'
    this.waveTitle = ''
  }

  /** @param {number} durationSec */
  startIr(durationSec) {
    if (this.phase !== 'debrief') return
    this.phase = 'ir'
    this.irTimeLeft = durationSec
  }

  /** @param {number} dt */
  tickIr(dt) {
    if (this.phase !== 'ir') return
    this.irTimeLeft -= dt
    if (this.irTimeLeft <= 0) {
      this.phase = 'defeat'
      this.defeatReason = 'IR window missed — acknowledge within the timer'
    }
  }

  /** Called after player acknowledges IR panel. */
  finishIr() {
    if (this.phase !== 'ir') return
    this.irTimeLeft = 0
    this.advanceToNextWave()
  }

  /** After debrief when no IR, or after final wave debrief. */
  continueAfterDebrief() {
    if (this.phase !== 'debrief') return
    this.advanceToNextWave()
  }

  advanceToNextWave() {
    if (this.waveIndex >= WAVE_COUNT - 1) {
      this.phase = 'victory'
      this.waveTitle = ''
      return
    }
    this.waveIndex += 1
    this.phase = 'briefing'
    this.waveTitle = ''
  }

  /** HP lost to leaks during the current wave (reset in startCombat). */
  get waveLeakDamage() {
    return this.waveBaseDamage ?? 0
  }

  get isPlacementAllowed() {
    return this.phase === 'combat'
  }

  get selectedTowerType() {
    return towerTypeAtIndex(this.selectedTowerIndex)
  }

  /** @param {number} index */
  selectTowerIndex(index) {
    if (index < 0 || index >= TOWER_ORDER.length) return
    this.selectedTowerIndex = index
  }

  cycleTowerForward() {
    this.selectedTowerIndex =
      (this.selectedTowerIndex + 1) % TOWER_ORDER.length
  }

  get statusLine() {
    const labels = {
      briefing: 'Briefing',
      combat: 'Combat',
      debrief: 'Debrief',
      ir: 'Incident response',
      victory: 'Victory',
      defeat: 'Defeat',
    }
    const phaseLabel = labels[this.phase] ?? 'Ready'
    const waveNum = `Wave ${this.waveIndex + 1}/${WAVE_COUNT}`
    const wave =
      this.phase === 'combat' && this.waveTitle ? ` · ${this.waveTitle}` : ''
    return `${phaseLabel} · ${waveNum}${wave} · Base ${this.baseHp}/${this.baseHpMax}`
  }

  /** @param {number} credits */
  towerLine(credits) {
    if (!this.isPlacementAllowed) {
      return `Credits ${credits} · placement locked until combat`
    }
    const def = getTowerDef(this.selectedTowerType)
    return `Credits ${credits} · ${def.label} (${def.cost}c) · keys 1-4, N cycle`
  }
}
