import { CELL_SIZE } from '../constants.js'
import { getEnemyDef, getTowerDef } from '../gameRules.js'
import { dmzDamageMultiplier } from '../placement.js'

/**
 * Tower targeting, damage, slow, reveal, and MFA vs bot logic.
 */
export class CombatSystem {
  /**
   * @param {import('./TowerSystem.js').TowerSystem} towerSystem
   * @param {import('./EnemySystem.js').EnemySystem} enemySystem
   */
  constructor(towerSystem, enemySystem) {
    this.towerSystem = towerSystem
    this.enemySystem = enemySystem
  }

  /** @param {number} dt */
  update(dt) {
    void dt
    if (this.enemySystem.gameState.phase !== 'combat') return

    const now = this.enemySystem.elapsed

    for (const tower of this.towerSystem.towers) {
      tower.cooldown -= dt
      if (tower.cooldown > 0) continue

      const target = this._pickTarget(tower)
      if (!target) continue

      this._fireTower(tower, target, now)
      tower.cooldown = getTowerDef(tower.type).cooldown
    }
  }

  /** @param {import('./TowerSystem.js').Tower} tower */
  _pickTarget(tower) {
    const def = getTowerDef(tower.type)
    const range = def.rangeCells * CELL_SIZE
    const origin = this.towerSystem.boardPosition(tower)
    let best = null
    let bestDist = Infinity

    for (const enemy of this.enemySystem.enemies) {
      const pos = this.enemySystem.getBoardPosition(enemy)
      const dist = Math.hypot(pos.x - origin.x, pos.z - origin.z)
      if (dist > range) continue
      if (dist < bestDist) {
        bestDist = dist
        best = enemy
      }
    }

    return best
  }

  /**
   * @param {import('./TowerSystem.js').Tower} tower
   * @param {import('./EnemySystem.js').Enemy} enemy
   * @param {number} now
   */
  _fireTower(tower, enemy, now) {
    const def = getTowerDef(tower.type)

    if (tower.type === 'ids') {
      this.enemySystem.reveal(enemy, now, def.revealDuration)
    }

    let damage = def.damage
    damage *= dmzDamageMultiplier(tower.col, tower.row, enemy.type)

    const enemyDef = getEnemyDef(enemy.type)
    if (tower.type === 'mfa' && enemyDef.isBot) {
      damage *= def.botDamageMultiplier
    }

    this.enemySystem.applyDamage(enemy, damage, now)

    if (tower.type === 'firewall') {
      this.enemySystem.applySlow(enemy, now, def.slowDuration)
    }
  }
}
