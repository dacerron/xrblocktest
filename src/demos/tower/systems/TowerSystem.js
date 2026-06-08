import * as THREE from 'three'
import { CELL_SIZE, TOWER_Y } from '../constants.js'
import { getTowerDef } from '../gameRules.js'
import { canPlaceTower, cellKey } from '../placement.js'
import { disableRaycastDeep } from '../boardRaycast.js'

/**
 * @typedef {import('../gameRules.js').TowerType} TowerType
 * @typedef {object} Tower
 * @property {number} id
 * @property {TowerType} type
 * @property {number} col
 * @property {number} row
 * @property {number} cooldown
 * @property {THREE.Object3D} mesh
 */

/**
 * @param {TowerType} type
 */
function createTowerMesh(type) {
  const def = getTowerDef(type)
  let geometry
  switch (type) {
    case 'edr':
      geometry = new THREE.ConeGeometry(0.026, 0.07, 10)
      break
    case 'ids':
      geometry = new THREE.OctahedronGeometry(0.03, 0)
      break
    case 'mfa':
      geometry = new THREE.TorusGeometry(0.022, 0.007, 8, 14)
      break
    default:
      geometry = new THREE.BoxGeometry(0.042, 0.05, 0.042)
  }

  const mesh = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({
      color: def.color,
      emissive: def.color,
      emissiveIntensity: 0.32,
      roughness: 0.4,
      metalness: 0.35,
    }),
  )
  mesh.castShadow = true
  if (type === 'mfa') {
    mesh.rotation.x = Math.PI / 2
  }
  mesh.scale.setScalar(1.12)
  disableRaycastDeep(mesh)
  return mesh
}

export class TowerSystem {
  /**
   * @param {import('../Board.js').Board} board
   */
  constructor(board) {
    this.board = board
    /** @type {Tower[]} */
    this.towers = []
    /** @type {Set<string>} */
    this.occupied = new Set()
    this.nextTowerId = 1
    this.root = new THREE.Group()
    this.root.name = 'Towers'
    board.root.add(this.root)
  }

  clear() {
    for (const tower of this.towers) {
      this.root.remove(tower.mesh)
      tower.mesh.traverse((child) => {
        if (child.isMesh) {
          child.geometry?.dispose()
          child.material?.dispose()
        }
      })
    }
    this.towers = []
    this.occupied.clear()
  }

  /**
   * @param {TowerType} type
   * @param {number} col
   * @param {number} row
   */
  canPlace(type, col, row) {
    void type
    return canPlaceTower(col, row, this.occupied)
  }

  /**
   * @param {TowerType} type
   * @param {number} col
   * @param {number} row
   */
  place(type, col, row) {
    if (!this.canPlace(type, col, row)) return false

    const mesh = createTowerMesh(type)
    const { x, z } = this.board.cellCenter(col, row)
    mesh.position.set(x, TOWER_Y, z)

    /** @type {Tower} */
    const tower = {
      id: this.nextTowerId++,
      type,
      col,
      row,
      cooldown: 0,
      mesh,
    }

    this.root.add(mesh)
    this.towers.push(tower)
    this.occupied.add(cellKey(col, row))
    return true
  }

  /** @param {Tower} tower */
  rangeWorld(tower) {
    return getTowerDef(tower.type).rangeCells * CELL_SIZE
  }

  /** @param {Tower} tower */
  boardPosition(tower) {
    return this.board.cellCenter(tower.col, tower.row)
  }
}
