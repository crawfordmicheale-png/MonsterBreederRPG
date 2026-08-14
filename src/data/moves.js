// Combat moves.
//
// `requires` lists anatomy tags a Kinbeast must support to perform the move.
// This is what stops a wing attack from being inherited by something with no
// wings — the gene can still be carried, it simply stays dormant.
//
// `learnable` marks a move as inheritable (a Legacy Move) when a parent knows it.

export const MOVES = {
  // ---- universal / basic ----
  strike:     { id: 'strike',     name: 'Strike',        affinity: null,   power: 34, acc: 0.97, cost: 0, kind: 'physical', target: 'enemy', requires: [], learnable: false, desc: 'A plain committed attack. Every Kinbeast knows one.' },
  guard:      { id: 'guard',      name: 'Guard',         affinity: null,   power: 0,  acc: 1,    cost: 0, kind: 'status',   target: 'self',  requires: [], learnable: false, effect: { guardUp: 2 }, desc: 'Brace. Halves incoming damage until your next turn.' },

  // ---- grove ----
  leafcut:    { id: 'leafcut',    name: 'Leafcut',       affinity: 'grove', power: 38, acc: 0.95, cost: 6,  kind: 'physical', target: 'enemy', requires: [], learnable: true,  desc: 'A whipping edge of hardened leaf.' },
  rootsnare:  { id: 'rootsnare',  name: 'Rootsnare',     affinity: 'grove', power: 18, acc: 0.9,  cost: 8,  kind: 'focus',    target: 'enemy', requires: [], learnable: true,  effect: { slow: 3 }, desc: 'Binds the target, slowing its place in the timeline.' },
  bloomgift:  { id: 'bloomgift',  name: 'Bloom Gift',    affinity: 'grove', power: 0,  acc: 1,    cost: 10, kind: 'heal',     target: 'ally',  requires: [], learnable: true,  effect: { heal: 34 }, desc: 'Coaxes a fast flowering that knits wounds closed.' },
  thornburst: { id: 'thornburst', name: 'Thornburst',    affinity: 'grove', power: 30, acc: 0.9,  cost: 12, kind: 'physical', target: 'allEnemies', requires: [], learnable: true, desc: 'Thorns erupt across the whole opposing line.' },

  // ---- flame ----
  emberlash:  { id: 'emberlash',  name: 'Emberlash',     affinity: 'flame', power: 40, acc: 0.94, cost: 7,  kind: 'physical', target: 'enemy', requires: [], learnable: true,  effect: { burn: 0.2 }, desc: 'A lash of banked heat that may leave the target burning.' },
  kindle:     { id: 'kindle',     name: 'Kindle',        affinity: 'flame', power: 0,  acc: 1,    cost: 8,  kind: 'status',   target: 'self',  requires: [], learnable: true,  effect: { powerUp: 3 }, desc: 'Stokes an inner furnace. Raises Power for three rounds.' },
  cinderrush: { id: 'cinderrush', name: 'Cinder Rush',   affinity: 'flame', power: 46, acc: 0.88, cost: 12, kind: 'physical', target: 'enemy', requires: [], learnable: true,  effect: { priority: 1 }, desc: 'Closes the distance before the target can react.' },

  // ---- tide ----
  tidepull:   { id: 'tidepull',   name: 'Tidepull',      affinity: 'tide',  power: 37, acc: 0.96, cost: 6,  kind: 'focus',    target: 'enemy', requires: [], learnable: true,  desc: 'A dragging surge that unbalances the target.' },
  clearspring:{ id: 'clearspring',name: 'Clearspring',   affinity: 'tide',  power: 0,  acc: 1,    cost: 11, kind: 'heal',     target: 'ally',  requires: [], learnable: true,  effect: { heal: 30, cleanse: 1 }, desc: 'Clean water. Heals and washes away one condition.' },
  mistveil:   { id: 'mistveil',   name: 'Mistveil',      affinity: 'tide',  power: 0,  acc: 1,    cost: 9,  kind: 'status',   target: 'allEnemies', requires: [], learnable: true, effect: { blind: 3 }, desc: 'Cold fog settles over the field, fouling enemy aim.' },

  // ---- stone ----
  stoneshove: { id: 'stoneshove', name: 'Stoneshove',    affinity: 'stone', power: 42, acc: 0.92, cost: 7,  kind: 'physical', target: 'enemy', requires: [], learnable: true,  desc: 'A blunt, heavy, entirely honest attack.' },
  platingup:  { id: 'platingup',  name: 'Set Plates',    affinity: 'stone', power: 0,  acc: 1,    cost: 8,  kind: 'status',   target: 'self',  requires: [], learnable: true,  effect: { guardBuff: 3 }, desc: 'Locks armour into place. Raises Guard for three rounds.' },
  tremor:     { id: 'tremor',     name: 'Tremor',        affinity: 'stone', power: 28, acc: 0.9,  cost: 12, kind: 'physical', target: 'allEnemies', requires: [], learnable: true, desc: 'Shakes the ground under the entire opposing team.' },

  // ---- gale ----
  gustcut:    { id: 'gustcut',    name: 'Gustcut',       affinity: 'gale',  power: 33, acc: 0.98, cost: 5,  kind: 'focus',    target: 'enemy', requires: [], learnable: true,  effect: { priority: 1 }, desc: 'A quick slicing wind that lands before slower moves.' },
  tailwind:   { id: 'tailwind',   name: 'Tailwind',      affinity: 'gale',  power: 0,  acc: 1,    cost: 10, kind: 'status',   target: 'allAllies', requires: [], learnable: true, effect: { hasteTeam: 3 }, desc: 'Lifts the whole team\'s footing for three rounds.' },
  divebuffet: { id: 'divebuffet', name: 'Dive Buffet',   affinity: 'gale',  power: 48, acc: 0.87, cost: 13, kind: 'physical', target: 'enemy', requires: ['wing'], learnable: true, desc: 'A stooping strike from height. Requires true wings.' },

  // ---- light ----
  glimmer:    { id: 'glimmer',    name: 'Glimmer',       affinity: 'light', power: 32, acc: 0.98, cost: 6,  kind: 'focus',    target: 'enemy', requires: [], learnable: true,  desc: 'A sudden brightness that burns behind the eyes.' },
  warmlantern:{ id: 'warmlantern',name: 'Warm Lantern',  affinity: 'light', power: 0,  acc: 1,    cost: 14, kind: 'heal',     target: 'allAllies', requires: [], learnable: true, effect: { heal: 20 }, desc: 'A steady glow that eases the whole team.' },
  dawnflare:  { id: 'dawnflare',  name: 'Dawnflare',     affinity: 'light', power: 44, acc: 0.9,  cost: 12, kind: 'focus',    target: 'enemy', requires: [], learnable: true,  effect: { blind: 2 }, desc: 'A rising flare that leaves the target dazzled.' },

  // ---- new in the Emberbreak chapter ----
  goringcharge:{ id: 'goringcharge',name: 'Goring Charge',  affinity: 'grove', power: 50, acc: 0.88, cost: 12, kind: 'physical', target: 'enemy', requires: ['horn'], learnable: true, desc: 'A committed run behind lowered tusks. Requires horns or tusks.' },
  mirebind:   { id: 'mirebind',   name: 'Mirebind',      affinity: 'tide',  power: 22, acc: 0.92, cost: 9,  kind: 'focus',    target: 'allEnemies', requires: [], learnable: true, effect: { slow: 2 }, desc: 'Thick water underfoot. Slows the whole opposing line.' },
  chainbolt:  { id: 'chainbolt',  name: 'Chainbolt',     affinity: 'spark', power: 30, acc: 0.93, cost: 11, kind: 'focus',    target: 'allEnemies', requires: [], learnable: true, desc: 'A charge that jumps from one target to the next.' },
  nightveil:  { id: 'nightveil',  name: 'Nightveil',     affinity: 'shade', power: 0,  acc: 1,    cost: 9,  kind: 'status',   target: 'allEnemies', requires: [], learnable: true, effect: { blind: 3 }, desc: 'Draws the dark in close. Enemies lose their aim.' },
  shellbash:  { id: 'shellbash',  name: 'Shellbash',     affinity: 'stone', power: 41, acc: 0.93, cost: 8,  kind: 'physical', target: 'enemy', requires: ['shell'], learnable: true, desc: 'Puts the whole shell behind it. Requires a shell.' },
  burrowheat: { id: 'burrowheat', name: 'Burrowheat',    affinity: 'flame', power: 52, acc: 0.9,  cost: 13, kind: 'physical', target: 'enemy', requires: [], learnable: true, desc: 'Vanishes under the field and comes up beneath the target.' },
  emberveil:  { id: 'emberveil',  name: 'Emberveil',     affinity: 'flame', power: 0,  acc: 1,    cost: 10, kind: 'status',   target: 'allAllies', requires: [], learnable: true, effect: { guardBuffTeam: 3 }, desc: 'A curtain of rising heat between the team and the field.' },

  // ---- shade ----
  fadeclaw:   { id: 'fadeclaw',   name: 'Fadeclaw',      affinity: 'shade', power: 39, acc: 0.94, cost: 7,  kind: 'physical', target: 'enemy', requires: [], learnable: true,  desc: 'A strike that arrives from a direction that was not there.' },

  // ---- frost ----
  chillbite:  { id: 'chillbite',  name: 'Chillbite',     affinity: 'frost', power: 38, acc: 0.94, cost: 7,  kind: 'physical', target: 'enemy', requires: [], learnable: true,  effect: { slow: 2 }, desc: 'Cold sinks into the joints and slows the target.' },

  // ---- spark ----
  staticnip:  { id: 'staticnip',  name: 'Static Nip',    affinity: 'spark', power: 35, acc: 0.96, cost: 6,  kind: 'focus',    target: 'enemy', requires: [], learnable: true,  effect: { priority: 1 }, desc: 'A fast crackling jolt.' },

  // ---- bond skills (one per species line, not inheritable as moves) ----
  bond_mossbun:   { id: 'bond_mossbun',   name: 'Quiet Meadow',   affinity: 'grove', power: 0,  acc: 1, cost: 0, kind: 'heal',  target: 'allAllies', requires: [], learnable: false, bond: true, effect: { heal: 40, cleanse: 1 }, desc: 'Bond Skill — the field goes still and the team breathes.' },
  bond_cinderkit: { id: 'bond_cinderkit', name: 'Ember Sprint',   affinity: 'flame', power: 62, acc: 0.95, cost: 0, kind: 'physical', target: 'enemy', requires: [], learnable: false, bond: true, effect: { priority: 2 }, desc: 'Bond Skill — a single blazing pass through the enemy line.' },
  bond_brookfin:  { id: 'bond_brookfin',  name: 'Clearwater Rite',affinity: 'tide',  power: 0,  acc: 1, cost: 0, kind: 'heal',  target: 'allAllies', requires: [], learnable: false, bond: true, effect: { heal: 30, cleanse: 2, guardBuffTeam: 2 }, desc: 'Bond Skill — clean water over every wound at once.' },
  bond_pebbleback:{ id: 'bond_pebbleback',name: 'Standing Stone', affinity: 'stone', power: 0,  acc: 1, cost: 0, kind: 'status',target: 'allAllies', requires: [], learnable: false, bond: true, effect: { guardBuffTeam: 4 }, desc: 'Bond Skill — the line does not move for four rounds.' },
  bond_galecrest: { id: 'bond_galecrest', name: 'Rising Column',  affinity: 'gale',  power: 0,  acc: 1, cost: 0, kind: 'status',target: 'allAllies', requires: [], learnable: false, bond: true, effect: { hasteTeam: 4, cleanse: 1 }, desc: 'Bond Skill — a lifting wind under the whole team.' },
  bond_brambletusk:{ id: 'bond_brambletusk',name: 'Bramble Wall',  affinity: 'grove', power: 0,  acc: 1, cost: 0, kind: 'status',target: 'allAllies', requires: [], learnable: false, bond: true, effect: { guardBuffTeam: 4 }, desc: 'Bond Skill — thorns close over the whole line.' },
  bond_mudsprig:  { id: 'bond_mudsprig',  name: 'Bogfall',        affinity: 'tide',  power: 34, acc: 0.95, cost: 0, kind: 'focus', target: 'allEnemies', requires: [], learnable: false, bond: true, effect: { slow: 4 }, desc: 'Bond Skill — the ground gives way under every enemy at once.' },
  bond_sparkmidge:{ id: 'bond_sparkmidge',name: 'Stormswarm',     affinity: 'spark', power: 40, acc: 0.94, cost: 0, kind: 'focus', target: 'allEnemies', requires: [], learnable: false, bond: true, effect: { priority: 1 }, desc: 'Bond Skill — the air itself turns against them.' },
  bond_duskmew:   { id: 'bond_duskmew',   name: 'Long Shadow',    affinity: 'shade', power: 58, acc: 0.95, cost: 0, kind: 'physical', target: 'enemy', requires: [], learnable: false, bond: true, effect: { blind: 3 }, desc: 'Bond Skill — one strike from somewhere that was not there.' },
  bond_shellip:   { id: 'bond_shellip',   name: 'Safe Harbour',   affinity: 'tide',  power: 0,  acc: 1, cost: 0, kind: 'heal',  target: 'allAllies', requires: [], learnable: false, bond: true, effect: { heal: 32, guardBuffTeam: 3 }, desc: 'Bond Skill — everyone gets behind the shell.' },
  bond_embermole: { id: 'bond_embermole', name: 'Furnace Breach', affinity: 'flame', power: 66, acc: 0.92, cost: 0, kind: 'physical', target: 'enemy', requires: [], learnable: false, bond: true, effect: { burn: 0.6 }, desc: 'Bond Skill — opens the ground and lets the heat up through it.' },
  bond_glowgrub:  { id: 'bond_glowgrub',  name: 'Lantern Hour',   affinity: 'light', power: 0,  acc: 1, cost: 0, kind: 'heal',  target: 'allAllies', requires: [], learnable: false, bond: true, effect: { heal: 34, focusTeam: 4 }, desc: 'Bond Skill — a long warm light that steadies everyone.' },
};

export const MOVE_IDS = Object.keys(MOVES);

export function getMove(id) {
  const m = MOVES[id];
  if (!m) throw new Error(`Unknown move: ${id}`);
  return m;
}

/** Moves that can be passed down when a parent knows them. */
export function isLegacyMove(id) {
  return Boolean(MOVES[id]?.learnable);
}

/**
 * A Kinbeast can only perform a move its body supports.
 * `bodyTags` comes from the species plus any inherited structural features.
 */
export function canPerform(moveId, bodyTags) {
  const move = MOVES[moveId];
  if (!move) return false;
  return move.requires.every((tag) => bodyTags.includes(tag));
}
