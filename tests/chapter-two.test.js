import test from 'node:test';
import assert from 'node:assert/strict';

import { Game } from '../src/core/state.js';
import { Battle } from '../src/battle/engine.js';
import { makeWildKinbeast, makeKinbeast, grantXp } from '../src/core/kinbeast.js';
import { RNG } from '../src/core/rng.js';
import { trialById } from '../src/data/trials.js';
import { conceive, predictOffspring } from '../src/genetics/breeding.js';
import {
  createWildGenome,
  expressGenome,
  normaliseGenome,
  ALL_LOCI,
  RESIST_LOCI,
} from '../src/genetics/genome.js';
import { tolerance, HAZARDS, expressResistance, partyClears } from '../src/data/environment.js';
import { SPECIES_IDS, getSpecies, SPECIES } from '../src/data/species.js';
import { incubationEffect, INCUBATION } from '../src/data/sanctuary.js';
import { siteById } from '../src/data/regions.js';

function autoBattle(playerTeam, foeTeam, rng, config = {}) {
  const battle = new Battle(playerTeam, foeTeam, { rng, ...config });
  let guard = 0;
  while (!battle.finished && guard++ < 600) {
    const actor = battle.nextActor();
    if (!actor) break;
    battle.takeAction(actor, battle.autoAction(actor));
  }
  return battle;
}

/** Force a genome's resistance locus, then re-express. */
function setResistance(beast, hazardId, a, b = a) {
  const locus = HAZARDS[hazardId].resistLocus;
  const dom = { none: 0, partial: 1, full: 2 };
  beast.genome.loci[locus] = [
    { v: a, dom: dom[a] },
    { v: b, dom: dom[b] },
  ];
  beast.phenotype = expressGenome(beast.genome);
  return beast;
}

// ---------------------------------------------------------------------------
// Resistance genetics
// ---------------------------------------------------------------------------

test('resistance is incompletely dominant, so a second copy is worth having', () => {
  const dom = { none: 0, partial: 1, full: 2 };
  const pair = (a, b) => [{ v: a, dom: dom[a] }, { v: b, dom: dom[b] }];

  assert.equal(expressResistance(pair('none', 'none')), 0);
  assert.equal(expressResistance(pair('full', 'full')), 1);

  // Every step of the ladder must be strictly better than the one below it —
  // that monotonicity is what makes consolidating a line worthwhile.
  const ladder = [
    pair('none', 'none'),
    pair('partial', 'none'),
    pair('partial', 'partial'),
    pair('full', 'none'),
    pair('full', 'partial'),
    pair('full', 'full'),
  ].map(expressResistance);
  for (let i = 1; i < ladder.length; i++) {
    assert.ok(ladder[i] > ladder[i - 1], `step ${i} (${ladder[i]}) should beat ${ladder[i - 1]}`);
  }

  // Allele order must not matter.
  assert.equal(expressResistance(pair('full', 'none')), expressResistance(pair('none', 'full')));
});

test('a resistance allele segregates, and consolidating it is the whole project', () => {
  const rng = new RNG(4242);
  const carrier = () => setResistance(makeWildKinbeast('cinderkit', rng, 12), 'heat', 'none', 'full');
  const clean = setResistance(makeWildKinbeast('cinderkit', rng, 12), 'heat', 'none');

  // A carrier shows the trait, but only partly — one copy is not two.
  assert.equal(carrier().phenotype.resistances.heat, 0.7);
  assert.equal(setResistance(makeWildKinbeast('cinderkit', rng, 12), 'heat', 'full').phenotype.resistances.heat, 1);

  // Carrier x clean: about half the clutch inherits the allele at all.
  const mum = carrier();
  let inherited = 0;
  for (let i = 0; i < 240; i++) {
    const { genome } = conceive(clean, mum, rng, {});
    if (genome.loci.res_heat.some((a) => a.v === 'full')) inherited++;
  }
  assert.ok(inherited > 84 && inherited < 156, `expected about half to inherit it, got ${inherited}/240`);

  // Carrier x carrier: a quarter come out homozygous, which is the goal.
  const dad = carrier();
  let homozygous = 0;
  for (let i = 0; i < 240; i++) {
    const { genome } = conceive(mum, dad, rng, {});
    if (genome.loci.res_heat.every((a) => a.v === 'full')) homozygous++;
  }
  assert.ok(homozygous > 30 && homozygous < 90, `expected about a quarter true-breeding, got ${homozygous}/240`);
});

test('Heatproof suits some bodies and not others, as the chapter promises', () => {
  const rng = new RNG(808);

  // "Breed the Heatproof trait into a compatible Kinbeast" — so a homozygous
  // pair of the allele must be enough on a body that suits it...
  for (const id of ['cinderkit', 'pebbleback', 'shellip', 'embermole', 'sparkmidge']) {
    const beast = setResistance(makeWildKinbeast(id, rng, 14), 'heat', 'full');
    assert.ok(tolerance(beast, 'heat').ok, `${id} with full Heatproof should clear the furnace`);
  }

  // ...and not enough on a body that does not. The player is told exactly why.
  for (const id of ['brookfin', 'mudsprig']) {
    const beast = setResistance(makeWildKinbeast(id, rng, 14), 'heat', 'full');
    const t = tolerance(beast, 'heat');
    assert.ok(!t.ok, `${id} should not survive the furnace on genetics alone`);
    assert.ok(t.parts.some((part) => part.value < 0), 'the penalty should be itemised, not hidden');
  }
});

test('no wild Kinbeast reachable before the gate can walk through it', () => {
  // If a single bonded wild creature could clear the tunnels, the chapter's
  // breeding requirement would be decorative. Sample the ungated sites hard.
  const rng = new RNG(2024);
  const reachable = ['mossbun', 'cinderkit', 'brookfin', 'pebbleback', 'galecrest', 'glowgrub',
                     'duskmew', 'brambletusk', 'sparkmidge', 'shellip', 'mudsprig'];
  let cleared = 0;
  const samples = 400;
  for (let i = 0; i < samples; i++) {
    const beast = makeWildKinbeast(reachable[i % reachable.length], rng, 14);
    if (tolerance(beast, 'heat').ok) cleared++;
  }
  // A freakishly hardy individual is allowed to be a lucky find; a reliable
  // shortcut is not.
  assert.ok(cleared / samples < 0.02, `${cleared}/${samples} wild Kinbeasts cleared the gate unaided`);
});

test('a hazard is a party check, not a best-member check', () => {
  const rng = new RNG(99);
  const strong = () => setResistance(makeWildKinbeast('embermole', rng, 14), 'heat', 'full');
  const weak = () => setResistance(makeWildKinbeast('brookfin', rng, 14), 'heat', 'none');

  // One excellent Kinbeast does not carry two unsuited ones through.
  const mixed = partyClears([strong(), weak(), weak()], 'heat');
  assert.equal(mixed.ok, false);
  assert.equal(mixed.weakest.tolerance.ok, false);
  assert.equal(mixed.members.length, 3);

  assert.equal(partyClears([strong(), strong(), strong()], 'heat').ok, true);

  // Turning up with fewer than three adults is its own refusal.
  const short = partyClears([strong(), strong()], 'heat');
  assert.equal(short.ok, false);
  assert.equal(short.shortHanded, true);
});

test('tolerance explains itself with a breakdown that sums to the score', () => {
  const rng = new RNG(31);
  const beast = setResistance(makeWildKinbeast('cinderkit', rng, 12), 'heat', 'partial');
  const t = tolerance(beast, 'heat');
  const total = t.parts.reduce((s, part) => s + part.value, 0);
  // Parts are rounded individually, so allow a little drift.
  assert.ok(Math.abs(total - t.score) <= 2, `parts sum to ${total} but score is ${t.score}`);
  assert.ok(t.parts.some((p) => /flame/i.test(p.label)), 'Flame affinity should be itemised');
});

test('resistance is predicted before the pairing, not after', () => {
  const rng = new RNG(55);
  const mum = setResistance(makeWildKinbeast('embermole', rng, 14), 'heat', 'full', 'none');
  const dad = setResistance(makeWildKinbeast('embermole', rng, 14), 'heat', 'none');
  const pred = predictOffspring(mum, dad, 2);
  const heat = pred.resistances.heat;
  assert.ok(heat, 'a heat-carrying pairing should predict heat resistance');
  const total = heat.reduce((sum, row) => sum + row.p, 0);
  assert.ok(Math.abs(total - 1) < 1e-9);
  // Carrier x clean: half the clutch inherits the allele.
  const carrying = heat.filter((r) => r.label !== 'None').reduce((sum, r) => sum + r.p, 0);
  assert.ok(Math.abs(carrying - 0.5) < 1e-9, `expected half to carry it, got ${carrying}`);

  // And the prediction agrees with what actually gets bred.
  let observed = 0;
  for (let i = 0; i < 200; i++) {
    const { genome } = conceive(mum, dad, rng, {});
    if (expressGenome(genome).resistances.heat > 0) observed++;
  }
  assert.ok(observed > 70 && observed < 130, `predicted ~100/200 carriers, observed ${observed}`);
});

// ---------------------------------------------------------------------------
// New species
// ---------------------------------------------------------------------------

test('all playable species are well formed and drawable', async () => {
  const { SILHOUETTES } = await import('../src/render/creature.js');
  const { wildSpeciesIds } = await import('../src/data/species.js');
  const rng = new RNG(6);
  const wild = wildSpeciesIds();
  assert.equal(wild.length, 12);
  for (const id of SPECIES_IDS) {
    const species = getSpecies(id);
    assert.ok(SILHOUETTES.includes(species.silhouette), `${id} has no painter for ${species.silhouette}`);
    assert.ok(species.bondSkill, `${id} has no Bond Skill`);
    assert.ok(species.palettes.length >= 3, `${id} needs three palettes`);
    assert.ok(species.learnset.length >= 2, `${id} needs a learnset`);
    const beast = makeWildKinbeast(id, rng, 10);
    assert.ok(beast.moves.length > 0);
    for (const slot of Object.keys(species.featureSlots)) {
      assert.ok(beast.phenotype.features[slot], `${id} left ${slot} empty`);
    }
  }
});

test('every wild species is reachable from some expedition site', async () => {
  const { REGIONS } = await import('../src/data/regions.js');
  const { wildSpeciesIds } = await import('../src/data/species.js');
  const reachable = new Set();
  for (const region of Object.values(REGIONS)) {
    for (const site of region.sites) {
      for (const entry of site.encounters) reachable.add(entry.species);
    }
  }
  const missing = wildSpeciesIds().filter((id) => !reachable.has(id));
  assert.deepEqual(missing, [], `unreachable species: ${missing.join(', ')}`);
});

test('a horn move needs horns, exactly as a wing move needs wings', async () => {
  const { canPerform } = await import('../src/data/moves.js');
  const rng = new RNG(77);
  const boar = makeWildKinbeast('brambletusk', rng, 14);
  boar.genome.loci.feat_horn = [{ v: 'horn_tusk', dom: 2 }, { v: 'horn_tusk', dom: 2 }];
  boar.phenotype = expressGenome(boar.genome);
  assert.ok(canPerform('goringcharge', boar.phenotype.bodyTags));

  boar.genome.loci.feat_horn = [{ v: 'horn_none', dom: 2 }, { v: 'horn_none', dom: 2 }];
  boar.phenotype = expressGenome(boar.genome);
  assert.ok(!canPerform('goringcharge', boar.phenotype.bodyTags), 'no horns, no goring');
});

// ---------------------------------------------------------------------------
// Catalysts and incubation
// ---------------------------------------------------------------------------

test('a catalyst is consumed, gated, and raises mutation rate', () => {
  const game = new Game();
  game.facilities.nursery = 1;
  const mum = makeWildKinbeast('cinderkit', game.rng, 12);
  const dad = makeWildKinbeast('cinderkit', game.rng, 12);
  mum.bond = dad.bond = 60;
  game.addBeast(mum);
  game.addBeast(dad);

  // Locked before the chapter that teaches it.
  let res = game.breed(mum.id, dad.id, { catalyst: true });
  assert.equal(res.ok, false);
  assert.match(res.reason, /catalyst/i);

  game.flags.catalysts_unlocked = true;
  res = game.breed(mum.id, dad.id, { catalyst: true });
  assert.equal(res.ok, false, 'no Thermal Salt yet');

  game.addResource('thermal_salt', 1);
  res = game.breed(mum.id, dad.id, { catalyst: true });
  assert.ok(res.ok, res.reason);
  assert.equal(game.resources.thermal_salt, 0, 'the catalyst should be consumed');
  assert.equal(res.egg.catalyst, true);
  assert.ok(res.egg.stability < 90, 'a catalysed clutch should cost Stability');
});

test('incubation conditions reward a match and forgive a mismatch', () => {
  const matched = incubationEffect('hot', ['flame', 'stone']);
  assert.ok(matched.stability > 0 && matched.speed > 1);
  assert.equal(matched.matched, 'flame');

  const mismatched = incubationEffect('hot', ['tide']);
  assert.ok(mismatched.stability < 0, 'the wrong bed should cost Stability');
  assert.ok(mismatched.speed < 1);
  assert.ok(mismatched.speed > 0, 'but it must still hatch eventually');

  assert.deepEqual(incubationEffect('neutral', ['tide']), { stability: 0, speed: 1, matched: null });
});

test('incubation beds need the upgraded Hatchery', () => {
  const game = new Game();
  game.facilities.nursery = 1;
  assert.deepEqual(game.incubationOptions().map((c) => c.id), ['neutral']);
  game.facilities.hatchery = 2;
  assert.ok(game.incubationOptions().length > 1);

  // Requesting a bed the Hatchery cannot hold falls back rather than failing.
  game.facilities.hatchery = 1;
  const mum = makeWildKinbeast('embermole', game.rng, 12);
  const dad = makeWildKinbeast('embermole', game.rng, 12);
  mum.bond = dad.bond = 60;
  game.addBeast(mum);
  game.addBeast(dad);
  const res = game.breed(mum.id, dad.id, { condition: 'hot' });
  assert.ok(res.ok, res.reason);
  assert.equal(res.egg.condition, 'neutral');
});

// ---------------------------------------------------------------------------
// Hazardous sites
// ---------------------------------------------------------------------------

test('a hazardous site turns the team back instead of hurting them', () => {
  const game = new Game();
  game.unlockRegion('emberbreak');
  game.flags.exploration_unlocked = true;
  const soft = makeWildKinbeast('brookfin', game.rng, 12);
  setResistance(soft, 'heat', 'none');
  game.addBeast(soft);

  const before = game.stats.expeditions;
  const result = game.explore('emberbreak', 'deep_tunnels');
  assert.equal(result.blocked, true);
  assert.equal(game.stats.expeditions, before, 'a blocked expedition should not count');
  assert.ok(result.party.weakest.tolerance.shortfall > 0);

  // One Heatproof Kinbeast is still not a party.
  game.addBeast(setResistance(makeWildKinbeast('embermole', game.rng, 14), 'heat', 'full'));
  assert.equal(game.explore('emberbreak', 'deep_tunnels').blocked, true);

  // Three of them, and it opens.
  game.setTeam([]);
  const party = [];
  for (let i = 0; i < 3; i++) {
    const mole = setResistance(makeWildKinbeast('embermole', game.rng, 14), 'heat', 'full');
    game.addBeast(mole);
    party.push(mole.id);
  }
  game.setTeam(party);
  const second = game.explore('emberbreak', 'deep_tunnels');
  assert.ok(!second.blocked, 'a Heatproof party should get in');
  assert.equal(game.stats.expeditions, before + 1);
});

test('the Crown Ledger is only behind the hazard', async () => {
  const { REGIONS } = await import('../src/data/regions.js');
  const sources = [];
  for (const region of Object.values(REGIONS)) {
    for (const site of region.sites) {
      if (site.resources.includes('crown_ledger')) sources.push({ site, hazard: site.hazard });
    }
  }
  assert.equal(sources.length, 1, 'the ledger should have exactly one source');
  assert.equal(sources[0].site.id, 'deep_tunnels');
  assert.equal(sources[0].hazard, 'heat', 'and that source must be gated');
});

// ---------------------------------------------------------------------------
// Save migration
// ---------------------------------------------------------------------------

test('a save written before the resistance loci existed still loads', () => {
  const game = new Game();
  game.grantEchoryx();
  game.addBeast(makeWildKinbeast('embermole', game.rng, 12));
  const save = JSON.parse(JSON.stringify(game.toJSON()));

  // Simulate a version-1 save: strip every locus added since.
  save.version = 1;
  for (const beast of save.roster) {
    for (const locus of [...RESIST_LOCI, 'feat_horn']) delete beast.genome.loci[locus];
  }

  const restored = new Game(save);
  assert.equal(restored.roster.length, game.roster.length);
  for (const beast of restored.roster) {
    for (const locus of ALL_LOCI) {
      assert.ok(beast.genome.loci[locus], `${beast.name} is still missing ${locus}`);
    }
    assert.ok(beast.phenotype.resistances, 'phenotype should express resistances');
  }

  // Backfill respects the species: an Embermole is still adapted to heat.
  const mole = restored.roster.find((b) => b.speciesId === 'embermole');
  assert.equal(mole.phenotype.resistances.heat, 1, 'a native species should keep its adaptation');

  // And a species with no adaptation must not gain one for free.
  const echoryx = restored.lookup(restored.echoryxId);
  assert.equal(echoryx.phenotype.resistances.heat, 0);
});

test('normalising a genome twice changes nothing the second time', () => {
  const rng = new RNG(9);
  const genome = createWildGenome('shellip', rng);
  const once = JSON.stringify(normaliseGenome(genome));
  const twice = JSON.stringify(normaliseGenome(JSON.parse(once)));
  assert.equal(once, twice);
});

// ---------------------------------------------------------------------------
// The chapter, end to end
// ---------------------------------------------------------------------------

test('Chapter Two can be completed end to end', () => {
  const game = new Game();

  // Fast-forward through the earlier chapters.
  game.chapterIndex = 2;
  game.beatIndex = 0;
  game.flags.exploration_unlocked = true;
  game.flags.ch1_started = true;
  game.flags.ch1_complete = true;
  game.facilities.nursery = 1;
  game.facilities.hatchery = 1;
  game.seals.push('meadow');
  game.grantEchoryx();
  game.enterCurrentBeat();

  assert.equal(game.chapter.id, 'chapter_two');
  assert.equal(game.beat.id, 'ch2_open');
  game.advanceBeat();
  assert.ok(game.flags.ch2_started, 'the chapter should open the region');
  assert.ok(game.regionsUnlocked.includes('emberbreak'));
  assert.ok(game.flags.catalysts_unlocked);

  // --- survey ---
  assert.equal(game.beat.id, 'ch2_survey');
  const scout = makeWildKinbeast('cinderkit', game.rng, 11);
  game.addBeast(scout);
  game.explore('emberbreak', 'foothills');
  assert.equal(game.beat.id, 'ch2_maeve', `stuck on ${game.beat.id}`);
  game.advanceBeat();
  assert.ok(game.flags.ch2_briefed);

  // --- breed for the heat ---
  assert.equal(game.beat.id, 'ch2_heatproof');
  assert.equal(game.teamClears('heat'), false, 'the team should not clear it yet');

  // A single well-adapted donor must not be enough on its own.
  const donor = setResistance(makeWildKinbeast('embermole', game.rng, 13), 'heat', 'full');
  donor.bond = 60;
  game.addBeast(donor);
  game.setTeam([donor.id, scout.id]);
  assert.equal(game.teamClears('heat'), false, 'one Embermole is a donor, not a solution');

  // Breed the trait outward onto bodies that suit it.
  const heatTeam = [donor];
  for (const host of ['cinderkit', 'pebbleback']) {
    const partner = makeWildKinbeast(host, game.rng, 13);
    partner.bond = 60;
    game.addBeast(partner);
    const { genome, vigor, stability } = conceive(partner, donor, game.rng, {});
    // The pairing is real; the test forces the 50/50 so it is not flaky.
    genome.loci.res_heat = [{ v: 'full', dom: 2 }, { v: 'full', dom: 2 }];
    const child = makeKinbeast({
      genome, rng: game.rng, level: 13, parents: [partner.id, donor.id],
      generation: 2, origin: 'bred', vigor, stability, bond: 40,
    });
    game.addBeast(child);
    heatTeam.push(child);
  }

  game.setTeam(heatTeam.map((b) => b.id));
  game.checkStory();
  assert.equal(game.beat.id, 'ch2_tunnels', `a Heatproof party should satisfy the objective (on ${game.beat.id})`);

  // --- the tunnels ---
  let guard = 0;
  while ((game.resources.crown_ledger ?? 0) < 1 && guard++ < 40) {
    const result = game.explore('emberbreak', 'deep_tunnels');
    assert.ok(!result.blocked, 'the team should be able to get in');
  }
  assert.ok((game.resources.crown_ledger ?? 0) >= 1, 'never found a ledger page');
  assert.equal(game.beat.id, 'ch2_records');
  game.advanceBeat();
  assert.ok(game.echoryx.genome.echoes.includes('ash_ledger'));

  // --- the trial ---
  assert.equal(game.beat.id, 'ch2_trial');
  const trial = trialById('ember');
  const gate = trial.entry(game);
  assert.equal(gate.ok, true, gate.reason);

  for (const beast of game.activeTeam) grantXp(beast, 9000);
  const battle = autoBattle(game.activeTeam, trial.buildTeam(game), game.rng);
  const result = game.recordBattle(battle, { xp: 200, isTrial: true, trialId: 'ember' });

  if (result.won) {
    assert.ok(game.seals.includes('ember'));
    assert.equal(game.beat.id, 'ch2_close');
    game.advanceBeat();
    assert.ok(game.flags.ch2_complete);
    assert.ok(game.flags.cross_species_unlocked, 'Chapter Two should open outcrossing for Greenmantle');
    assert.equal(game.chapter, null, 'the campaign currently ends after Chapter Two');
  } else {
    // A loss must leave the Trial re-enterable, never soft-locked.
    assert.equal(game.beat.id, 'ch2_trial');
    assert.equal(trial.entry(game).ok, true);
  }
});

test('the Ember Trial refuses a party that cannot stand the heat', () => {
  const game = new Game();
  game.flags.ch2_briefed = true;
  for (let i = 0; i < 3; i++) {
    game.addBeast(setResistance(makeWildKinbeast('brookfin', game.rng, 14), 'heat', 'none'));
  }
  const gate = trialById('ember').entry(game);
  assert.equal(gate.ok, false);
  assert.match(gate.reason, /Heatproof tolerance/i);

  // Too few adults is a distinct, clearer refusal.
  const thin = new Game();
  thin.flags.ch2_briefed = true;
  thin.addBeast(setResistance(makeWildKinbeast('embermole', thin.rng, 14), 'heat', 'full'));
  assert.match(trialById('ember').entry(thin).reason, /party of 3/i);
});

test('trials only appear once their chapter has introduced them', async () => {
  const { availableTrials } = await import('../src/data/trials.js');
  const game = new Game();
  assert.deepEqual(availableTrials(game), []);
  game.flags.ch1_started = true;
  assert.deepEqual(availableTrials(game).map((t) => t.id), ['meadow']);
  game.flags.ch2_briefed = true;
  assert.deepEqual(availableTrials(game).map((t) => t.id), ['meadow', 'ember']);
  game.seals.push('meadow');
  assert.deepEqual(availableTrials(game).map((t) => t.id), ['ember']);
});

test('modular features never give a species anatomy it should not have', () => {
  // A fan crest is feathered; an amphibian or an insect must not be able to
  // express one and quietly pick up a "feather body" term in its tolerance.
  const rng = new RNG(1717);
  const forbidden = {
    mudsprig: ['feather', 'fur'],
    sparkmidge: ['feather', 'fur'],
    glowgrub: ['feather', 'fur'],
    shellip: ['feather'],
    galecrest: ['fur'],
  };
  for (const [id, banned] of Object.entries(forbidden)) {
    const species = getSpecies(id);
    // Pin every slot to a known variant and vary one at a time, so a failure
    // names the feature actually responsible rather than whatever the wild
    // roll happened to put in another slot.
    const slots = Object.entries(species.featureSlots);
    for (const [slot, variants] of slots) {
      for (const variant of variants) {
        const beast = makeWildKinbeast(id, rng, 8);
        for (const [other, otherVariants] of slots) {
          const chosen = other === slot ? variant : otherVariants[0];
          beast.genome.loci[`feat_${other}`] = [{ v: chosen, dom: 2 }, { v: chosen, dom: 2 }];
        }
        beast.phenotype = expressGenome(beast.genome);
        for (const tag of banned) {
          assert.ok(
            !beast.phenotype.bodyTags.includes(tag),
            `${id} gained a "${tag}" body tag from ${slot}=${variant}`
          );
        }
      }
    }
  }
});
