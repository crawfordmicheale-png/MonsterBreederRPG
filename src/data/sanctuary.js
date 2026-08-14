// Sanctuary facilities, habitats and restoration projects.
//
// Briarhold starts as a ruin with one usable meadow. Every project is a
// visible change to the place the player lives in.

export const HABITATS = {
  meadow:  { id: 'meadow',  name: 'Meadow',       affinities: ['grove', 'gale'],  capacity: 6, tone: '#8fae6a' },
  wetland: { id: 'wetland', name: 'Wetland',      affinities: ['tide', 'grove'],  capacity: 5, tone: '#6f9f9a' },
  grotto:  { id: 'grotto',  name: 'Stone Grotto', affinities: ['stone', 'light'], capacity: 5, tone: '#9a8d76' },
  forest:  { id: 'forest',  name: 'Forest',       affinities: ['grove', 'shade'], capacity: 6, tone: '#6f8f5c' },
};

export const FACILITIES = {
  nursery:     { id: 'nursery',     name: 'Nursery',      desc: 'Pairs Kinbeasts and produces eggs.' },
  hatchery:    { id: 'hatchery',    name: 'Hatchery',     desc: 'Controls incubation conditions. Faster, steadier hatching.' },
  archive:     { id: 'archive',     name: 'Gene Archive', desc: 'Tracks alleles and pedigrees. Sharpens breeding predictions.' },
  echoHall:    { id: 'echoHall',    name: 'Echo Hall',    desc: 'Reconstructs ancestral memories from inherited fragments.' },
  clinic:      { id: 'clinic',      name: 'Clinic',       desc: 'Treats injury, stress and Instability.' },
  trainingYard:{ id: 'trainingYard',name: 'Training Yard',desc: 'Develops combat statistics toward genetic potential.' },
};

/**
 * Projects. `requires` is checked against game state; `cost` against resources.
 * `apply` mutates the game — keep the effects small and legible.
 */
export const PROJECTS = [
  {
    id: 'clear_nursery',
    name: 'Clear the Nursery',
    desc: 'Lift the fallen roof beams and get the floor visible again.',
    cost: {},
    effort: 2,
    once: true,
    available: (g) => !g.flags.nursery_cleared,
    apply: (g) => {
      g.flags.nursery_cleared = true;
      g.note('The nursery floor is clear. There is a seam in it that should not be there.');
    },
  },
  {
    id: 'repair_meadow',
    name: 'Repair the Meadow Fence',
    desc: 'Make one habitat safe enough to hold Kinbeasts overnight.',
    cost: { river_stone: 2 },
    effort: 2,
    once: true,
    available: (g) => g.flags.nursery_cleared && !g.flags.meadow_repaired,
    apply: (g) => {
      g.flags.meadow_repaired = true;
      g.habitats.meadow.capacity += 2;
      g.note('The meadow holds. Something bedded down in it before you had finished.');
    },
  },
  {
    id: 'build_nursery',
    name: 'Rebuild the Nursery',
    desc: 'Straw, warmth, low light and a roof. Required before any pairing.',
    cost: { soft_reed: 3, river_stone: 2 },
    effort: 3,
    once: true,
    available: (g) => g.flags.nursery_cleared && g.facilities.nursery < 1,
    apply: (g) => {
      g.facilities.nursery = 1;
      g.note('The Nursery is working. Orren stands in the doorway for a while without saying anything.');
    },
  },
  {
    id: 'build_hatchery',
    name: 'Build the Hatchery',
    desc: 'Regulated warmth and light. Eggs develop faster and more stably.',
    cost: { lantern_moss: 2, river_stone: 3 },
    effort: 3,
    once: true,
    available: (g) => g.facilities.nursery >= 1 && g.facilities.hatchery < 1,
    apply: (g) => {
      g.facilities.hatchery = 1;
      g.note('Incubation is under control. Eggs will come along faster now.');
    },
  },
  {
    id: 'build_training_yard',
    name: 'Clear the Training Yard',
    desc: 'A flat space and something to hit. Training pushes stats toward potential.',
    cost: { river_stone: 2 },
    effort: 2,
    once: true,
    available: (g) => g.flags.nursery_cleared && g.facilities.trainingYard < 1,
    apply: (g) => {
      g.facilities.trainingYard = 1;
      g.note('The yard is usable. Half the fence is still someone else\'s problem.');
    },
  },
  {
    id: 'build_archive',
    name: 'Restore the Gene Archive',
    desc: 'Your parents\' records, dried out and re-shelved. Breeding predictions sharpen.',
    cost: { meadow_herb: 2, soft_reed: 2 },
    effort: 3,
    once: true,
    available: (g) => g.facilities.nursery >= 1 && g.facilities.archive < 1,
    apply: (g) => {
      g.facilities.archive = 1;
      g.note('The Archive is legible again. Predictions now come with numbers attached.');
    },
  },
  {
    id: 'upgrade_archive',
    name: 'Extend the Gene Archive',
    desc: 'Cross-reference the old pedigrees. Reveals exact odds and carried recessives.',
    cost: { meadow_herb: 3, lantern_moss: 2, river_stone: 2 },
    effort: 4,
    once: true,
    available: (g) => g.facilities.archive === 1,
    apply: (g) => {
      g.facilities.archive = 2;
      g.note('Exact percentages. Hidden alleles. Your mother\'s handwriting in the margins.');
    },
  },
  {
    id: 'build_clinic',
    name: 'Open the Clinic',
    desc: 'Treats injury and stress between expeditions.',
    cost: { meadow_herb: 3, clearwater_flask: 2 },
    effort: 3,
    once: true,
    available: (g) => g.flags.nursery_cleared && g.facilities.clinic < 1,
    apply: (g) => {
      g.facilities.clinic = 1;
      g.note('The Clinic is open. Nothing goes back into the field hurt from now on.');
    },
  },
  {
    id: 'build_echo_hall',
    name: 'Open the Echo Hall',
    desc: 'A quiet round room for assembling fragments of inherited memory.',
    cost: { lantern_moss: 3, river_stone: 3, clearwater_flask: 1 },
    effort: 4,
    once: true,
    available: (g) => g.flags.echoes_unlocked && g.facilities.echoHall < 1,
    apply: (g) => {
      g.facilities.echoHall = 1;
      g.note('The Echo Hall is swept and lit. Echoryx will not leave it.');
    },
  },
  {
    id: 'build_wetland',
    name: 'Flood the Old Wetland',
    desc: 'Reopen the sluice. A second habitat for Tide-affinity Kinbeasts.',
    cost: { river_stone: 3, clearwater_flask: 2 },
    effort: 3,
    once: true,
    available: (g) => g.flags.meadow_repaired && !g.habitatsUnlocked.includes('wetland'),
    apply: (g) => {
      g.unlockHabitat('wetland');
      g.note('Water back in the old channel within the hour. Something is already in it.');
    },
  },
  {
    id: 'build_grotto',
    name: 'Shore Up the Grotto',
    desc: 'Make the hollow under the hill safe. A habitat for Stone and Light Kinbeasts.',
    cost: { river_stone: 4, lantern_moss: 2 },
    effort: 3,
    once: true,
    available: (g) => g.flags.meadow_repaired && !g.habitatsUnlocked.includes('grotto'),
    apply: (g) => {
      g.unlockHabitat('grotto');
      g.note('The grotto holds a lantern now. It is warmer down there than it has any right to be.');
    },
  },
];

export function projectById(id) {
  return PROJECTS.find((p) => p.id === id);
}
