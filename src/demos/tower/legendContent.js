import { ENEMY_TYPES, TOWER_DEFS, TOWER_ORDER } from './gameRules.js'

/**
 * @typedef {object} LegendEntry
 * @property {string} glyph Shape symbol shown in the legend
 * @property {string} name Short label
 * @property {string} detail One-line description
 * @property {number} [color] Label tint (matches board / mesh color)
 */

/**
 * @typedef {object} LegendSection
 * @property {string} title
 * @property {LegendEntry[]} entries
 */

/** @type {Record<string, string>} */
const TOWER_GLYPHS = {
  firewall: '▢',
  edr: '▲',
  ids: '◆',
  mfa: '◎',
}

/** @type {Record<string, string>} */
const TOWER_DETAILS = {
  firewall: 'cube — slows threats',
  edr: 'cone — burst damage',
  ids: 'diamond — reveals spies',
  mfa: 'ring — strong vs bots',
}

/** @type {Record<string, string>} */
const THREAT_DETAILS = {
  scout: 'small sphere — recon',
  worm: 'green sphere — spreads',
  trojan: 'large orange sphere — heavy',
  spy: 'faint purple sphere — stealth',
  bot: 'tiny red sphere — swarm',
  ransom: 'gray sphere — armored',
  phish: 'red sphere — social trick',
}

/** Campaign legend — kept in sync with Board.js and mesh builders. */
export const LEGEND_SECTIONS = /** @type {LegendSection[]} */ ([
  {
    title: 'Map',
    entries: [
      {
        glyph: '▬',
        name: 'Blue strip',
        detail: 'attack path — cannot build',
        color: 0x3d8bfd,
      },
      {
        glyph: '▬',
        name: 'Green band',
        detail: 'DMZ — bonus vs scouts',
        color: 0x2ecc71,
      },
      {
        glyph: '●',
        name: 'Red pillar',
        detail: 'base — leaks cost HP',
        color: 0xe74c3c,
      },
    ],
  },
  {
    title: 'Controls',
    entries: TOWER_ORDER.map((type) => {
      const def = TOWER_DEFS[type]
      return {
        glyph: TOWER_GLYPHS[type],
        name: def.label,
        detail: TOWER_DETAILS[type],
        color: def.color,
      }
    }),
  },
  {
    title: 'Threats',
    entries: [
      'scout',
      'worm',
      'trojan',
      'spy',
      'bot',
      'ransom',
      'phish',
    ].map((type) => {
      const def = ENEMY_TYPES[type]
      return {
        glyph: '●',
        name: def.label,
        detail: THREAT_DETAILS[type],
        color: def.color,
      }
    }),
  },
])
