import * as THREE from 'three'
import { ENEMY_Y, MAX_ACTIVE_ENEMIES, PATH_CELLS } from '../constants.js'
import { getEnemyDef } from '../gameRules.js'
import { disableRaycastDeep } from '../boardRaycast.js'

/**
 * @typedef {object} Enemy
 * @property {number} id
 * @property {string} type
 * @property {number} pathT
 * @property {number} baseSpeed
 * @property {number} speedMult
 * @property {number} slowUntil
 * @property {number} revealedUntil
 * @property {number} hp
 * @property {number} maxHp
 * @property {number} baseDamage
 * @property {boolean} stealth
 * @property {number} stealthArmor
 * @property {number} armor
 * @property {THREE.Mesh} mesh
 */

/**
 * Spawns threats on the path, moves them toward the base, and applies leak damage.
 */
export class EnemySystem {
  /**
   * @param {import('../Board.js').Board} board
   * @param {import('./GameState.js').GameState} gameState
   */
  constructor(board, gameState) {
    this.board = board
    this.gameState = gameState
    /** @type {Array<{ type: string, at: number, spawned: boolean }>} */
    this.spawnQueue = []
    this.waveElapsed = 0
    /** @type {Enemy[]} */
    this.enemies = []
    this.nextEnemyId = 1
    this.elapsed = 0
    /** @type {((enemy: Enemy) => void) | null} */
    this.onKill = null
    /** @type {((payload: { waveBaseDamage: number, title: string }) => void) | null} */
    this.onWaveClear = null
    /** @type {{ title: string, spawns: Array<{ type: string, at: number }> } | null} */
    this.currentWave = null
    this.enemiesRoot = new THREE.Group()
    this.enemiesRoot.name = 'Enemies'
    board.root.add(this.enemiesRoot)
  }

  clear() {
    for (const enemy of this.enemies) {
      this._disposeEnemyMesh(enemy)
    }
    this.enemies = []
    this.spawnQueue = []
    this.waveElapsed = 0
  }

  /**
   * @param {{ title: string, spawns: Array<{ type: string, at: number }> }} wave
   */
  startWave(wave) {
    this.clear()
    this.currentWave = wave
    this.elapsed = 0
    this.spawnQueue = wave.spawns.map((spawn) => ({
      type: spawn.type,
      at: spawn.at,
      spawned: false,
    }))
    this.waveElapsed = 0
  }

  /** @param {number} dt */
  update(dt) {
    if (this.gameState.phase !== 'combat') return

    this.elapsed += dt
    this.waveElapsed += dt
    this._trySpawnQueued()

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i]
      const speed =
        enemy.baseSpeed *
        enemy.speedMult *
        (this.elapsed < enemy.slowUntil ? 0.55 : 1)

      enemy.pathT += speed * dt

      if (enemy.pathT >= PATH_CELLS.length - 1) {
        this.gameState.damageBase(enemy.baseDamage)
        this._removeEnemyAt(i)
        continue
      }

      this._syncEnemyMesh(enemy)
    }

    if (
      this.spawnQueue.every((entry) => entry.spawned) &&
      this.enemies.length === 0 &&
      this.gameState.phase === 'combat'
    ) {
      const waveBaseDamage = this.gameState.waveLeakDamage
      const title = this.currentWave?.title ?? ''
      this.onWaveClear?.({ waveBaseDamage, title })
    }
  }

  /** @param {Enemy} enemy @param {number} now */
  isRevealed(enemy, now) {
    return !enemy.stealth || now < enemy.revealedUntil
  }

  /**
   * @param {Enemy} enemy
   * @param {number} damage
   * @param {number} now
   */
  applyDamage(enemy, damage, now) {
    let amount = damage
    const def = getEnemyDef(enemy.type)
    if (def.armor) {
      amount *= 1 - def.armor
    }
    if (enemy.stealth && !this.isRevealed(enemy, now)) {
      amount *= 1 - enemy.stealthArmor
    }
    enemy.hp -= amount
    if (enemy.hp <= 0) {
      const index = this.enemies.indexOf(enemy)
      if (index >= 0) {
        this.onKill?.(enemy)
        this._removeEnemyAt(index)
      }
      return true
    }
    this._flashEnemyHit(enemy)
    return false
  }

  /** @param {Enemy} enemy @param {number} now @param {number} duration */
  reveal(enemy, now, duration) {
    enemy.revealedUntil = now + duration
    this._syncEnemyMesh(enemy)
  }

  /** @param {Enemy} enemy @param {number} now @param {number} duration */
  applySlow(enemy, now, duration) {
    enemy.slowUntil = Math.max(enemy.slowUntil, now + duration)
  }

  /** @param {Enemy} enemy */
  getBoardPosition(enemy) {
    return this.board.pathPosition(enemy.pathT)
  }

  get activeCount() {
    return this.enemies.length
  }

  get remainingSpawns() {
    return this.spawnQueue.filter((entry) => !entry.spawned).length
  }

  _trySpawnQueued() {
    for (const entry of this.spawnQueue) {
      if (entry.spawned) continue
      if (entry.at > this.waveElapsed) continue
      if (this.enemies.length >= MAX_ACTIVE_ENEMIES) continue

      this._spawnEnemy(entry.type)
      entry.spawned = true
    }
  }

  /** @param {string} type */
  _spawnEnemy(type) {
    const def = getEnemyDef(type)
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(def.radius, 14, 10),
      new THREE.MeshStandardMaterial({
        color: def.color,
        emissive: def.color,
        emissiveIntensity: 0.3,
        transparent: Boolean(def.stealth),
        opacity: def.stealth ? 0.55 : 1,
        roughness: 0.45,
        metalness: 0.25,
      }),
    )
    mesh.castShadow = true
    disableRaycastDeep(mesh)

    /** @type {Enemy} */
    const enemy = {
      id: this.nextEnemyId++,
      type,
      pathT: 0,
      baseSpeed: def.speed,
      speedMult: 1,
      slowUntil: 0,
      revealedUntil: 0,
      hp: def.hp,
      maxHp: def.hp,
      baseDamage: def.baseDamage,
      stealth: Boolean(def.stealth),
      stealthArmor: def.stealthArmor ?? 0,
      armor: def.armor ?? 0,
      mesh,
    }

    this._syncEnemyMesh(enemy)
    this.enemiesRoot.add(mesh)
    this.enemies.push(enemy)
  }

  /** @param {Enemy} enemy */
  _syncEnemyMesh(enemy) {
    const pos = this.board.pathPosition(enemy.pathT)
    enemy.mesh.position.set(pos.x, ENEMY_Y, pos.z)
    if (enemy.stealth) {
      const revealed = this.isRevealed(enemy, this.elapsed)
      enemy.mesh.material.opacity = revealed ? 1 : 0.58
      enemy.mesh.material.emissiveIntensity = revealed ? 0.45 : 0.12
    }
  }

  /** @param {Enemy} enemy */
  _flashEnemyHit(enemy) {
    enemy.mesh.material.emissiveIntensity = 0.65
    window.setTimeout(() => {
      if (!enemy.mesh.parent) return
      const revealed = !enemy.stealth || this.isRevealed(enemy, this.elapsed)
      enemy.mesh.material.emissiveIntensity = enemy.stealth && !revealed ? 0.08 : 0.15
    }, 60)
  }

  /** @param {number} index */
  _removeEnemyAt(index) {
    const enemy = this.enemies[index]
    this._disposeEnemyMesh(enemy)
    this.enemies.splice(index, 1)
  }

  /** @param {Enemy} enemy */
  _disposeEnemyMesh(enemy) {
    this.enemiesRoot.remove(enemy.mesh)
    enemy.mesh.geometry.dispose()
    enemy.mesh.material.dispose()
  }
}
