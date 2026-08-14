// Pairing rules, inheritance, mutation and the breeding preview.
//
// Both parents contribute one allele at every locus. The Form Parent decides
// only which species body template the offspring uses — it gets no genetic
// advantage. That separation is what lets a Mossbun line carry Cinderkit
// traits without ever stopping being Mossbuns.

import { getSpecies, sharedFamilies, FEATURE_TAGS } from '../data/species.js';
import { MOVES, isLegacyMove, canPerform } from '../data/moves.js';
import { TENDENCY_IDS } from '../data/temperaments.js';
import { AFFINITY_IDS } from '../data/affinities.js';
import {
  ALL_LOCI,
  FEATURE_SLOTS,
  COLOR_LOCI,
  STAT_KEYS,
  BUILD_ALLELES,
  PATTERN_ALLELES,
  allele,
  cloneGenome,
  expressGenome,
  colorName,
} from './genome.js';

export const MAX_LEGACY_MOVES = 2;

// ---------------------------------------------------------------------------
// Relatedness
// ---------------------------------------------------------------------------

/**
 * Coefficient of relationship, walking up to four generations.
 * `lookup(id)` returns a Kinbeast or undefined.
 */
export function relatedness(a, b, lookup, depth = 4) {
  if (!a || !b) return 0;
  if (a.id === b.id) return 1;
  const ancA = ancestorWeights(a, lookup, depth);
  const ancB = ancestorWeights(b, lookup, depth);
  let shared = 0;
  for (const [id, wa] of ancA) {
    const wb = ancB.get(id);
    if (wb) shared += 2 * wa * wb;
  }
  return Math.min(1, shared);
}

function ancestorWeights(beast, lookup, depth) {
  const weights = new Map();
  const walk = (id, w, d) => {
    if (!id || d > depth || w < 0.01) return;
    weights.set(id, (weights.get(id) ?? 0) + w);
    const node = lookup(id);
    if (!node?.parents) return;
    for (const pid of node.parents) walk(pid, w / 2, d + 1);
  };
  weights.set(beast.id, 1);
  for (const pid of beast.parents ?? []) walk(pid, 0.5, 1);
  return weights;
}

export function relatednessLabel(r) {
  if (r >= 0.9) return { text: 'Same Kinbeast', tone: 'block' };
  if (r >= 0.45) return { text: 'Immediate family', tone: 'block' };
  if (r >= 0.2) return { text: 'Close kin', tone: 'warn' };
  if (r >= 0.08) return { text: 'Distant kin', tone: 'warn' };
  if (r > 0) return { text: 'Faint shared line', tone: 'ok' };
  return { text: 'Unrelated', tone: 'good' };
}

// ---------------------------------------------------------------------------
// Compatibility
// ---------------------------------------------------------------------------

/**
 * Can these two produce an egg? Returns every reason, so the breeding screen
 * can explain itself instead of just greying a button out.
 */
export function checkCompatibility(a, b, ctx = {}) {
  const lookup = ctx.lookup ?? (() => undefined);
  const issues = [];
  const notes = [];

  if (!a || !b) return { ok: false, issues: ['Select two Kinbeasts.'], notes, families: [] };
  if (a.id === b.id) return { ok: false, issues: ['A Kinbeast cannot pair with itself.'], notes, families: [] };

  const families = sharedFamilies(a.genome.species, b.genome.species);
  if (!families.length) {
    issues.push(
      `${getSpecies(a.genome.species).name} and ${getSpecies(b.genome.species).name} share no Brood Family.`
    );
  }

  for (const beast of [a, b]) {
    if (beast.stage !== 'adult' && beast.stage !== 'elder') {
      issues.push(`${beast.name} is not yet an adult.`);
    }
    if (beast.stress >= 70) issues.push(`${beast.name} is under too much stress to pair.`);
  }

  const r = relatedness(a, b, lookup);
  if (r >= 0.45) {
    issues.push('The sanctuary forbids pairing immediate family.');
  } else if (r >= 0.2) {
    notes.push('Close kin — expect a Vigor penalty in the offspring.');
  }

  const sameSpecies = a.genome.species === b.genome.species;
  if (!sameSpecies) {
    if (!ctx.crossSpeciesUnlocked) {
      issues.push('Cross-species pairing requires the Greenmantle outcross techniques.');
    } else {
      notes.push('Outcross — the offspring may express Hybrid Vigor.');
    }
  }

  const social = socialCompatibility(a, b);
  if (social < 0.35) issues.push(`${a.name} and ${b.name} will not settle together.`);
  else if (social < 0.6) notes.push('They tolerate each other, but only just.');

  if (!ctx.nurseryBuilt) issues.push('Briarhold has no working Nursery yet.');

  return { ok: issues.length === 0, issues, notes, families, relatedness: r, social, sameSpecies };
}

/** 0..1 — how well two temperaments and bond levels sit together. */
export function socialCompatibility(a, b) {
  const ta = a.phenotype.temperament;
  const tb = b.phenotype.temperament;
  let score = 0.6;
  const clash = new Set(['territorial', 'aggressive']);
  const easy = new Set(['social', 'gentle', 'playful', 'patient', 'loyal']);
  for (const t of ta) {
    if (easy.has(t)) score += 0.08;
    if (clash.has(t) && tb.some((x) => clash.has(x))) score -= 0.18;
  }
  for (const t of tb) if (easy.has(t)) score += 0.08;
  if (ta.some((t) => tb.includes(t))) score += 0.1;
  score += ((a.bond ?? 0) + (b.bond ?? 0)) / 400;
  const friendship = (a.relationships?.[b.id] ?? 0) / 100;
  score += friendship * 0.25;
  return Math.max(0, Math.min(1, score));
}

// ---------------------------------------------------------------------------
// Producing an egg
// ---------------------------------------------------------------------------

const MUTATION_BASE = 0.012;

/**
 * Create the offspring genome. The genome is fixed the moment the egg is laid
 * — hatching only reveals what was already decided.
 */
export function conceive(formParent, traitParent, rng, ctx = {}) {
  const speciesId = formParent.genome.species;
  const species = getSpecies(speciesId);
  const mutationRate = MUTATION_BASE * (ctx.catalyst ? 6 : 1);
  const loci = {};
  const mutations = [];

  for (const locus of ALL_LOCI) {
    const fromForm = pickAllele(formParent.genome.loci[locus], rng);
    const fromTrait = pickAllele(traitParent.genome.loci[locus], rng);
    let pair = [cloneAllele(fromForm), cloneAllele(fromTrait)];

    for (let i = 0; i < 2; i++) {
      if (rng.chance(mutationRate)) {
        const mutated = mutateAllele(locus, pair[i], rng, species);
        if (mutated) {
          pair[i] = mutated;
          mutations.push(describeMutation(locus, mutated));
        }
      }
    }
    loci[locus] = pair;
  }

  const genome = { species: speciesId, loci, legacyMoves: [], echoes: [] };

  // --- legacy moves ---
  genome.legacyMoves = inheritMoves(formParent, traitParent, genome, rng);

  // --- echo fragments ---
  const echoPool = new Set([...(formParent.genome.echoes ?? []), ...(traitParent.genome.echoes ?? [])]);
  for (const frag of echoPool) {
    // Guaranteed fragments always pass down; story progression must not hinge
    // on a dice roll.
    if (ctx.guaranteedEchoes?.includes(frag) || rng.chance(0.55)) genome.echoes.push(frag);
  }

  const vigor = computeVigor(formParent, traitParent, genome, ctx);
  const stability = computeStability(genome, ctx, mutations.length);

  return { genome, mutations, vigor, stability };
}

function pickAllele(pair, rng) {
  if (!pair) return allele(null, 0);
  return pair[rng.int(0, 1)];
}

function cloneAllele(a) {
  const out = { v: typeof a.v === 'object' && a.v !== null ? { ...a.v } : a.v, dom: a.dom };
  if (a.tag) out.tag = a.tag;
  return out;
}

function mutateAllele(locus, current, rng, species) {
  if (COLOR_LOCI.includes(locus)) {
    const c = current.v ?? { h: 0, s: 40, l: 50 };
    return allele(
      {
        h: (c.h + rng.range(40, 320)) % 360,
        s: Math.max(8, Math.min(95, c.s + rng.bell() * 30)),
        l: Math.max(15, Math.min(90, c.l + rng.bell() * 25)),
      },
      rng.chance(0.4) ? 2 : 1,
      'mutation'
    );
  }
  if (locus === 'pattern') {
    const key = rng.pick(Object.keys(PATTERN_ALLELES).filter((k) => k !== current.v));
    return allele(key, PATTERN_ALLELES[key].dom, 'mutation');
  }
  if (locus === 'build') {
    const key = rng.pick(Object.keys(BUILD_ALLELES).filter((k) => k !== current.v));
    return allele(key, 1, 'mutation');
  }
  if (locus.startsWith('feat_')) {
    const slot = locus.slice(5);
    const pool = Object.keys(FEATURE_TAGS).filter((k) => FEATURE_TAGS[k].slot === slot && k !== current.v);
    if (!pool.length) return null;
    return allele(rng.pick(pool), rng.chance(0.5) ? 2 : 1, 'mutation');
  }
  if (locus === 'affinityPrimary' || locus === 'affinitySecondary') {
    const pool = AFFINITY_IDS.filter((k) => k !== current.v);
    return allele(rng.pick(pool), locus === 'affinityPrimary' ? 2 : rng.chance(0.5) ? 2 : 0, 'mutation');
  }
  if (locus.startsWith('apt_')) {
    const v = Math.max(0.05, Math.min(1, (current.v ?? 0.5) + rng.bell() * 0.35));
    return allele(v, 1, 'mutation');
  }
  if (locus === 'tempA' || locus === 'tempB') {
    const pool = TENDENCY_IDS.filter((k) => k !== current.v);
    return allele(rng.pick(pool), rng.chance(0.5) ? 2 : 1, 'mutation');
  }
  return null;
}

function describeMutation(locus, a) {
  if (COLOR_LOCI.includes(locus)) return `Unexpected ${colorName(a.v).toLowerCase()} colouring`;
  if (locus === 'pattern') return `New marking: ${PATTERN_ALLELES[a.v]?.name ?? a.v}`;
  if (locus === 'build') return `Altered build: ${BUILD_ALLELES[a.v]?.name ?? a.v}`;
  if (locus.startsWith('feat_')) return `Novel structure: ${FEATURE_TAGS[a.v]?.name ?? a.v}`;
  if (locus.startsWith('apt_')) return `Shifted ${locus.slice(4)} aptitude`;
  if (locus.startsWith('affinity')) return `Shifted affinity toward ${a.v}`;
  return `Rare temperament: ${a.v}`;
}

/**
 * Offspring may inherit compatible moves from either parent. A move the body
 * cannot perform is never learned — but the gene is not destroyed, because the
 * parents still carry it for a future, better-suited descendant.
 */
function inheritMoves(formParent, traitParent, genome, rng) {
  const pool = new Set();
  for (const p of [formParent, traitParent]) {
    for (const m of p.moves ?? []) if (isLegacyMove(m)) pool.add(m);
    for (const m of p.genome.legacyMoves ?? []) if (isLegacyMove(m)) pool.add(m);
  }
  const phenotype = expressGenome(genome);
  const natural = new Set(getSpecies(genome.species).learnset.map((l) => l.move));
  const eligible = [...pool].filter((m) => !natural.has(m) && canPerform(m, phenotype.bodyTags));
  const picked = [];
  for (const move of rng.shuffle(eligible)) {
    if (picked.length >= MAX_LEGACY_MOVES) break;
    if (rng.chance(0.7)) picked.push(move);
  }
  return picked;
}

/** Genetic diversity. Outcrossing raises it; narrowing a line spends it. */
export function computeVigor(a, b, genome, ctx = {}) {
  const r = ctx.relatedness ?? 0;
  const phenotype = expressGenome(genome);
  let vigor = 55 + phenotype.heterozygosity * 45 - r * 70;
  if (a.genome.species !== b.genome.species) vigor += 18; // hybrid vigor
  vigor += (((a.vigor ?? 60) + (b.vigor ?? 60)) / 2 - 60) * 0.35;
  return Math.round(Math.max(1, Math.min(100, vigor)));
}

export function hasHybridVigor(offspring) {
  return offspring.vigor >= 78;
}

/** How comfortably the inherited traits work together. */
export function computeStability(genome, ctx = {}, mutationCount = 0) {
  const phenotype = expressGenome(genome);
  let stability = 82;
  stability -= mutationCount * 9;
  stability -= phenotype.unsupported * 3;
  if (phenotype.affinities.length > 1) stability -= 6;
  if (ctx.catalyst) stability -= 12;
  stability += (phenotype.aptitudes.resolve - 0.5) * 20;
  return Math.round(Math.max(5, Math.min(100, stability)));
}

// ---------------------------------------------------------------------------
// Prediction — the breeding preview
// ---------------------------------------------------------------------------

/**
 * Exact inheritance odds for a pairing. Each parent contributes one of its two
 * alleles with equal probability, so every locus has four equally likely
 * combinations that can be enumerated outright.
 *
 * `archiveLevel` controls how much of that truth the player is shown:
 *   0 — broad words only ("likely", "possible")
 *   1 — bucketed percentages
 *   2 — exact percentages and carried recessives
 */
export function predictOffspring(formParent, traitParent, archiveLevel = 0) {
  const speciesId = formParent.genome.species;
  const species = getSpecies(speciesId);
  const combos = [];

  for (let i = 0; i < 2; i++) {
    for (let j = 0; j < 2; j++) {
      combos.push({ i, j, p: 0.25 });
    }
  }

  const distribution = (locus, classify) => {
    const out = new Map();
    const pa = formParent.genome.loci[locus];
    const pb = traitParent.genome.loci[locus];
    if (!pa || !pb) return out;
    for (const { i, j, p } of combos) {
      const key = classify([pa[i], pb[j]]);
      if (key == null) continue;
      out.set(key, (out.get(key) ?? 0) + p);
    }
    return out;
  };

  const buildDist = distribution('build', (pair) => {
    const f = ((BUILD_ALLELES[pair[0].v]?.v ?? 1) + (BUILD_ALLELES[pair[1].v]?.v ?? 1)) / 2;
    if (f < 0.85) return 'Tiny';
    if (f < 0.95) return 'Small';
    if (f < 1.06) return 'Medium';
    if (f < 1.18) return 'Large';
    return 'Huge';
  });

  const patternDist = distribution('pattern', (pair) => {
    const [a, b] = pair;
    const winner = a.dom >= b.dom ? a : b;
    return PATTERN_ALLELES[winner.v]?.name ?? winner.v;
  });

  const colorSamples = {};
  for (const locus of COLOR_LOCI) {
    const pa = formParent.genome.loci[locus];
    const pb = traitParent.genome.loci[locus];
    const names = new Map();
    for (const { i, j, p } of combos) {
      const a = pa[i], b = pb[j];
      const winner = a.dom > b.dom ? a.v : b.dom > a.dom ? b.v : a.v;
      const key = colorName(winner);
      names.set(key, (names.get(key) ?? 0) + p);
    }
    colorSamples[locus] = names;
  }

  const featureDists = {};
  for (const slot of FEATURE_SLOTS) {
    const supported = species.featureSlots[slot] ?? [];
    if (!supported.length) continue;
    featureDists[slot] = distribution(`feat_${slot}`, (pair) => {
      const [a, b] = pair;
      const ordered = a.dom >= b.dom ? [a, b] : [b, a];
      const shown = ordered.find((x) => supported.includes(x.v));
      const key = shown ? shown.v : supported[0];
      return FEATURE_TAGS[key]?.name ?? key;
    });
  }

  const temperamentDists = {
    first: distribution('tempA', (pair) => (pair[0].dom >= pair[1].dom ? pair[0].v : pair[1].v)),
    second: distribution('tempB', (pair) => (pair[0].dom >= pair[1].dom ? pair[0].v : pair[1].v)),
  };

  const aptitudeRanges = {};
  for (const stat of STAT_KEYS) {
    const pa = formParent.genome.loci[`apt_${stat}`];
    const pb = traitParent.genome.loci[`apt_${stat}`];
    const values = combos.map(({ i, j }) => (pa[i].v + pb[j].v) / 2);
    aptitudeRanges[stat] = { min: Math.min(...values), max: Math.max(...values), avg: values.reduce((s, v) => s + v, 0) / 4 };
  }

  const affinityDist = distribution('affinitySecondary', (pair) => {
    const expressed = pair.find((a) => a.dom >= 2 && a.v);
    return expressed ? expressed.v : 'none';
  });

  const movePool = new Set();
  for (const p of [formParent, traitParent]) {
    for (const m of p.moves ?? []) if (isLegacyMove(m)) movePool.add(m);
    for (const m of p.genome.legacyMoves ?? []) if (isLegacyMove(m)) movePool.add(m);
  }
  const natural = new Set(species.learnset.map((l) => l.move));
  const bodyTags = formParent.phenotype.bodyTags;
  const legacyMoves = [...movePool]
    .filter((m) => !natural.has(m))
    .map((m) => ({
      id: m,
      name: MOVES[m].name,
      possible: canPerform(m, bodyTags),
      reason: canPerform(m, bodyTags) ? null : `needs ${MOVES[m].requires.join(', ')}`,
    }));

  const echoes = [...new Set([...(formParent.genome.echoes ?? []), ...(traitParent.genome.echoes ?? [])])];

  return {
    speciesId,
    speciesName: species.name,
    build: rank(buildDist, archiveLevel),
    pattern: rank(patternDist, archiveLevel),
    colors: Object.fromEntries(
      COLOR_LOCI.map((locus) => [locus, rank(colorSamples[locus], archiveLevel)])
    ),
    features: Object.fromEntries(
      Object.entries(featureDists).map(([slot, d]) => [slot, rank(d, archiveLevel)])
    ),
    temperament: {
      first: rank(temperamentDists.first, archiveLevel),
      second: rank(temperamentDists.second, archiveLevel),
    },
    aptitudes: aptitudeRanges,
    affinity: rank(affinityDist, archiveLevel),
    legacyMoves,
    echoes,
    archiveLevel,
  };
}

/** Turn a probability map into display rows at the archive's precision. */
function rank(dist, archiveLevel) {
  if (!dist) return [];
  const rows = [...dist.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([label, p]) => ({ label, p, text: probabilityText(p, archiveLevel) }));
  return rows;
}

export function probabilityText(p, archiveLevel) {
  if (archiveLevel >= 2) return `${Math.round(p * 100)}%`;
  if (archiveLevel === 1) {
    if (p >= 0.99) return 'certain';
    if (p >= 0.7) return '70–100%';
    if (p >= 0.45) return '45–70%';
    if (p >= 0.2) return '20–45%';
    return 'under 20%';
  }
  if (p >= 0.99) return 'certain';
  if (p >= 0.6) return 'likely';
  if (p >= 0.3) return 'possible';
  return 'unlikely';
}
