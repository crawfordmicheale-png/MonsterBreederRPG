// Elemental affinities and the effectiveness chart.
// Affinities are the shared vocabulary between species, moves and habitats.

export const AFFINITIES = {
  flame:  { id: 'flame',  name: 'Flame',  glyph: '▲', hue: 18,  tint: '#e0653a' },
  tide:   { id: 'tide',   name: 'Tide',   glyph: '≈', hue: 200, tint: '#3f8fbf' },
  grove:  { id: 'grove',  name: 'Grove',  glyph: '♣', hue: 110, tint: '#5c9a4a' },
  stone:  { id: 'stone',  name: 'Stone',  glyph: '◆', hue: 30,  tint: '#9a8468' },
  metal:  { id: 'metal',  name: 'Metal',  glyph: '■', hue: 210, tint: '#8b93a0' },
  gale:   { id: 'gale',   name: 'Gale',   glyph: '✦', hue: 165, tint: '#7fc0ae' },
  spark:  { id: 'spark',  name: 'Spark',  glyph: '⚡', hue: 50,  tint: '#e0bb3a' },
  frost:  { id: 'frost',  name: 'Frost',  glyph: '❄', hue: 190, tint: '#9fd0de' },
  light:  { id: 'light',  name: 'Light',  glyph: '☀', hue: 45,  tint: '#efd88a' },
  shade:  { id: 'shade',  name: 'Shade',  glyph: '☽', hue: 275, tint: '#6b5a86' },
  aether: { id: 'aether', name: 'Aether', glyph: '✹', hue: 300, tint: '#b184c4' },
};

export const AFFINITY_IDS = Object.keys(AFFINITIES);

// chart[attacker][defender] = multiplier. Anything unlisted is 1.
const CHART = {
  flame:  { grove: 2, frost: 2, chitinShell: 1, tide: 0.5, stone: 0.5, flame: 0.5 },
  tide:   { flame: 2, stone: 2, grove: 0.5, tide: 0.5, spark: 0.5 },
  grove:  { tide: 2, stone: 2, flame: 0.5, grove: 0.5, gale: 0.5, metal: 0.5 },
  stone:  { flame: 2, spark: 2, frost: 2, grove: 0.5, metal: 0.5 },
  metal:  { frost: 2, grove: 2, flame: 0.5, metal: 0.5, spark: 0.5 },
  gale:   { grove: 2, chitin: 2, stone: 0.5, metal: 0.5, spark: 0.5 },
  spark:  { tide: 2, gale: 2, stone: 0.5, grove: 0.5, spark: 0.5 },
  frost:  { grove: 2, gale: 2, flame: 0.5, frost: 0.5, metal: 0.5 },
  light:  { shade: 2, aether: 1.5, light: 0.5, metal: 0.5 },
  shade:  { light: 2, aether: 1.5, shade: 0.5, stone: 0.5 },
  aether: { aether: 2, light: 0.5, shade: 0.5 },
};

/**
 * Effectiveness of a move affinity against a defender that may carry two
 * affinities. Multipliers stack, matching the layered feel of dual-affinity
 * breeding described in the bible.
 */
export function effectiveness(moveAffinity, defenderAffinities) {
  const row = CHART[moveAffinity] || {};
  let mult = 1;
  for (const def of defenderAffinities) {
    if (!def) continue;
    mult *= row[def] ?? 1;
  }
  return mult;
}

export function effectivenessLabel(mult) {
  if (mult >= 2) return { text: 'Devastating', tone: 'good' };
  if (mult > 1) return { text: 'Effective', tone: 'good' };
  if (mult === 1) return { text: 'Neutral', tone: 'flat' };
  if (mult > 0.3) return { text: 'Resisted', tone: 'bad' };
  return { text: 'Nullified', tone: 'bad' };
}

export function affinityName(id) {
  return AFFINITIES[id]?.name ?? id;
}

export function affinityTint(id) {
  return AFFINITIES[id]?.tint ?? '#8a7a68';
}
