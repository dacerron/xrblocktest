import { getEnemyDef } from './gameRules.js'

export const STARTING_CREDITS = 28
/** Baseline budget trickle during combat (patch hygiene metaphor). */
export const PASSIVE_TRICKLE_PER_SEC = 0.15
/** Flat payout when all threats in a wave are eliminated. */
export const WAVE_CLEAR_BONUS = 8
/** Extra payout when no base HP was lost during the wave. */
export const NO_LEAK_BONUS = 4
/** How long income flash text stays on the HUD (ms). */
export const INCOME_FLASH_MS = 4500

export class Economy {
  constructor() {
    this.credits = STARTING_CREDITS
    /** Fractional trickle accumulator — whole credits applied via earn(). */
    this.trickleAccumulator = 0
    this.lastIncomeFlash = ''
    this.incomeFlashUntil = 0
  }

  reset() {
    this.credits = STARTING_CREDITS
    this.trickleAccumulator = 0
    this.lastIncomeFlash = ''
    this.incomeFlashUntil = 0
  }

  /** @param {number} cost */
  canAfford(cost) {
    return this.credits >= cost
  }

  /** @param {number} cost */
  spend(cost) {
    if (!this.canAfford(cost)) return false
    this.credits -= cost
    return true
  }

  /** @param {number} amount */
  earn(amount) {
    if (amount <= 0) return
    this.credits += amount
  }

  /** @param {string} enemyType */
  rewardKill(enemyType) {
    this.earn(getEnemyDef(enemyType).reward ?? 1)
  }

  /**
   * Passive credit trickle while combat is active.
   * @param {number} dt
   * @param {'idle' | 'combat' | 'defeat'} phase
   */
  update(dt, phase) {
    if (phase !== 'combat') return

    this.trickleAccumulator += PASSIVE_TRICKLE_PER_SEC * dt
    const whole = Math.floor(this.trickleAccumulator)
    if (whole <= 0) return

    this.trickleAccumulator -= whole
    this.earn(whole)
  }

  /**
   * Wave-end payout: clear bonus plus optional no-leak bonus.
   * @param {number} waveBaseDamage HP lost to leaks this wave
   */
  rewardWaveClear(waveBaseDamage) {
    let total = WAVE_CLEAR_BONUS
    const parts = [`+${WAVE_CLEAR_BONUS} wave clear`]

    if (waveBaseDamage <= 0) {
      total += NO_LEAK_BONUS
      parts.push(`+${NO_LEAK_BONUS} no leaks`)
    }

    this.earn(total)
    this.flashIncome(parts.join(' · '))
  }

  /** @param {string} message */
  flashIncome(message) {
    this.lastIncomeFlash = message
    this.incomeFlashUntil =
      (typeof performance !== 'undefined' ? performance.now() : Date.now()) +
      INCOME_FLASH_MS
  }

  /**
   * @param {number} [now]
   * @returns {string}
   */
  getIncomeFlash(now) {
    const t = now ?? (typeof performance !== 'undefined' ? performance.now() : Date.now())
    if (t > this.incomeFlashUntil) return ''
    return this.lastIncomeFlash
  }
}
