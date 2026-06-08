/** @typedef {'firewall' | 'edr' | 'ids' | 'mfa'} TowerType */

/** @type {TowerType[]} */
export const TOWER_ORDER = ['firewall', 'edr', 'ids', 'mfa']

/** @type {Record<TowerType, object>} */
export const TOWER_DEFS = {
  firewall: {
    label: 'Firewall',
    short: 'FW',
    cost: 4,
    rangeCells: 2.2,
    damage: 0.85,
    cooldown: 0.55,
    slowFactor: 0.52,
    slowDuration: 1.4,
    color: 0x3498db,
  },
  edr: {
    label: 'EDR',
    short: 'EDR',
    cost: 6,
    rangeCells: 2.0,
    damage: 4.8,
    cooldown: 1.75,
    color: 0x9b59b6,
  },
  ids: {
    label: 'IDS',
    short: 'IDS',
    cost: 5,
    rangeCells: 2.5,
    damage: 0.25,
    cooldown: 0.75,
    revealDuration: 3.5,
    color: 0xf1c40f,
  },
  mfa: {
    label: 'MFA gate',
    short: 'MFA',
    cost: 5,
    rangeCells: 1.9,
    damage: 1.1,
    cooldown: 0.42,
    botDamageMultiplier: 2.6,
    color: 0x1abc9c,
  },
}

/** Enemy archetypes for Phase 3 combat testing. */
export const ENEMY_TYPES = {
  scout: {
    label: 'Scout drone',
    speed: 0.42,
    hp: 3,
    baseDamage: 1,
    reward: 2,
    color: 0x5dade2,
    radius: 0.022,
  },
  worm: {
    label: 'Worm',
    speed: 0.34,
    hp: 4,
    baseDamage: 1,
    reward: 2,
    color: 0x58d68d,
    radius: 0.02,
  },
  trojan: {
    label: 'Trojan wagon',
    speed: 0.26,
    hp: 9,
    baseDamage: 2,
    reward: 4,
    color: 0xf5b041,
    radius: 0.026,
  },
  spy: {
    label: 'Insider spy',
    speed: 0.38,
    hp: 7,
    baseDamage: 2,
    reward: 5,
    stealth: true,
    stealthArmor: 0.78,
    color: 0xbb8fce,
    radius: 0.021,
  },
  bot: {
    label: 'Bot swarm',
    speed: 0.48,
    hp: 2,
    baseDamage: 1,
    reward: 1,
    isBot: true,
    color: 0xec7063,
    radius: 0.015,
  },
  ransom: {
    label: 'Ransom glyph',
    speed: 0.22,
    hp: 14,
    baseDamage: 3,
    reward: 6,
    armor: 0.25,
    color: 0x566573,
    radius: 0.028,
  },
  phish: {
    label: 'Phish hook',
    speed: 0.36,
    hp: 3,
    baseDamage: 2,
    reward: 3,
    color: 0xe74c3c,
    radius: 0.019,
  },
}

/** @param {string} type */
export function getEnemyDef(type) {
  return ENEMY_TYPES[type] ?? ENEMY_TYPES.scout
}

/** @param {TowerType} type */
export function getTowerDef(type) {
  return TOWER_DEFS[type] ?? TOWER_DEFS.firewall
}

/** @param {number} index */
export function towerTypeAtIndex(index) {
  const i = ((index % TOWER_ORDER.length) + TOWER_ORDER.length) % TOWER_ORDER.length
  return TOWER_ORDER[i]
}
