// The Kinbeast entity: creation, derived statistics, growth and naming.

import { getSpecies } from '../data/species.js';
import { MOVES, canPerform } from '../data/moves.js';
import { personalityFor } from '../data/temperaments.js';
import {
  createWildGenome,
  expressGenome,
  STAT_KEYS,
  cloneGenome,
} from '../genetics/genome.js';

export const STAGES = ['hatchling', 'juvenile', 'adult', 'elder'];

export const STAGE_INFO = {
  hatchling: { name: 'Hatchling', canBattle: false, canBreed: false, note: 'Too young to fight. Learning who everyone is.' },
  juvenile:  { name: 'Juvenile',  canBattle: true,  canBreed: false, note: 'Can train and take supervised battles.' },
  adult:     { name: 'Adult',     canBattle: true,  canBreed: true,  note: 'Full participation in battle and breeding.' },
  elder:     { name: 'Elder',     canBattle: true,  canBreed: true,  note: 'Can mentor juveniles and pass on techniques.' },
};

export function stageForLevel(level, retired = false) {
  if (retired) return 'elder';
  if (level < 3) return 'hatchling';
  if (level < 8) return 'juvenile';
  return 'adult';
}

let idCounter = 1;
export function nextId(prefix = 'kb') {
  return `${prefix}_${(idCounter++).toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
}

export function seedIdCounter(n) {
  idCounter = Math.max(idCounter, n);
}

// ---------------------------------------------------------------------------
// Names
// ---------------------------------------------------------------------------

const NAME_PARTS_A = [
  'Bram', 'Cinder', 'Fen', 'Hollow', 'Juni', 'Kestrel', 'Lumen', 'Mira', 'Nettle', 'Orin',
  'Pell', 'Quill', 'Rowan', 'Sable', 'Thistle', 'Vesper', 'Wren', 'Ash', 'Briar', 'Clove',
  'Dune', 'Ember', 'Fallow', 'Gale', 'Heath', 'Ivy', 'Jasper', 'Larkin', 'Moss', 'Onyx',
];
const NAME_PARTS_B = [
  'wick', 'song', 'step', 'fall', 'light', 'mere', 'thorn', 'drift', 'shade', 'bloom',
  'stone', 'run', 'coil', 'plume', 'tide', 'ash', 'glow', 'vale', 'crest', 'hollow',
];

export function randomName(rng) {
  return rng.chance(0.55)
    ? rng.pick(NAME_PARTS_A)
    : `${rng.pick(NAME_PARTS_A)}${rng.pick(NAME_PARTS_B)}`;
}

// ---------------------------------------------------------------------------
// Construction
// ---------------------------------------------------------------------------

/**
 * Assemble a Kinbeast around a genome. Everything visible or mechanical is
 * derived from the genome, so a saved genome fully reconstructs the creature.
 */
export function makeKinbeast({
  genome,
  name,
  rng,
  level = 5,
  parents = [],
  generation = 1,
  origin = 'wild',
  vigor = 60,
  stability = 80,
  bond = 0,
  lineage = null,
}) {
  const phenotype = expressGenome(genome);
  const species = getSpecies(genome.species);
  const beast = {
    id: nextId(),
    name: name ?? randomName(rng),
    speciesId: genome.species,
    genome,
    phenotype,
    level,
    xp: 0,
    retired: false,
    stage: stageForLevel(level),
    parents,
    generation,
    origin,
    lineage,
    bond,
    stress: 0,
    vigor,
    stability,
    training: Object.fromEntries(STAT_KEYS.map((k) => [k, 0])),
    relationships: {},
    habitat: species.habitat,
    moves: [],
    hpLost: 0,
    battlesWon: 0,
    eggsProduced: 0,
    mentor: null,
    notes: [],
  };
  beast.moves = defaultMoveset(beast);
  return beast;
}

export function makeWildKinbeast(speciesId, rng, level = 5, opts = {}) {
  const genome = createWildGenome(speciesId, rng, opts);
  return makeKinbeast({
    genome,
    rng,
    level,
    origin: 'wild',
    vigor: 60 + Math.round(rng.bell() * 18),
    stability: 78 + Math.round(rng.bell() * 12),
    ...opts,
  });
}

/** The four moves a Kinbeast walks in with: its learnset plus legacy moves. */
export function defaultMoveset(beast) {
  const species = getSpecies(beast.speciesId);
  const tags = beast.phenotype.bodyTags;
  const available = species.learnset
    .filter((l) => l.level <= beast.level && canPerform(l.move, tags))
    .map((l) => l.move);
  const legacy = (beast.genome.legacyMoves ?? []).filter((m) => canPerform(m, tags));
  const set = [...new Set([...legacy, ...available, 'strike', 'guard'])];
  return set.slice(0, 4);
}

/** Every move this Kinbeast is currently able to equip. */
export function availableMoves(beast) {
  const species = getSpecies(beast.speciesId);
  const tags = beast.phenotype.bodyTags;
  const ids = new Set(['strike', 'guard']);
  for (const l of species.learnset) {
    if (l.level <= beast.level && canPerform(l.move, tags)) ids.add(l.move);
  }
  for (const m of beast.genome.legacyMoves ?? []) {
    if (canPerform(m, tags)) ids.add(m);
  }
  return [...ids];
}

/** Moves the Kinbeast will unlock at a higher level, for the profile screen. */
export function upcomingMoves(beast) {
  const species = getSpecies(beast.speciesId);
  return species.learnset
    .filter((l) => l.level > beast.level)
    .map((l) => ({ level: l.level, move: MOVES[l.move] }));
}

// ---------------------------------------------------------------------------
// Derived statistics
// ---------------------------------------------------------------------------

const SIZE_HEAVY = new Set(['vitality', 'power', 'guard']);

export function computeStats(beast) {
  const species = getSpecies(beast.speciesId);
  const { aptitudes, sizeFactor } = beast.phenotype;
  const out = {};
  for (const stat of STAT_KEYS) {
    const base = species.baseStats[stat];
    const apt = aptitudes[stat];
    const trained = beast.training[stat] ?? 0;
    let value = ((base * 2 + apt * 90) * beast.level) / 100 + 6 + trained * 0.45;

    if (SIZE_HEAVY.has(stat)) value *= 1 + (sizeFactor - 1) * 0.34;
    if (stat === 'speed') value *= 1 - (sizeFactor - 1) * 0.42;

    // Elders trade a little raw speed for hard-won composure.
    if (beast.stage === 'elder') {
      if (stat === 'speed') value *= 0.92;
      if (stat === 'resolve' || stat === 'focus') value *= 1.08;
    }
    out[stat] = Math.max(1, Math.round(value));
  }

  out.maxHp = Math.round(out.vitality * 3.1 + beast.level * 3 + 24 + (beast.vigor - 60) * 0.5);
  out.maxStamina = Math.round(38 + out.resolve * 0.55 + beast.level * 0.9);
  return out;
}

export function currentHp(beast) {
  const stats = computeStats(beast);
  return Math.max(0, stats.maxHp - (beast.hpLost ?? 0));
}

export function healFully(beast) {
  beast.hpLost = 0;
  beast.stress = Math.max(0, beast.stress - 25);
}

// ---------------------------------------------------------------------------
// Growth
// ---------------------------------------------------------------------------

export function xpForLevel(level) {
  return Math.round(24 * Math.pow(level, 1.45));
}

/** Returns a summary of what changed, so the UI can report it. */
export function grantXp(beast, amount) {
  const result = { levels: [], learned: [], staged: null };
  if (beast.stage === 'hatchling' && amount > 0) amount = Math.round(amount * 0.5);
  beast.xp += Math.max(0, Math.round(amount));
  while (beast.level < 50 && beast.xp >= xpForLevel(beast.level)) {
    beast.xp -= xpForLevel(beast.level);
    beast.level++;
    result.levels.push(beast.level);

    const species = getSpecies(beast.speciesId);
    for (const entry of species.learnset) {
      if (entry.level === beast.level && canPerform(entry.move, beast.phenotype.bodyTags)) {
        result.learned.push(entry.move);
        if (beast.moves.length < 4 && !beast.moves.includes(entry.move)) beast.moves.push(entry.move);
      }
    }
  }
  const newStage = stageForLevel(beast.level, beast.retired);
  if (newStage !== beast.stage) {
    beast.stage = newStage;
    result.staged = newStage;
  }
  return result;
}

export function addBond(beast, amount) {
  const tempMod =
    beast.phenotype.temperament.reduce((m, t) => m * (bondModifier(t) ?? 1), 1) ?? 1;
  beast.bond = Math.max(0, Math.min(100, beast.bond + amount * tempMod));
  return beast.bond;
}

function bondModifier(tendency) {
  // Imported lazily to avoid a cycle at module load; the table is tiny.
  const mods = {
    protective: 0.9, aggressive: 0.7, curious: 1.2, loyal: 1.1, social: 1.2,
    independent: 0.8, patient: 1.0, bold: 1.0, nervous: 0.7, playful: 1.2,
    territorial: 0.7, gentle: 1.2,
  };
  return mods[tendency] ?? 1;
}

export function canUseBondSkill(beast) {
  return beast.bond >= 50;
}

export function personality(beast) {
  return personalityFor(beast.phenotype.temperament[0], beast.phenotype.temperament[1]);
}

export function displayTitle(beast) {
  const species = getSpecies(beast.speciesId);
  return `${beast.name} the ${species.name}`;
}

export function retireToElder(beast) {
  if (beast.level < 20) return false;
  beast.retired = true;
  beast.stage = 'elder';
  return true;
}

export function cloneBeastForPreview(beast) {
  return { ...beast, genome: cloneGenome(beast.genome) };
}
