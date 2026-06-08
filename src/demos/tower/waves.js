/**
 * Eight-wave campaign tied to attack lifecycle phases.
 *
 * @typedef {object} CampaignWave
 * @property {number} id
 * @property {string} title
 * @property {string} phase Attack lifecycle label
 * @property {string} briefing Pre-wave panel copy
 * @property {string} debrief Post-wave summary
 * @property {string} habit Concrete security habit
 * @property {string | null} irChallenge Key into lessonService IR_CHALLENGES
 * @property {Array<{ type: string, at: number }>} spawns
 */

/** @type {CampaignWave[]} */
export const CAMPAIGN_WAVES = [
  {
    id: 1,
    title: 'Perimeter scan',
    phase: 'Reconnaissance',
    briefing:
      'Scout drones map your external surface. DMZ controls slow recon — place Firewall segments on the left band.',
    debrief: 'Recon was contained before major mapping completed.',
    habit: 'Habit: inventory internet-facing services each month.',
    irChallenge: null,
    spawns: [
      { type: 'scout', at: 0 },
      { type: 'scout', at: 1.2 },
      { type: 'scout', at: 2.4 },
      { type: 'scout', at: 3.6 },
    ],
  },
  {
    id: 2,
    title: 'Phish hook',
    phase: 'Initial access',
    briefing:
      'Trojan wagons and phish hooks target users and suppliers. EDR bursts help against heavy payloads.',
    debrief: 'Initial access attempts were disrupted at the edge.',
    habit: 'Habit: report suspicious links — do not click to “check”.',
    irChallenge: 'credential_rotate',
    spawns: [
      { type: 'scout', at: 0 },
      { type: 'phish', at: 1.5 },
      { type: 'phish', at: 2.2 },
      { type: 'trojan', at: 3.5 },
      { type: 'scout', at: 4.5 },
    ],
  },
  {
    id: 3,
    title: 'Silent foothold',
    phase: 'Persistence',
    briefing:
      'Worms propagate along the path and trojans linger. Layer slows with Firewall chokepoints.',
    debrief: 'Persistence mechanisms failed to establish a stable foothold.',
    habit: 'Habit: patch critical systems on a fixed cadence.',
    irChallenge: null,
    spawns: [
      { type: 'worm', at: 0 },
      { type: 'worm', at: 1.4 },
      { type: 'trojan', at: 2.8 },
      { type: 'worm', at: 4.0 },
      { type: 'trojan', at: 5.5 },
    ],
  },
  {
    id: 4,
    title: 'Lateral crawl',
    phase: 'Lateral movement',
    briefing:
      'Threats pivot through the grid. Spread controls across buildable cells before the path fills.',
    debrief: 'Lateral movement was limited to the path corridor.',
    habit: 'Habit: segment internal networks — avoid flat LANs.',
    irChallenge: 'isolate_host',
    spawns: [
      { type: 'worm', at: 0 },
      { type: 'worm', at: 1.0 },
      { type: 'bot', at: 2.2 },
      { type: 'bot', at: 2.5 },
      { type: 'worm', at: 3.8 },
      { type: 'trojan', at: 5.0 },
    ],
  },
  {
    id: 5,
    title: 'Bot surge',
    phase: 'Automated pressure',
    briefing:
      'Bot swarms flood the path. MFA gates excel against high-volume automated logins.',
    debrief: 'Volume attacks were throttled before overwhelming the base.',
    habit: 'Habit: enforce MFA on every admin and remote access path.',
    irChallenge: null,
    spawns: [
      { type: 'bot', at: 0 },
      { type: 'bot', at: 0.4 },
      { type: 'bot', at: 0.8 },
      { type: 'bot', at: 1.2 },
      { type: 'bot', at: 2.0 },
      { type: 'bot', at: 2.3 },
      { type: 'scout', at: 4.0 },
    ],
  },
  {
    id: 6,
    title: 'Insider ghost',
    phase: 'Insider / stealth',
    briefing:
      'Insider spies stay hidden until IDS tags them. Pair IDS lookouts with EDR or Firewall.',
    debrief: 'Stealth threats were revealed before reaching the base.',
    habit: 'Habit: log and review privileged access — least privilege wins.',
    irChallenge: 'review_access',
    spawns: [
      { type: 'spy', at: 0 },
      { type: 'scout', at: 1.5 },
      { type: 'spy', at: 3.0 },
      { type: 'worm', at: 4.2 },
      { type: 'spy', at: 5.5 },
    ],
  },
  {
    id: 7,
    title: 'Ransom lock',
    phase: 'Impact / availability',
    briefing:
      'Ransom glyphs are armored and slow. Firewall slow plus EDR burst breaks their timing.',
    debrief: 'Availability impact was contained — no full lockout.',
    habit: 'Habit: test restores from offline backups regularly.',
    irChallenge: null,
    spawns: [
      { type: 'ransom', at: 0 },
      { type: 'trojan', at: 2.5 },
      { type: 'ransom', at: 4.5 },
      { type: 'worm', at: 6.0 },
    ],
  },
  {
    id: 8,
    title: 'Exfil run',
    phase: 'Exfiltration',
    briefing:
      'Final wave mixes every threat type. Spend remaining budget wisely — this is the exfil attempt.',
    debrief: 'The campaign path is clear. You held the trust boundary.',
    habit: 'Habit: run tabletop exercises with your team twice a year.',
    irChallenge: null,
    spawns: [
      { type: 'scout', at: 0 },
      { type: 'phish', at: 1.0 },
      { type: 'bot', at: 2.0 },
      { type: 'bot', at: 2.3 },
      { type: 'spy', at: 3.5 },
      { type: 'ransom', at: 5.0 },
      { type: 'trojan', at: 6.5 },
      { type: 'worm', at: 7.5 },
    ],
  },
]

export const WAVE_COUNT = CAMPAIGN_WAVES.length

/** Seconds to acknowledge IR panel before run fails. */
export const IR_DURATION_SEC = 20

/** @param {number} index */
export function getCampaignWave(index) {
  if (index < 0 || index >= CAMPAIGN_WAVES.length) return null
  return CAMPAIGN_WAVES[index]
}
