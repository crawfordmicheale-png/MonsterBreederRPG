// Environmental hazards.
//
// Chapter Two is the first place breeding unlocks *terrain* rather than power:
// the deep furnace tunnels are simply too hot for an ordinary team.
//
// The bible is explicit (§4.2) that story-critical breeding requirements are
// trait-based, not species-based, and that several combinations must satisfy
// them. So tolerance is a sum, not a flag. A dedicated Heatproof allele is the
// most direct route, but a Flame affinity, a plated body, or a stubborn
// disposition all count toward the same threshold — and a Kinbeast can get
// there by any mix of them.

export const HAZARDS = {
  heat: {
    id: 'heat',
    name: 'Furnace Heat',
    resistLocus: 'res_heat',
    traitName: 'Heatproof',
    threshold: 76,
    blurb: 'Air that dries your eyes shut. Nothing without protection lasts long down there.',
    affinities: { flame: 26, stone: 10, metal: 12, light: 4, frost: -24, tide: -14, grove: -8 },
    tags: { armour: 6, shell: 4, chitin: 3, fur: -6, feather: -4 },
    stat: 'resolve',
    statWeight: 22,
  },
  toxin: {
    id: 'toxin',
    name: 'Chemical Residue',
    resistLocus: 'res_toxin',
    traitName: 'Cleansing',
    threshold: 76,
    blurb: 'The water leaves a film on everything it touches.',
    affinities: { tide: 24, grove: 14, light: 8, metal: 6, shade: -10 },
    tags: { shell: 5, chitin: 4, aquatic: 10, fur: -4 },
    stat: 'vitality',
    statWeight: 22,
  },
  chill: {
    id: 'chill',
    name: 'Killing Cold',
    resistLocus: 'res_chill',
    traitName: 'Coldproof',
    threshold: 76,
    blurb: 'Cold that gets into the joints and stays.',
    affinities: { frost: 26, metal: 8, stone: 8, flame: 14, tide: -8 },
    tags: { fur: 10, feather: 7, armour: 4, chitin: -8 },
    stat: 'vitality',
    statWeight: 22,
  },
};

export const HAZARD_IDS = Object.keys(HAZARDS);

/** The three alleles a resistance locus can carry. */
export const RESIST_ALLELES = {
  none:    { key: 'none',    name: 'None',        v: 0,   dom: 0 },
  partial: { key: 'partial', name: 'Partial',     v: 0.5, dom: 1 },
  full:    { key: 'full',    name: 'Full',        v: 1,   dom: 2 },
};

/**
 * Resolve a resistance locus pair into an expressed 0..1 value.
 *
 * Resistance is incompletely dominant rather than all-or-nothing: a single
 * copy does most of the work but two copies do more. That gives a breeder a
 * reason to keep consolidating a line instead of stopping at the first carrier,
 * and it makes the difference between a carrier and a true-breeding pair
 * something you can see in the tolerance number.
 */
const RESISTANCE_LADDER = {
  'full+full': 1,
  'full+partial': 0.85,
  'full+none': 0.7,
  'partial+partial': 0.5,
  'partial+none': 0.3,
  'none+none': 0,
};

export function expressResistance(pair) {
  if (!pair) return 0;
  const keys = pair
    .map((x) => (RESIST_ALLELES[x.v] ? x.v : 'none'))
    .sort((a, b) => (RESIST_ALLELES[b].v - RESIST_ALLELES[a].v));
  return RESISTANCE_LADDER[`${keys[0]}+${keys[1]}`] ?? 0;
}

/**
 * How well a Kinbeast copes with a hazard, and why.
 * Returns the score, the threshold, and an itemised breakdown so the UI can
 * tell the player exactly which part of their breeding plan is short.
 */
export function tolerance(beast, hazardId) {
  const hazard = HAZARDS[hazardId];
  if (!hazard) return { score: 0, threshold: 0, ok: true, parts: [] };
  const p = beast.phenotype;
  const parts = [];
  let score = 0;

  const inherited = (p.resistances?.[hazardId] ?? 0) * 64;
  if (inherited) {
    score += inherited;
    parts.push({ label: `Inherited ${hazard.traitName}`, value: Math.round(inherited) });
  }

  for (const affinity of p.affinities) {
    const bonus = hazard.affinities[affinity];
    if (bonus) {
      score += bonus;
      parts.push({ label: `${affinity} affinity`, value: bonus });
    }
  }

  for (const tag of p.bodyTags) {
    const bonus = hazard.tags[tag];
    if (bonus) {
      score += bonus;
      parts.push({ label: `${tag} body`, value: bonus });
    }
  }

  const constitution = p.aptitudes[hazard.stat] * hazard.statWeight;
  score += constitution;
  parts.push({ label: `${hazard.stat} aptitude`, value: Math.round(constitution) });

  // A body whose traits fight each other copes badly with anything extreme.
  const steadiness = ((beast.stability ?? 80) - 65) * 0.22;
  if (Math.round(steadiness) !== 0) {
    score += steadiness;
    parts.push({ label: 'Stability', value: Math.round(steadiness) });
  }

  const rounded = Math.round(score);
  return {
    score: rounded,
    threshold: hazard.threshold,
    ok: rounded >= hazard.threshold,
    shortfall: Math.max(0, hazard.threshold - rounded),
    parts: parts.sort((a, b) => b.value - a.value),
    hazard,
  };
}

/** The best tolerance across a team, and who is carrying it. */
export function bestTolerance(team, hazardId) {
  let best = null;
  for (const beast of team) {
    const t = tolerance(beast, hazardId);
    if (!best || t.score > best.tolerance.score) best = { beast, tolerance: t };
  }
  return best;
}

/** The party that would actually go in: the three active slots. */
export const PARTY_SIZE = 3;

/**
 * Hazardous places are entered by the whole party, not by its best member.
 *
 * The crews go in threes and nobody is left standing in the heat waiting. This
 * is what stops the chapter being solved by bonding a single well-adapted wild
 * Kinbeast: one Embermole is a donor, not a solution. Three heat-tolerant
 * Kinbeasts is a breeding project.
 */
export function partyClears(team, hazardId) {
  const party = team.slice(0, PARTY_SIZE);
  const members = party.map((beast) => ({ beast, tolerance: tolerance(beast, hazardId) }));
  const weakest = members.reduce(
    (worst, m) => (!worst || m.tolerance.score < worst.tolerance.score ? m : worst),
    null
  );
  return {
    ok: party.length >= PARTY_SIZE && members.every((m) => m.tolerance.ok),
    members,
    weakest,
    shortHanded: party.length < PARTY_SIZE,
    needed: PARTY_SIZE,
  };
}

/** Convenience: can this team enter? */
export function teamClears(team, hazardId) {
  return partyClears(team, hazardId).ok;
}
