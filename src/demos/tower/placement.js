import { isBuildableCell, isDmzCell } from './constants.js'

/** @param {number} col @param {number} row */
export function cellKey(col, row) {
  return `${col},${row}`
}

/**
 * @param {number} col
 * @param {number} row
 * @param {Set<string>} occupied
 */
export function canPlaceTower(col, row, occupied) {
  if (!isBuildableCell(col, row)) return false
  return !occupied.has(cellKey(col, row))
}

/** @param {number} col @param {number} row @param {string} enemyType */
export function dmzDamageMultiplier(col, row, enemyType) {
  return isDmzCell(col, row) && enemyType === 'scout' ? 1.35 : 1
}

/**
 * @param {number} colA
 * @param {number} rowA
 * @param {number} colB
 * @param {number} rowB
 */
export function cellDistance(colA, rowA, colB, rowB) {
  const dx = colA - colB
  const dy = rowA - rowB
  return Math.hypot(dx, dy)
}
