// Species definitions.
//
// The vertical slice ships the six Common species named in the game bible.
// Everything here is data-only so new species can be added without touching
// the genetics, combat or rendering code.
//
// `featureSlots` are the approved modular inheritance slots. A gene for a
// feature the body cannot support stays dormant and may resurface later in a
// compatible descendant.

/** Structural feature slots shared across species, with their anatomy tags. */
export const FEATURE_TAGS = {
  ears_leaf:    { slot: 'ears',  name: 'Leaf ears',        tags: ['ear'] },
  ears_tuft:    { slot: 'ears',  name: 'Tufted ears',      tags: ['ear'] },
  ears_fin:     { slot: 'ears',  name: 'Fin ears',         tags: ['ear', 'fin'] },
  ears_round:   { slot: 'ears',  name: 'Round ears',       tags: ['ear'] },
  ears_long:    { slot: 'ears',  name: 'Long ears',        tags: ['ear'] },
  tail_ember:   { slot: 'tail',  name: 'Ember tail',       tags: ['tail'] },
  tail_bush:    { slot: 'tail',  name: 'Brush tail',       tags: ['tail'] },
  tail_paddle:  { slot: 'tail',  name: 'Paddle tail',      tags: ['tail', 'fin'] },
  tail_stub:    { slot: 'tail',  name: 'Stub tail',        tags: ['tail'] },
  tail_plume:   { slot: 'tail',  name: 'Plumed tail',      tags: ['tail', 'feather'] },
  crest_fan:    { slot: 'crest', name: 'Fan crest',        tags: ['crest', 'feather'] },
  crest_sweep:  { slot: 'crest', name: 'Swept crest',      tags: ['crest', 'feather'] },
  crest_moss:   { slot: 'crest', name: 'Moss crown',       tags: ['crest', 'flora'] },
  crest_none:   { slot: 'crest', name: 'No crest',         tags: [] },
  shell_plate:  { slot: 'shell', name: 'Plated shell',     tags: ['shell', 'armour'] },
  shell_ridge:  { slot: 'shell', name: 'Ridged shell',     tags: ['shell', 'armour'] },
  shell_smooth: { slot: 'shell', name: 'Smooth carapace',  tags: ['shell'] },
  glow_lantern: { slot: 'glow',  name: 'Lantern glow',     tags: ['glow'] },
  glow_speckle: { slot: 'glow',  name: 'Speckled glow',    tags: ['glow'] },
  glow_none:    { slot: 'glow',  name: 'No glow',          tags: [] },
  wing_broad:   { slot: 'wing',  name: 'Broad wings',      tags: ['wing', 'feather'] },
  wing_narrow:  { slot: 'wing',  name: 'Narrow wings',     tags: ['wing', 'feather'] },
};

const hsl = (h, s, l) => ({ h, s, l });

export const SPECIES = {
  mossbun: {
    id: 'mossbun',
    name: 'Mossbun',
    rarity: 'common',
    affinities: ['grove'],
    families: ['feral', 'bloom'],
    role: 'Support',
    silhouette: 'bun',
    blurb:
      'A hare-sized Kinbeast covered in soft green fur, with leaf-shaped ears and a small patch of living moss across its back.',
    firstFound: 'Hearthmere Fields',
    habitat: 'meadow',
    fertility: 1.25,
    baseStats: { vitality: 62, power: 38, guard: 45, focus: 58, speed: 54, resolve: 60 },
    passive: {
      id: 'softstep',
      name: 'Softstep',
      desc: 'Restores a small amount of health to the weakest ally when Mossbun enters battle.',
    },
    bondSkill: 'bond_mossbun',
    // Slots this body supports, and the variants that can appear in them.
    featureSlots: {
      ears: ['ears_leaf', 'ears_long', 'ears_round'],
      tail: ['tail_stub', 'tail_bush'],
      crest: ['crest_none', 'crest_moss'],
    },
    bodyTags: ['quadruped', 'fur', 'ear', 'tail', 'flora'],
    learnset: [
      { level: 1, move: 'leafcut' },
      { level: 1, move: 'bloomgift' },
      { level: 6, move: 'rootsnare' },
      { level: 12, move: 'thornburst' },
    ],
    temperamentBias: ['gentle', 'social', 'patient', 'nervous'],
    palettes: [
      { primary: hsl(96, 34, 58), secondary: hsl(88, 40, 74), accent: hsl(70, 55, 46), eye: hsl(30, 70, 40) },
      { primary: hsl(140, 22, 52), secondary: hsl(60, 30, 82), accent: hsl(110, 45, 40), eye: hsl(200, 40, 40) },
      { primary: hsl(45, 30, 70), secondary: hsl(100, 28, 60), accent: hsl(130, 40, 38), eye: hsl(20, 60, 35) },
    ],
    breedingValue:
      'High fertility, gentle temperaments, healing aptitude, leaf ears, moss patterns and strong nursery behaviour.',
  },

  cinderkit: {
    id: 'cinderkit',
    name: 'Cinderkit',
    rarity: 'common',
    affinities: ['flame'],
    families: ['feral'],
    role: 'Skirmisher',
    silhouette: 'fox',
    blurb:
      'A foxlike Kinbeast with charcoal paws, bright eyes, and a tail that glows like a banked ember.',
    firstFound: 'Hearthmere Fields and the Emberbreak Range',
    habitat: 'meadow',
    fertility: 1.1,
    baseStats: { vitality: 54, power: 64, guard: 40, focus: 55, speed: 72, resolve: 48 },
    passive: {
      id: 'flashkindle',
      name: 'Flashkindle',
      desc: 'Its first attack deals additional damage when acting before its target.',
    },
    bondSkill: 'bond_cinderkit',
    featureSlots: {
      ears: ['ears_tuft', 'ears_long', 'ears_round'],
      tail: ['tail_ember', 'tail_bush'],
      glow: ['glow_none', 'glow_speckle'],
    },
    bodyTags: ['quadruped', 'fur', 'ear', 'tail'],
    learnset: [
      { level: 1, move: 'emberlash' },
      { level: 1, move: 'kindle' },
      { level: 8, move: 'cinderrush' },
    ],
    temperamentBias: ['bold', 'playful', 'curious', 'aggressive'],
    palettes: [
      { primary: hsl(18, 68, 52), secondary: hsl(32, 78, 68), accent: hsl(8, 30, 22), eye: hsl(48, 90, 58) },
      { primary: hsl(6, 52, 42), secondary: hsl(24, 60, 60), accent: hsl(0, 15, 18), eye: hsl(190, 60, 55) },
      { primary: hsl(36, 55, 62), secondary: hsl(44, 70, 78), accent: hsl(20, 35, 28), eye: hsl(12, 80, 50) },
    ],
    breedingValue:
      'Speed, Flame moves, ember-tail features, warm coloration, Bold temperament and heat resistance.',
  },

  brookfin: {
    id: 'brookfin',
    name: 'Brookfin',
    rarity: 'common',
    affinities: ['tide'],
    families: ['tide', 'feral'],
    role: 'Healer',
    silhouette: 'otter',
    blurb:
      'A playful otterlike creature with fin-shaped ears, webbed paws and a flexible fish tail.',
    firstFound: 'Hearthmere rivers and the Tideglass Coast',
    habitat: 'wetland',
    fertility: 1.2,
    baseStats: { vitality: 58, power: 44, guard: 48, focus: 66, speed: 60, resolve: 55 },
    passive: {
      id: 'clearwater',
      name: 'Clearwater',
      desc: 'Healing an ally also removes one minor negative condition.',
    },
    bondSkill: 'bond_brookfin',
    featureSlots: {
      ears: ['ears_fin', 'ears_round', 'ears_tuft'],
      tail: ['tail_paddle', 'tail_bush'],
      glow: ['glow_none', 'glow_speckle'],
    },
    bodyTags: ['quadruped', 'fur', 'ear', 'tail', 'fin', 'aquatic'],
    learnset: [
      { level: 1, move: 'tidepull' },
      { level: 1, move: 'clearspring' },
      { level: 9, move: 'mistveil' },
    ],
    temperamentBias: ['social', 'playful', 'gentle', 'curious'],
    palettes: [
      { primary: hsl(200, 42, 52), secondary: hsl(190, 35, 74), accent: hsl(210, 30, 32), eye: hsl(38, 70, 55) },
      { primary: hsl(178, 28, 44), secondary: hsl(160, 30, 68), accent: hsl(200, 25, 26), eye: hsl(280, 40, 60) },
      { primary: hsl(220, 20, 62), secondary: hsl(205, 28, 82), accent: hsl(230, 25, 34), eye: hsl(150, 50, 42) },
    ],
    breedingValue:
      'Poison resistance, cleansing moves, social temperaments, strong fertility and blue or silver coloration.',
  },

  pebbleback: {
    id: 'pebbleback',
    name: 'Pebbleback',
    rarity: 'common',
    affinities: ['stone'],
    families: ['scale'],
    role: 'Defender',
    silhouette: 'armadillo',
    blurb: 'A squat armadillo-like Kinbeast protected by overlapping stone plates.',
    firstFound: 'Hearthmere hills and the Emberbreak foothills',
    habitat: 'grotto',
    fertility: 1.0,
    baseStats: { vitality: 74, power: 52, guard: 76, focus: 40, speed: 32, resolve: 62 },
    passive: {
      id: 'curlguard',
      name: 'Curlguard',
      desc: "After using Guard, Pebbleback's next physical attack gains additional force.",
    },
    bondSkill: 'bond_pebbleback',
    featureSlots: {
      shell: ['shell_plate', 'shell_ridge', 'shell_smooth'],
      tail: ['tail_stub', 'tail_paddle'],
      ears: ['ears_round', 'ears_tuft'],
    },
    bodyTags: ['quadruped', 'shell', 'armour', 'ear', 'tail'],
    learnset: [
      { level: 1, move: 'stoneshove' },
      { level: 1, move: 'platingup' },
      { level: 10, move: 'tremor' },
    ],
    temperamentBias: ['patient', 'protective', 'territorial', 'loyal'],
    palettes: [
      { primary: hsl(30, 18, 48), secondary: hsl(36, 22, 66), accent: hsl(24, 14, 30), eye: hsl(44, 60, 50) },
      { primary: hsl(210, 10, 44), secondary: hsl(200, 14, 62), accent: hsl(220, 12, 26), eye: hsl(90, 40, 48) },
      { primary: hsl(14, 26, 40), secondary: hsl(28, 30, 58), accent: hsl(10, 20, 24), eye: hsl(180, 40, 52) },
    ],
    breedingValue:
      'Armour traits, high Guard potential, shell patterns, Patient temperament and Stone resistance.',
  },

  galecrest: {
    id: 'galecrest',
    name: 'Galecrest',
    rarity: 'common',
    affinities: ['gale'],
    families: ['wing'],
    role: 'Speed Support',
    silhouette: 'bird',
    blurb:
      'A long-legged bird with a sweeping feather crest that changes direction with the wind.',
    firstFound: 'Hearthmere grasslands and the Stormcrown foothills',
    habitat: 'meadow',
    fertility: 1.05,
    baseStats: { vitality: 52, power: 50, guard: 40, focus: 60, speed: 78, resolve: 52 },
    passive: {
      id: 'tailwindcry',
      name: 'Tailwind Cry',
      desc: "Slightly increases the team's Speed when Galecrest enters battle.",
    },
    bondSkill: 'bond_galecrest',
    featureSlots: {
      crest: ['crest_fan', 'crest_sweep', 'crest_none'],
      wing: ['wing_broad', 'wing_narrow'],
      tail: ['tail_plume', 'tail_stub'],
    },
    bodyTags: ['biped', 'feather', 'wing', 'crest', 'tail', 'beak'],
    learnset: [
      { level: 1, move: 'gustcut' },
      { level: 1, move: 'tailwind' },
      { level: 11, move: 'divebuffet' },
    ],
    temperamentBias: ['curious', 'nervous', 'independent', 'bold'],
    palettes: [
      { primary: hsl(160, 24, 58), secondary: hsl(190, 30, 78), accent: hsl(40, 60, 56), eye: hsl(20, 70, 48) },
      { primary: hsl(210, 26, 50), secondary: hsl(196, 34, 72), accent: hsl(340, 45, 60), eye: hsl(50, 80, 56) },
      { primary: hsl(48, 34, 66), secondary: hsl(36, 44, 82), accent: hsl(150, 40, 46), eye: hsl(210, 55, 46) },
    ],
    breedingValue:
      'Feather crests, Wing-compatible moves, Speed aptitude, alert temperaments and Gale affinity.',
  },

  glowgrub: {
    id: 'glowgrub',
    name: 'Glowgrub',
    rarity: 'common',
    affinities: ['light'],
    families: ['chitin'],
    role: 'Support',
    silhouette: 'grub',
    blurb: 'A large, gentle larva with a lantern-like abdomen and luminous facial markings.',
    firstFound: 'Hearthmere caves and the Greenmantle groves',
    habitat: 'grotto',
    fertility: 1.15,
    baseStats: { vitality: 68, power: 34, guard: 56, focus: 68, speed: 36, resolve: 66 },
    passive: {
      id: 'warmglow',
      name: 'Warm Glow',
      desc: 'Restores a small amount of health to all allies at the end of each third round.',
    },
    bondSkill: 'bond_glowgrub',
    featureSlots: {
      glow: ['glow_lantern', 'glow_speckle', 'glow_none'],
      shell: ['shell_smooth', 'shell_ridge'],
      crest: ['crest_none', 'crest_fan'],
    },
    bodyTags: ['segmented', 'chitin', 'glow'],
    learnset: [
      { level: 1, move: 'glimmer' },
      { level: 1, move: 'warmlantern' },
      { level: 10, move: 'dawnflare' },
    ],
    temperamentBias: ['gentle', 'patient', 'social', 'nervous'],
    palettes: [
      { primary: hsl(52, 46, 62), secondary: hsl(44, 62, 80), accent: hsl(60, 80, 66), eye: hsl(28, 50, 34) },
      { primary: hsl(140, 26, 52), secondary: hsl(90, 40, 74), accent: hsl(160, 70, 60), eye: hsl(300, 30, 40) },
      { primary: hsl(300, 20, 60), secondary: hsl(320, 34, 80), accent: hsl(280, 60, 70), eye: hsl(50, 60, 46) },
    ],
    breedingValue:
      'Luminescent colours, Light affinity, recovery passives, calm temperaments and mutation sensitivity.',
  },
};

export const SPECIES_IDS = Object.keys(SPECIES);

export function getSpecies(id) {
  const s = SPECIES[id];
  if (!s) throw new Error(`Unknown species: ${id}`);
  return s;
}

export const BROOD_FAMILIES = {
  feral:  { id: 'feral',  name: 'Feral',  desc: 'Mammalian and warm-blooded terrestrial Kinbeasts.' },
  wing:   { id: 'wing',   name: 'Wing',   desc: 'Birdlike, feathered or naturally flying Kinbeasts.' },
  scale:  { id: 'scale',  name: 'Scale',  desc: 'Reptilian, draconic, armoured and shell-bearing Kinbeasts.' },
  tide:   { id: 'tide',   name: 'Tide',   desc: 'Aquatic and amphibious Kinbeasts.' },
  bloom:  { id: 'bloom',  name: 'Bloom',  desc: 'Plant-symbiotic and fungal Kinbeasts.' },
  chitin: { id: 'chitin', name: 'Chitin', desc: 'Insectoid and exoskeletal Kinbeasts.' },
  wisp:   { id: 'wisp',   name: 'Wisp',   desc: 'Spectral, dreamlike and Echo-sensitive Kinbeasts.' },
};

/** Two Kinbeasts can pair only if their species share a Brood Family. */
export function sharedFamilies(speciesA, speciesB) {
  const a = getSpecies(speciesA).families;
  const b = getSpecies(speciesB).families;
  return a.filter((f) => b.includes(f));
}
