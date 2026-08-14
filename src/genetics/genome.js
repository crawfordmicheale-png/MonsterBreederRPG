// The genome: alleles, loci, and how they express into a visible phenotype.
//
// Every major locus carries two alleles. An allele is:
//   { v: value, dom: dominanceRank, tag?: 'mutation' }
//
// Dominance ranks resolve expression:
//   higher rank wins outright (classic dominant / recessive)
//   equal rank 1 co-expresses (codominant — both are visible)
//   equal rank 0 or 2 blends (incomplete dominance)
//
// A hidden allele is never lost. It travels down the line and can resurface
// generations later, which is the whole point of the breeding game.

import { SPECIES, FEATURE_TAGS, getSpecies } from '../data/species.js';
import { AFFINITY_IDS } from '../data/affinities.js';
import { TENDENCY_IDS, TENDENCIES } from '../data/temperaments.js';
import { HAZARD_IDS, HAZARDS, RESIST_ALLELES, expressResistance } from '../data/environment.js';

export const STAT_KEYS = ['vitality', 'power', 'guard', 'focus', 'speed', 'resolve'];

export const STAT_LABELS = {
  vitality: 'Vitality',
  power: 'Power',
  guard: 'Guard',
  focus: 'Focus',
  speed: 'Speed',
  resolve: 'Resolve',
};

/** Build alleles. Value is a size multiplier; expression is the mean of both. */
export const BUILD_ALLELES = {
  tiny:   { key: 'tiny',   name: 'Tiny',   v: 0.78 },
  small:  { key: 'small',  name: 'Small',  v: 0.89 },
  medium: { key: 'medium', name: 'Medium', v: 1.0 },
  large:  { key: 'large',  name: 'Large',  v: 1.13 },
  huge:   { key: 'huge',   name: 'Huge',   v: 1.26 },
};

export const PATTERN_ALLELES = {
  none:     { key: 'none',     name: 'Unmarked',        dom: 0 },
  mottle:   { key: 'mottle',   name: 'Mottling',        dom: 1 },
  spots:    { key: 'spots',    name: 'Spots',           dom: 1 },
  stripes:  { key: 'stripes',  name: 'Stripes',         dom: 1 },
  bands:    { key: 'bands',    name: 'Bands',           dom: 1 },
  mask:     { key: 'mask',     name: 'Mask',            dom: 2 },
  veining:  { key: 'veining',  name: 'Metallic veining',dom: 2 },
  luminous: { key: 'luminous', name: 'Luminous marks',  dom: 3 },
};

export const COLOR_LOCI = ['colorPrimary', 'colorSecondary', 'colorAccent', 'colorEye'];

/** 'colorPrimary' -> 'primary', matching the palette field names. */
export const colorKey = (locus) => locus.slice(5, 6).toLowerCase() + locus.slice(6);
export const FEATURE_SLOTS = ['ears', 'tail', 'crest', 'shell', 'glow', 'wing', 'horn'];

const featureLocus = (slot) => `feat_${slot}`;
const aptitudeLocus = (stat) => `apt_${stat}`;

/** Environmental resistance loci, one per hazard. */
export const RESIST_LOCI = HAZARD_IDS.map((h) => HAZARDS[h].resistLocus);
export const resistLocusFor = (hazardId) => HAZARDS[hazardId].resistLocus;

export const APTITUDE_LOCI = STAT_KEYS.map(aptitudeLocus);
export const FEATURE_LOCI = FEATURE_SLOTS.map(featureLocus);

export const ALL_LOCI = [
  'build',
  ...COLOR_LOCI,
  'pattern',
  ...FEATURE_LOCI,
  'affinityPrimary',
  'affinitySecondary',
  ...APTITUDE_LOCI,
  ...RESIST_LOCI,
  'tempA',
  'tempB',
];

// ---------------------------------------------------------------------------
// Allele construction
// ---------------------------------------------------------------------------

export function allele(v, dom = 1, tag = null) {
  const a = { v, dom };
  if (tag) a.tag = tag;
  return a;
}

function jitterColor(base, rng, amount = 1) {
  return {
    h: (base.h + rng.bell() * 14 * amount + 360) % 360,
    s: clamp(base.s + rng.bell() * 10 * amount, 6, 92),
    l: clamp(base.l + rng.bell() * 9 * amount, 14, 88),
  };
}

function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}

/**
 * Build a fresh genome for a wild-caught Kinbeast.
 * Wild stock is deliberately varied — it is the raw material of every line.
 */
export function createWildGenome(speciesId, rng, opts = {}) {
  const species = getSpecies(speciesId);
  const loci = {};

  // Build — wild populations cluster around medium.
  const buildPool = ['small', 'medium', 'medium', 'large', 'tiny', 'huge'];
  loci.build = [
    allele(rng.pick(buildPool), 1),
    allele(rng.pick(buildPool), 1),
  ];

  // Colour — drawn from the species palettes, then jittered so no two wild
  // Kinbeasts of a species look identical.
  const palA = rng.pick(species.palettes);
  const palB = rng.pick(species.palettes);
  for (const locus of COLOR_LOCI) {
    const key = colorKey(locus);
    const fieldA = palA[key];
    const fieldB = palB[key];
    loci[locus] = [
      allele(jitterColor(fieldA, rng), rng.chance(0.18) ? 2 : rng.chance(0.3) ? 0 : 1),
      allele(jitterColor(fieldB, rng), rng.chance(0.18) ? 2 : rng.chance(0.3) ? 0 : 1),
    ];
  }

  // Pattern.
  const patternPool = ['none', 'none', 'spots', 'stripes', 'bands', 'mottle', 'mask'];
  loci.pattern = [
    patternAllele(rng.pick(patternPool)),
    patternAllele(rng.pick(patternPool)),
  ];

  // Structural features — one locus per slot, whether or not this species
  // supports it. Genes for unsupported slots ride along silently.
  for (const slot of FEATURE_SLOTS) {
    const supported = species.featureSlots[slot];
    const pool = supported && supported.length ? supported : allVariantsFor(slot);
    loci[featureLocus(slot)] = [
      allele(rng.pick(pool), rng.chance(0.35) ? 2 : 1),
      allele(rng.pick(pool), rng.chance(0.35) ? 2 : 1),
    ];
  }

  // Affinity — wild stock nearly always breeds true, with rare variance.
  const primary = species.affinities[0];
  const secondary = species.affinities[1] ?? null;
  loci.affinityPrimary = [allele(primary, 2), allele(primary, 2)];
  loci.affinitySecondary = [
    allele(secondary, secondary ? 2 : 0),
    allele(rng.chance(0.12) ? rng.pick(AFFINITY_IDS) : secondary, 0),
  ];

  // Aptitudes — genetic potential, 0..1. Training decides how much is reached.
  for (const stat of STAT_KEYS) {
    loci[aptitudeLocus(stat)] = [
      allele(clamp(0.5 + rng.bell() * 0.32, 0.05, 1), 1),
      allele(clamp(0.5 + rng.bell() * 0.32, 0.05, 1), 1),
    ];
  }

  // Environmental resistance. Most wild stock carries nothing; species that
  // live in an extreme place carry the allele that lets them.
  for (const hazardId of HAZARD_IDS) {
    const adaptation = species.resistances?.[hazardId];
    loci[HAZARDS[hazardId].resistLocus] = [
      resistAllele(drawResistance(adaptation, rng)),
      resistAllele(drawResistance(adaptation, rng)),
    ];
  }

  // Temperament — biased toward the species' typical dispositions.
  const bias = species.temperamentBias;
  const tendencyPool = [...bias, ...bias, ...TENDENCY_IDS];
  loci.tempA = [
    allele(rng.pick(tendencyPool), rng.chance(0.5) ? 2 : 1),
    allele(rng.pick(tendencyPool), rng.chance(0.5) ? 2 : 1),
  ];
  loci.tempB = [
    allele(rng.pick(tendencyPool), rng.chance(0.5) ? 2 : 1),
    allele(rng.pick(tendencyPool), rng.chance(0.5) ? 2 : 1),
  ];

  return {
    species: speciesId,
    loci,
    legacyMoves: opts.legacyMoves ? [...opts.legacyMoves] : [],
    echoes: opts.echoes ? [...opts.echoes] : [],
  };
}

function patternAllele(key) {
  return allele(key, PATTERN_ALLELES[key].dom);
}

function resistAllele(key) {
  return allele(key, RESIST_ALLELES[key].dom);
}

/**
 * `bias` is the species' typical resistance: 'full', 'partial' or undefined.
 * Even a well-adapted species does not breed true every time, which is what
 * makes the allele worth hunting for rather than assumed.
 */
function drawResistance(bias, rng) {
  if (bias === 'full') return rng.weighted(['full', 'partial', 'none'], [6, 3, 1]);
  if (bias === 'partial') return rng.weighted(['partial', 'none', 'full'], [6, 3, 1]);
  return rng.weighted(['none', 'partial'], [17, 1]);
}

function allVariantsFor(slot) {
  return Object.keys(FEATURE_TAGS).filter((k) => FEATURE_TAGS[k].slot === slot);
}

// ---------------------------------------------------------------------------
// Expression
// ---------------------------------------------------------------------------

function resolveDominance(pair) {
  const [a, b] = pair;
  if (a.dom > b.dom) return { winner: a, mode: 'dominant', hidden: b };
  if (b.dom > a.dom) return { winner: b, mode: 'dominant', hidden: a };
  if (a.dom === 1) return { winner: a, mode: 'codominant', other: b };
  return { winner: a, mode: 'blend', other: b };
}

function blendColor(a, b) {
  // Shortest path around the hue wheel so red + blue does not detour via green.
  let dh = ((b.h - a.h + 540) % 360) - 180;
  return {
    h: (a.h + dh / 2 + 360) % 360,
    s: (a.s + b.s) / 2,
    l: (a.l + b.l) / 2,
  };
}

export function colorToCss({ h, s, l }, dl = 0, da = 1) {
  const light = clamp(l + dl, 0, 100);
  return da >= 1 ? `hsl(${h.toFixed(1)} ${s.toFixed(1)}% ${light.toFixed(1)}%)`
                 : `hsl(${h.toFixed(1)} ${s.toFixed(1)}% ${light.toFixed(1)}% / ${da})`;
}

const HUE_NAMES = [
  [15, 'Ember'], [35, 'Amber'], [55, 'Gold'], [75, 'Chartreuse'], [100, 'Moss'],
  [140, 'Verdant'], [165, 'Sea'], [190, 'Glacier'], [215, 'Sky'], [245, 'Deep'],
  [275, 'Violet'], [300, 'Orchid'], [330, 'Rose'], [360, 'Ember'],
];

export function colorName({ h, s, l }) {
  if (s < 12) return l > 68 ? 'Pale Ash' : l < 32 ? 'Soot' : 'Grey';
  const hue = HUE_NAMES.find(([max]) => h < max)?.[1] ?? 'Ember';
  const tone = l > 70 ? 'Pale ' : l < 34 ? 'Dark ' : '';
  return `${tone}${hue}`;
}

/**
 * Express a genome into everything the game and the renderer need.
 * Pure function — same genome always produces the same phenotype.
 */
export function expressGenome(genome) {
  const species = getSpecies(genome.species);
  const L = genome.loci;
  const hidden = [];

  // --- build ---
  const buildA = BUILD_ALLELES[L.build[0].v] ?? BUILD_ALLELES.medium;
  const buildB = BUILD_ALLELES[L.build[1].v] ?? BUILD_ALLELES.medium;
  const sizeFactor = (buildA.v + buildB.v) / 2;
  const buildLabel = buildLabelFor(sizeFactor);

  // --- colours ---
  const colors = {};
  for (const locus of COLOR_LOCI) {
    const r = resolveDominance(L[locus]);
    const key = colorKey(locus);
    if (r.mode === 'blend') {
      colors[key] = { value: blendColor(r.winner.v, r.other.v), co: null, mode: 'blend' };
    } else if (r.mode === 'codominant') {
      colors[key] = { value: r.winner.v, co: r.other.v, mode: 'codominant' };
    } else {
      colors[key] = { value: r.winner.v, co: null, mode: 'dominant' };
      hidden.push({ locus, label: `${colorName(r.hidden.v)} ${key}`, kind: 'colour' });
    }
  }

  // --- pattern ---
  const pat = resolveDominance(L.pattern);
  const patternKey = pat.winner.v;
  if (pat.mode === 'dominant' && pat.hidden.v !== patternKey) {
    hidden.push({ locus: 'pattern', label: PATTERN_ALLELES[pat.hidden.v]?.name ?? pat.hidden.v, kind: 'pattern' });
  }
  const patternCo = pat.mode === 'codominant' && pat.other.v !== patternKey ? pat.other.v : null;

  // --- structural features ---
  const features = {};
  const dormantFeatures = [];
  for (const slot of FEATURE_SLOTS) {
    const pair = L[featureLocus(slot)];
    if (!pair) continue;
    const supported = species.featureSlots[slot] ?? [];
    const r = resolveDominance(pair);
    const expressedCandidates = [r.winner, r.mode === 'dominant' ? r.hidden : r.other].filter(Boolean);

    // The body can only show a variant it supports. If the winning allele is
    // unsupported, the other allele gets its chance; if neither fits, the slot
    // is empty and both genes lie dormant.
    const shown = expressedCandidates.find((a) => supported.includes(a.v));
    if (shown) {
      features[slot] = shown.v;
      for (const a of expressedCandidates) {
        if (a !== shown && a.v !== shown.v) {
          dormantFeatures.push({ slot, key: a.v, supported: supported.includes(a.v) });
        }
      }
    } else if (supported.length) {
      // Species supports the slot but carries no compatible allele — fall back
      // to the species default so the creature is never missing a body part.
      features[slot] = supported[0];
      for (const a of expressedCandidates) dormantFeatures.push({ slot, key: a.v, supported: false });
    } else {
      for (const a of expressedCandidates) dormantFeatures.push({ slot, key: a.v, supported: false });
    }
  }

  // --- affinities ---
  const affPrimary = resolveDominance(L.affinityPrimary).winner.v ?? species.affinities[0];
  const secPair = L.affinitySecondary;
  const secExpressed = secPair.find((a) => a.dom >= 2 && a.v);
  const affSecondary = secExpressed?.v ?? null;
  const dormantAffinity = secPair.find((a) => a.v && a.v !== affPrimary && a.v !== affSecondary)?.v ?? null;
  if (dormantAffinity) hidden.push({ locus: 'affinitySecondary', label: dormantAffinity, kind: 'affinity' });

  // --- aptitudes ---
  const aptitudes = {};
  for (const stat of STAT_KEYS) {
    const pair = L[aptitudeLocus(stat)];
    aptitudes[stat] = clamp((pair[0].v + pair[1].v) / 2, 0.05, 1);
  }

  // --- environmental resistance ---
  const resistances = {};
  for (const hazardId of HAZARD_IDS) {
    resistances[hazardId] = expressResistance(L[HAZARDS[hazardId].resistLocus]);
  }

  // --- temperament ---
  const tA = resolveDominance(L.tempA);
  const tB = resolveDominance(L.tempB);
  const temperament = [tA.winner.v, tB.winner.v];
  for (const hazardId of HAZARD_IDS) {
    const pair = L[HAZARDS[hazardId].resistLocus];
    const expressed = resistances[hazardId];
    for (const a of pair) {
      const value = RESIST_ALLELES[a.v]?.v ?? 0;
      if (value > expressed + 0.001) {
        hidden.push({
          locus: HAZARDS[hazardId].resistLocus,
          label: `${RESIST_ALLELES[a.v].name} ${HAZARDS[hazardId].traitName}`,
          kind: 'resistance',
        });
      }
    }
  }

  for (const [pairRes, locus] of [[tA, 'tempA'], [tB, 'tempB']]) {
    const other = pairRes.mode === 'dominant' ? pairRes.hidden : pairRes.other;
    if (other && other.v !== pairRes.winner.v) {
      hidden.push({ locus, label: TENDENCIES[other.v]?.name ?? other.v, kind: 'temperament' });
    }
  }

  // --- body tags: species anatomy plus anything the expressed features add ---
  const bodyTags = new Set(species.bodyTags);
  for (const key of Object.values(features)) {
    for (const tag of FEATURE_TAGS[key]?.tags ?? []) bodyTags.add(tag);
  }

  // --- heterozygosity drives Vigor; unsupported/mutant genes cost Stability ---
  const heterozygosity = measureHeterozygosity(genome);
  const mutationCount = countMutations(genome);
  const unsupported = dormantFeatures.filter((f) => !f.supported).length;

  return {
    species,
    sizeFactor,
    buildLabel,
    colors,
    pattern: patternKey,
    patternCo,
    features,
    dormantFeatures,
    affinities: [affPrimary, affSecondary].filter(Boolean),
    dormantAffinity,
    aptitudes,
    resistances,
    temperament,
    bodyTags: [...bodyTags],
    hidden,
    heterozygosity,
    mutationCount,
    unsupported,
  };
}

function buildLabelFor(f) {
  if (f < 0.85) return 'Tiny';
  if (f < 0.95) return 'Small';
  if (f < 1.06) return 'Medium';
  if (f < 1.18) return 'Large';
  return 'Huge';
}

/** Fraction of loci carrying two different alleles. */
export function measureHeterozygosity(genome) {
  let het = 0;
  let total = 0;
  for (const locus of ALL_LOCI) {
    const pair = genome.loci[locus];
    if (!pair) continue;
    total++;
    if (!alleleEqual(pair[0], pair[1])) het++;
  }
  return total ? het / total : 0;
}

function alleleEqual(a, b) {
  if (typeof a.v === 'object' && a.v && typeof b.v === 'object' && b.v) {
    return (
      Math.abs(a.v.h - b.v.h) < 6 &&
      Math.abs(a.v.s - b.v.s) < 6 &&
      Math.abs(a.v.l - b.v.l) < 6
    );
  }
  if (typeof a.v === 'number' && typeof b.v === 'number') return Math.abs(a.v - b.v) < 0.05;
  return a.v === b.v;
}

export function countMutations(genome) {
  let n = 0;
  for (const locus of ALL_LOCI) {
    const pair = genome.loci[locus];
    if (!pair) continue;
    for (const a of pair) if (a.tag === 'mutation') n++;
  }
  return n;
}

/**
 * Fill in any locus a genome is missing.
 *
 * Saves written before a locus existed must keep working — a player should
 * never lose a bloodline because the game grew a new gene. Missing loci get a
 * neutral default rather than a random one, so an old Kinbeast does not
 * silently acquire traits it was never bred for.
 */
export function normaliseGenome(genome) {
  if (!genome?.loci) return genome;
  const species = SPECIES[genome.species];
  for (const locus of ALL_LOCI) {
    if (Array.isArray(genome.loci[locus]) && genome.loci[locus].length === 2) continue;
    genome.loci[locus] = defaultPairFor(locus, species);
  }
  if (!Array.isArray(genome.legacyMoves)) genome.legacyMoves = [];
  if (!Array.isArray(genome.echoes)) genome.echoes = [];
  return genome;
}

function defaultPairFor(locus, species) {
  if (RESIST_LOCI.includes(locus)) {
    // Backfill from the species' natural adaptation, so an Embermole saved
    // before the locus existed is still an Embermole.
    const hazardId = HAZARD_IDS.find((h) => HAZARDS[h].resistLocus === locus);
    const bias = species?.resistances?.[hazardId] ?? 'none';
    const key = bias === 'full' ? 'full' : bias === 'partial' ? 'partial' : 'none';
    return [allele(key, RESIST_ALLELES[key].dom), allele(key, RESIST_ALLELES[key].dom)];
  }
  if (locus === 'build') return [allele('medium', 1), allele('medium', 1)];
  if (locus === 'pattern') return [allele('none', 0), allele('none', 0)];
  if (COLOR_LOCI.includes(locus)) {
    const base = species?.palettes?.[0]?.[colorKey(locus)] ?? { h: 40, s: 30, l: 55 };
    return [allele({ ...base }, 1), allele({ ...base }, 1)];
  }
  if (locus.startsWith('apt_')) return [allele(0.5, 1), allele(0.5, 1)];
  if (locus === 'affinityPrimary') {
    const a = species?.affinities?.[0] ?? 'grove';
    return [allele(a, 2), allele(a, 2)];
  }
  if (locus === 'affinitySecondary') {
    const a = species?.affinities?.[1] ?? null;
    return [allele(a, a ? 2 : 0), allele(a, 0)];
  }
  if (locus.startsWith('feat_')) {
    const slot = locus.slice(5);
    const supported = species?.featureSlots?.[slot];
    const key = supported?.[0] ?? allVariantsFor(slot)[0];
    return [allele(key, 1), allele(key, 1)];
  }
  const tendency = species?.temperamentBias?.[0] ?? TENDENCY_IDS[0];
  return [allele(tendency, 1), allele(tendency, 1)];
}

export function cloneGenome(genome) {
  return JSON.parse(JSON.stringify(genome));
}
