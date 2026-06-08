/**
 * Offline lesson copy — IR challenges and optional AI-style hints (Phase 6).
 */

/** @type {Record<string, { title: string, prompt: string, hint: string }>} */
export const IR_CHALLENGES = {
  credential_rotate: {
    title: 'IR — credential rotation',
    prompt:
      'Impossible-travel alert on a service account. Rotate its password and confirm MFA on admin paths.',
    hint: 'Acknowledge when your runbook step is complete.',
  },
  isolate_host: {
    title: 'IR — host isolation',
    prompt:
      'A workstation is beaconing laterally. Isolate it from the network and preserve logs for review.',
    hint: 'Acknowledge once the host is quarantined.',
  },
  review_access: {
    title: 'IR — access review',
    prompt:
      'Privileged access spike detected. Revoke stale admin rights and verify IDS coverage on sensitive paths.',
    hint: 'Acknowledge after access is trimmed.',
  },
}

/**
 * @param {string | null | undefined} key
 * @returns {{ title: string, prompt: string, hint: string } | null}
 */
export function getIrChallenge(key) {
  if (!key) return null
  return IR_CHALLENGES[key] ?? null
}

/**
 * Deterministic hint for briefing (optional ?ai=1 in Phase 6).
 * @param {import('./waves.js').CampaignWave} wave
 * @param {boolean} aiEnabled
 */
export function getBriefingHint(wave, aiEnabled) {
  if (!aiEnabled) return ''
  const hints = {
    1: 'Tip: DMZ band (left columns) boosts Firewall vs scouts.',
    2: 'Tip: Place EDR near the path mouth for trojans.',
    3: 'Tip: Worms clump — Firewall slow stacks on one lane.',
    4: 'Tip: Cover multiple lanes before bots arrive.',
    5: 'Tip: MFA gates near the path center catch bot swarms.',
    6: 'Tip: IDS must tag spies before EDR can burst them.',
    7: 'Tip: Slow ransom glyphs, then burst with EDR.',
    8: 'Tip: IDS first when spies mix with bots.',
  }
  return hints[wave.id] ?? ''
}
