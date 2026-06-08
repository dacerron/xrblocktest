/** Grid dimensions and placement rules for Tower Security. */

export const GRID_COLS = 8
export const GRID_ROWS = 5
/** World size of one grid cell in meters. */
export const CELL_SIZE = 0.09
/** Left-band columns (inclusive) that grant bonus vs scout enemies. */
export const DMZ_MAX_COL = 1

/** Starting base health (security posture). */
export const BASE_HP_MAX = 20
/** Cap on live enemies for Quest-class performance. */
export const MAX_ACTIVE_ENEMIES = 12
/** Local Y offset for enemy meshes above the board. */
export const ENEMY_Y = 0.028
/** Local Y offset for placed tower meshes. */
export const TOWER_Y = 0.042

export const PATH_ROW = Math.floor(GRID_ROWS / 2)

/** Path runs horizontally through the middle row, left (spawn) to right (base). */
export const PATH_CELLS = Array.from({ length: GRID_COLS }, (_, col) => ({
  col,
  row: PATH_ROW,
}))

/** @param {number} col @param {number} row */
export function isPathCell(col, row) {
  return row === PATH_ROW && col >= 0 && col < GRID_COLS
}

/** @param {number} col @param {number} row */
export function isDmzCell(col, row) {
  return col <= DMZ_MAX_COL && col >= 0 && !isPathCell(col, row)
}

/** @param {number} col @param {number} row */
export function isBuildableCell(col, row) {
  if (col < 0 || col >= GRID_COLS || row < 0 || row >= GRID_ROWS) return false
  return !isPathCell(col, row)
}
