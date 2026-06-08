import * as THREE from 'three'
import {
  CELL_SIZE,
  DMZ_MAX_COL,
  GRID_COLS,
  GRID_ROWS,
  PATH_CELLS,
  isBuildableCell,
  isDmzCell,
  isPathCell,
} from './constants.js'
import { disableRaycastDeep } from './boardRaycast.js'

const _localPoint = new THREE.Vector3()

/**
 * Translucent playfield: grid, highlighted path, DMZ band, and base marker.
 * Ray interaction uses one invisible hit plane so the reticle never sticks
 * on overlays, grid lines, or the hover marker.
 */
export class Board {
  constructor() {
    this.root = new THREE.Group()
    this.root.name = 'TowerBoard'
    this.hoverMarker = null
    this.hitPlane = null
    this._buildHitPlane()
    this._buildSurface()
    this._buildDmzBand()
    this._buildPathHighlight()
    this._buildGridLines()
    this._buildBaseMarker()
    this._buildHoverMarker()
  }

  /**
   * @param {THREE.Vector3} worldPoint
   * @returns {{ col: number, row: number } | null}
   */
  worldPointToCell(worldPoint) {
    _localPoint.copy(worldPoint)
    this.root.worldToLocal(_localPoint)

    const col = Math.round(_localPoint.x / CELL_SIZE + (GRID_COLS - 1) / 2)
    const row = Math.round(_localPoint.z / CELL_SIZE + (GRID_ROWS - 1) / 2)
    if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) {
      return null
    }
    return { col, row }
  }

  /** @param {number} col @param {number} row */
  showHoverCell(col, row) {
    if (!this.hoverMarker) return
    const { x, z } = this.cellCenter(col, row)
    this.hoverMarker.position.set(x, 0.006, z)

    const material = this.hoverMarker.material
    if (isPathCell(col, row)) {
      material.color.setHex(0xff9999)
      material.opacity = 0.28
    } else if (isDmzCell(col, row)) {
      material.color.setHex(0xccffcc)
      material.opacity = 0.38
    } else if (isBuildableCell(col, row)) {
      material.color.setHex(0xffffff)
      material.opacity = 0.38
    } else {
      material.color.setHex(0xffffff)
      material.opacity = 0.3
    }

    this.hoverMarker.visible = true
  }

  hideHoverCell() {
    if (this.hoverMarker) this.hoverMarker.visible = false
  }

  pulseSelect() {
    const material = this.surface.material
    material.emissive.setHex(0x224466)
    material.emissiveIntensity = 0.45
    window.setTimeout(() => {
      material.emissive.setHex(0x000000)
      material.emissiveIntensity = 0
    }, 120)
  }

  pulseReject() {
    const material = this.surface.material
    material.emissive.setHex(0x662222)
    material.emissiveIntensity = 0.5
    window.setTimeout(() => {
      material.emissive.setHex(0x000000)
      material.emissiveIntensity = 0
    }, 120)
  }

  /** @param {number} col @param {number} row */
  cellCenter(col, row) {
    const x = (col - (GRID_COLS - 1) / 2) * CELL_SIZE
    const z = (row - (GRID_ROWS - 1) / 2) * CELL_SIZE
    return { x, z }
  }

  /**
   * Interpolate along the path in cell units (0 = spawn, last index = base).
   * @param {number} pathT
   */
  pathPosition(pathT) {
    const clamped = Math.max(0, Math.min(pathT, PATH_CELLS.length - 1))
    const index = Math.floor(clamped)
    const frac = clamped - index
    const a = PATH_CELLS[index]
    const b = PATH_CELLS[Math.min(index + 1, PATH_CELLS.length - 1)]
    const start = this.cellCenter(a.col, a.row)
    const end = this.cellCenter(b.col, b.row)
    return {
      x: start.x + (end.x - start.x) * frac,
      z: start.z + (end.z - start.z) * frac,
    }
  }

  _buildHitPlane() {
    const width = GRID_COLS * CELL_SIZE
    const depth = GRID_ROWS * CELL_SIZE
    const hitPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(width, depth),
      new THREE.MeshBasicMaterial({
        visible: false,
        side: THREE.FrontSide,
      }),
    )
    hitPlane.rotation.x = -Math.PI / 2
    hitPlane.position.y = 0.01
    hitPlane.name = 'boardHitPlane'
    hitPlane.userData.boardHitTarget = true
    this.root.add(hitPlane)
    this.hitPlane = hitPlane
  }

  _buildSurface() {
    const width = GRID_COLS * CELL_SIZE
    const depth = GRID_ROWS * CELL_SIZE
    const surface = new THREE.Mesh(
      new THREE.PlaneGeometry(width, depth),
      new THREE.MeshStandardMaterial({
        color: 0x1a2840,
        transparent: true,
        opacity: 0.38,
        side: THREE.DoubleSide,
        roughness: 0.85,
        metalness: 0.05,
      }),
    )
    surface.rotation.x = -Math.PI / 2
    surface.position.y = 0.001
    surface.name = 'boardSurface'
    surface.receiveShadow = true
    disableRaycastDeep(surface)
    this.root.add(surface)
    this.surface = surface
  }

  _buildDmzBand() {
    const group = new THREE.Group()
    group.name = 'dmzBand'

    for (let col = 0; col <= DMZ_MAX_COL; col++) {
      for (let row = 0; row < GRID_ROWS; row++) {
        if (!isDmzCell(col, row)) continue
        const { x, z } = this.cellCenter(col, row)
        const cell = new THREE.Mesh(
          new THREE.PlaneGeometry(CELL_SIZE * 0.94, CELL_SIZE * 0.94),
          new THREE.MeshBasicMaterial({
            color: 0x2ecc71,
            transparent: true,
            opacity: 0.38,
            side: THREE.DoubleSide,
            depthWrite: false,
          }),
        )
        cell.rotation.x = -Math.PI / 2
        cell.position.set(x, 0.002, z)
        group.add(cell)
      }
    }

    disableRaycastDeep(group)
    this.root.add(group)
  }

  _buildPathHighlight() {
    const group = new THREE.Group()
    group.name = 'pathStrip'

    for (const { col, row } of PATH_CELLS) {
      const { x, z } = this.cellCenter(col, row)
      const cell = new THREE.Mesh(
        new THREE.PlaneGeometry(CELL_SIZE * 0.9, CELL_SIZE * 0.9),
        new THREE.MeshBasicMaterial({
          color: 0x3d8bfd,
          transparent: true,
          opacity: 0.8,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      )
      cell.rotation.x = -Math.PI / 2
      cell.position.set(x, 0.0025, z)
      group.add(cell)
    }

    disableRaycastDeep(group)
    this.root.add(group)
  }

  _buildGridLines() {
    const points = []
    const halfW = (GRID_COLS * CELL_SIZE) / 2
    const halfD = (GRID_ROWS * CELL_SIZE) / 2
    const y = 0.003

    for (let col = 0; col <= GRID_COLS; col++) {
      const x = -halfW + col * CELL_SIZE
      points.push(x, y, -halfD, x, y, halfD)
    }
    for (let row = 0; row <= GRID_ROWS; row++) {
      const z = -halfD + row * CELL_SIZE
      points.push(-halfW, y, z, halfW, y, z)
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute(
      'position',
      new THREE.Float32BufferAttribute(points, 3),
    )
    const lines = new THREE.LineSegments(
      geometry,
      new THREE.LineBasicMaterial({
        color: 0x8899aa,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      }),
    )
    lines.name = 'gridLines'
    disableRaycastDeep(lines)
    this.root.add(lines)
  }

  _buildBaseMarker() {
    const end = PATH_CELLS[PATH_CELLS.length - 1]
    const { x, z } = this.cellCenter(end.col, end.row)

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(CELL_SIZE * 0.18, CELL_SIZE * 0.32, 32),
      new THREE.MeshBasicMaterial({
        color: 0xff6b6b,
        transparent: true,
        opacity: 0.95,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    )
    ring.rotation.x = -Math.PI / 2
    ring.position.set(x, 0.004, z)

    const pillar = new THREE.Mesh(
      new THREE.CylinderGeometry(CELL_SIZE * 0.12, CELL_SIZE * 0.16, 0.045, 20),
      new THREE.MeshStandardMaterial({
        color: 0xe74c3c,
        emissive: 0x661111,
        emissiveIntensity: 0.35,
        roughness: 0.4,
        metalness: 0.2,
        depthWrite: false,
      }),
    )
    pillar.position.set(x, 0.025, z)
    pillar.castShadow = true

    const baseGroup = new THREE.Group()
    baseGroup.name = 'baseMarker'
    baseGroup.add(ring)
    baseGroup.add(pillar)
    disableRaycastDeep(baseGroup)
    this.root.add(baseGroup)
    this.baseMarker = baseGroup
  }

  _buildHoverMarker() {
    const marker = new THREE.Mesh(
      new THREE.PlaneGeometry(CELL_SIZE * 0.88, CELL_SIZE * 0.88),
      new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.35,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    )
    marker.rotation.x = -Math.PI / 2
    marker.visible = false
    marker.name = 'hoverCell'
    disableRaycastDeep(marker)
    this.root.add(marker)
    this.hoverMarker = marker
  }
}
