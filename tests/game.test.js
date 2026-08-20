import test from 'node:test';
import assert from 'node:assert/strict';

import { Game } from '../src/core/state.js';
import { Battle } from '../src/battle/engine.js';
import { makeWildKinbeast, grantXp, computeStats } from '../src/core/kinbeast.js';
import { Encounter } from '../src/core/bonding.js';
import { RNG } from '../src/core/rng.js';
import { trialById } from '../src/data/trials.js';
import { effectiveness } from '../src/data/affinities.js';

/** Run a battle to completion with the built-in AI driving both sides. */
function autoBattle(playerTeam, foeTeam, rng, config = {}) {
  const battle = new Battle(playerTeam, foeTeam, { rng, ...config });
  let guard = 0;
  while (!battle.finished && guard++ < 500) {
    const actor = battle.nextActor();
    if (!actor) break;
    battle.takeAction(actor, battle.autoAction(actor));
  }
  return battle;
}

test('a battle always terminates and produces a definite outcome', () => {
  const rng = new RNG(7);
  for (let i = 0; i < 25; i++) {
    const player = [
      makeWildKinbeast('mossbun', rng, 10),
      makeWildKinbeast('cinderkit', rng, 10),
      makeWildKinbeast('pebbleback', rng, 10),
    ];
    const foe = [
      makeWildKinbeast('brookfin', rng, 10),
      makeWildKinbeast('galecrest', rng, 10),
      makeWildKinbeast('glowgrub', rng, 10),
    ];
    const battle = autoBattle(player, foe, rng);
    assert.ok(battle.finished, 'battle did not finish');
    assert.ok(['win', 'lose'].includes(battle.outcome));
    // Exactly one side is wiped out.
    const playerDown = battle.standing('player').length === 0;
    const foeDown = battle.standing('foe').length === 0;
    assert.ok(playerDown !== foeDown, 'both or neither side was wiped');
  }
});

test('reserves come forward automatically when someone faints', () => {
  const rng = new RNG(11);
  const player = Array.from({ length: 6 }, () => makeWildKinbeast('mossbun', rng, 8));
  const foe = Array.from({ length: 3 }, () => makeWildKinbeast('cinderkit', rng, 16));
  const battle = autoBattle(player, foe, rng);
  const everFainted = battle.side('player').filter((c) => c.fainted).length;
  if (everFainted > 0) {
    // With six on the bench, at least four should have seen the field.
    const seen = battle.side('player').filter((c) => c.active || c.fainted).length;
    assert.ok(seen >= Math.min(4, everFainted + 3), `only ${seen} took the field`);
  }
});

test('a survival objective ends in a win once the rounds are held', () => {
  const rng = new RNG(3);
  const player = [makeWildKinbeast('pebbleback', rng, 30), makeWildKinbeast('pebbleback', rng, 30)];
  const foe = [makeWildKinbeast('mossbun', rng, 3)];
  const battle = autoBattle(player, foe, rng, { objective: 'survive', rounds: 3 });
  assert.equal(battle.outcome, 'win');
});

test('the affinity chart is symmetrical where it should be and stacks on duals', () => {
  assert.equal(effectiveness('flame', ['grove']), 2);
  assert.equal(effectiveness('flame', ['tide']), 0.5);
  assert.equal(effectiveness('grove', ['tide', 'stone']), 4);
  assert.equal(effectiveness('flame', ['grove', 'tide']), 1);
  assert.equal(effectiveness('gale', ['light']), 1, 'unlisted matchups are neutral');
});

test('the timeline preview matches who actually acts next', () => {
  const rng = new RNG(5);
  const player = [makeWildKinbeast('galecrest', rng, 12), makeWildKinbeast('pebbleback', rng, 12)];
  const foe = [makeWildKinbeast('glowgrub', rng, 12)];
  const battle = new Battle(player, foe, { rng });
  const preview = battle.previewTimeline(3);
  const actual = battle.nextActor();
  assert.equal(preview[0].id, actual.id, 'preview disagreed with the engine');
});

test('a calm objective can be won by settling the foe without wiping them', () => {
  const rng = new RNG(19);
  const player = [
    makeWildKinbeast('mossbun', rng, 18),
    makeWildKinbeast('glowgrub', rng, 16),
  ];
  const foe = [makeWildKinbeast('embermole', rng, 8)];
  const battle = autoBattle(player, foe, rng, { objective: 'calm' });
  assert.equal(battle.outcome, 'win');
  assert.ok(battle.calmProgress >= 100 || battle.standing('foe').length === 0);
});

test('Echoryx has its own species and silhouette', () => {
  const game = new Game();
  game.grantEchoryx();
  assert.equal(game.echoryx.speciesId, 'echoryx');
  assert.equal(game.echoryx.phenotype.species.silhouette, 'echo');
  assert.ok(game.echoryx.isEchoryx);
  assert.equal(game.recoveryLevel(), 0);
});

test('hatching queues a ceremony the UI can drain', () => {
  const game = new Game();
  game.flags.breeding_unlocked = true;
  game.flags.cross_species_unlocked = true;
  game.facilities.nursery = 1;
  const mum = makeWildKinbeast('mossbun', game.rng, 12);
  const dad = makeWildKinbeast('mossbun', game.rng, 12);
  mum.stage = 'adult';
  dad.stage = 'adult';
  game.addBeast(mum);
  game.addBeast(dad);
  const res = game.breed(mum.id, dad.id);
  assert.ok(res.ok);
  while (game.eggs.length) game.completeActivity('expedition', 20);
  const ceremonies = game.drainCeremonies();
  assert.ok(ceremonies.some((c) => c.kind === 'hatch'));
});

test('bonding responds to temperament rather than a capture roll', () => {
  const rng = new RNG(99);
  const beast = makeWildKinbeast('cinderkit', rng, 6);
  beast.phenotype.temperament = ['aggressive', 'bold'];

  const fight = new Encounter(beast, rng, { situation: 'challenging' });
  const before = fight.trust;
  fight.attempt('show_strength');
  assert.ok(fight.trust > before, 'a challenging, bold Kinbeast should respect a show of strength');

  const timid = makeWildKinbeast('mossbun', rng, 6);
  timid.phenotype.temperament = ['nervous', 'gentle'];
  const quiet = new Encounter(timid, rng, { situation: 'wary' });
  const start = quiet.trust;
  quiet.attempt('show_strength');
  assert.ok(quiet.trust < start, 'the same gesture should frighten a nervous Kinbeast');
});

test('an encounter always resolves within its patience', () => {
  const rng = new RNG(1234);
  for (let i = 0; i < 40; i++) {
    const beast = makeWildKinbeast('brookfin', rng, 6);
    const enc = new Encounter(beast, rng);
    let guard = 0;
    while (!enc.resolved && guard++ < 12) enc.attempt('stay_still');
    assert.ok(enc.resolved, 'encounter never resolved');
  }
});

test('a save round-trips without losing anything the player can see', () => {
  const game = new Game();
  const rng = game.rng;
  game.grantEchoryx();
  const wild = makeWildKinbeast('cinderkit', rng, 9);
  game.formConcord(wild);
  game.addResource('river_stone', 4);
  game.flags.test_flag = true;
  game.note('a line in the journal');

  const restored = new Game(JSON.parse(JSON.stringify(game.toJSON())));

  assert.equal(restored.roster.length, game.roster.length);
  assert.equal(restored.resources.river_stone, game.resources.river_stone);
  assert.equal(restored.flags.test_flag, true);
  assert.equal(restored.echoryxId, game.echoryxId);

  for (const before of game.roster) {
    const after = restored.lookup(before.id);
    assert.ok(after, `${before.name} did not survive the save`);
    assert.deepEqual(computeStats(after), computeStats(before), 'statistics changed across a save');
    assert.deepEqual(after.phenotype.affinities, before.phenotype.affinities);
    assert.deepEqual(after.phenotype.features, before.phenotype.features);
    assert.equal(after.phenotype.pattern, before.phenotype.pattern);
    assert.equal(after.moves.join(','), before.moves.join(','));
  }
});

test('eggs develop through activities, never through elapsed time', () => {
  const game = new Game();
  game.facilities.nursery = 1;
  const mum = makeWildKinbeast('mossbun', game.rng, 12);
  const dad = makeWildKinbeast('mossbun', game.rng, 12);
  mum.bond = dad.bond = 60;
  game.addBeast(mum);
  game.addBeast(dad);

  const res = game.breed(mum.id, dad.id);
  assert.ok(res.ok, res.reason);
  assert.equal(game.eggs.length, 1);
  const needed = game.eggs[0].needed;

  let spins = 0;
  while (game.eggs.length && spins++ < 60) game.completeActivity('test', 1);
  assert.equal(game.eggs.length, 0, 'the egg never hatched');
  assert.ok(spins <= needed + 1, `hatching took ${spins} activities, expected about ${needed}`);
  assert.equal(game.stats.eggsHatched, 1);

  const chick = game.roster.find((b) => b.generation === 2);
  assert.ok(chick);
  assert.equal(chick.stage, 'hatchling');
  assert.deepEqual(chick.parents.sort(), [mum.id, dad.id].sort());
});

test('the prologue and Chapter One can be completed end to end', () => {
  const game = new Game();

  // --- Prologue ---
  assert.equal(game.beat.id, 'arrival');
  game.advanceBeat(); // read the opening scene

  assert.equal(game.beat.id, 'clear_nursery');
  assert.ok(game.runProject('clear_nursery').ok);
  assert.equal(game.beat.id, 'hatch_echoryx', 'clearing the nursery should advance the story');
  assert.ok(game.echoryx, 'Echoryx should have hatched on entering the beat');

  game.advanceBeat(); // Echoryx scene
  assert.equal(game.beat.id, 'veyra');
  game.advanceBeat(); // Veyra scene
  assert.ok(game.flags.exploration_unlocked);

  assert.equal(game.beat.id, 'first_bond');
  const first = makeWildKinbeast('mossbun', game.rng, 9);
  game.formConcord(first);
  assert.equal(game.beat.id, 'first_battle');

  const win = autoBattle(game.activeTeam, [makeWildKinbeast('mossbun', game.rng, 1)], game.rng);
  game.recordBattle(win, { xp: 40 });
  assert.equal(game.beat.id, 'first_echo', `stuck on ${game.beat.id}`);
  game.advanceBeat();
  assert.ok(game.echoryx.genome.echoes.includes('ash_hands'));

  // --- Chapter One ---
  assert.equal(game.chapter.id, 'chapter_one');
  assert.equal(game.beat.id, 'ch1_open');
  game.advanceBeat();
  assert.ok(game.flags.breeding_unlocked);

  assert.equal(game.beat.id, 'ch1_nursery');
  game.addResource('soft_reed', 3);
  game.addResource('river_stone', 3);
  assert.ok(game.runProject('build_nursery').ok);
  assert.equal(game.beat.id, 'ch1_pair');

  // Two unrelated adults who will settle together.
  const mum = makeWildKinbeast('mossbun', game.rng, 12);
  const dad = makeWildKinbeast('mossbun', game.rng, 12);
  mum.phenotype.temperament = ['gentle', 'social'];
  dad.phenotype.temperament = ['patient', 'loyal'];
  mum.bond = dad.bond = 60;
  game.addBeast(mum);
  game.addBeast(dad);
  game.checkStory();
  assert.equal(game.beat.id, 'ch1_egg', 'a compatible pair should satisfy the objective');

  const bred = game.breed(mum.id, dad.id);
  assert.ok(bred.ok, bred.reason);
  assert.equal(game.beat.id, 'ch1_hatch');

  let guard = 0;
  while (game.eggs.length && guard++ < 80) game.completeActivity('test', 1);
  assert.equal(game.beat.id, 'ch1_raise');

  const offspring = game.roster.find((b) => b.generation >= 2);
  grantXp(offspring, 400);
  assert.ok(offspring.level >= 3);
  game.checkStory();
  assert.equal(game.beat.id, 'ch1_trial');

  // --- The Meadow Trial ---
  const trial = trialById('meadow');
  game.setTeam([offspring.id, mum.id, dad.id]);
  const gate = trial.entry(game);
  assert.equal(gate.ok, true, gate.reason);

  // Give the team a fair chance, then run the Trial.
  for (const beast of [mum, dad, offspring]) grantXp(beast, 4000);
  const trialBattle = autoBattle(game.activeTeam, trial.buildTeam(game), game.rng);
  const result = game.recordBattle(trialBattle, { xp: 130, isTrial: true, trialId: 'meadow' });

  if (result.won) {
    assert.ok(game.seals.includes('meadow'));
    assert.equal(game.beat.id, 'ch1_close');
    game.advanceBeat();
    assert.ok(game.flags.ch1_complete);
    assert.equal(game.chapter, null, 'the slice ends after Chapter One');
  } else {
    // Losing must leave the player able to try again, not soft-locked.
    assert.equal(game.beat.id, 'ch1_trial');
    assert.equal(trial.entry(game).ok, true);
  }
});

test('the Trial gate rejects a team with no home-bred Kinbeast', () => {
  const game = new Game();
  const wild = makeWildKinbeast('mossbun', game.rng, 12);
  game.addBeast(wild);
  const gate = trialById('meadow').entry(game);
  assert.equal(gate.ok, false);
  assert.match(gate.reason, /second-generation/i);
});

test('training stops at the genetic ceiling and says so', () => {
  const game = new Game();
  game.facilities.trainingYard = 1;
  const beast = makeWildKinbeast('pebbleback', game.rng, 15);
  game.addBeast(beast);

  const cap = Math.round(beast.phenotype.aptitudes.guard * 100);
  let guard = 0;
  let last = { ok: true };
  while (last.ok && guard++ < 60) last = game.train(beast.id, 'guard');
  assert.equal(last.ok, false);
  assert.match(last.reason, /potential/i);
  assert.equal(beast.training.guard, cap);
});

test('Echo reconstruction needs every fragment and then fires once', () => {
  const game = new Game();
  game.grantEchoryx();
  game.facilities.echoHall = 1;

  game.giveFragment(game.echoryxId, 'ash_hands');
  assert.equal(game.reconstructEcho('night_of_ash_first').ok, false);

  game.giveFragment(game.echoryxId, 'ash_stair');
  game.giveFragment(game.echoryxId, 'ash_bell');
  const first = game.reconstructEcho('night_of_ash_first');
  assert.equal(first.ok, true);
  assert.ok(game.flags.echo_night_of_ash_first);
  assert.equal(game.reconstructEcho('night_of_ash_first').ok, false, 'an Echo should not reconstruct twice');
});

test('naming a bloodline tags the whole descending line', () => {
  const game = new Game();
  game.facilities.nursery = 1;
  const mum = makeWildKinbeast('brookfin', game.rng, 12);
  const dad = makeWildKinbeast('brookfin', game.rng, 12);
  mum.bond = dad.bond = 60;
  game.addBeast(mum);
  game.addBeast(dad);
  game.breed(mum.id, dad.id);
  let guard = 0;
  while (game.eggs.length && guard++ < 80) game.completeActivity('test', 1);

  const child = game.roster.find((b) => b.generation === 2);
  game.nameLineage(mum.id, 'Silverbrook Guardians');
  assert.equal(mum.lineage, 'silverbrook_guardians');
  assert.equal(child.lineage, 'silverbrook_guardians', 'descendants inherit the line name');
  assert.equal(game.lineageMembers('silverbrook_guardians').length, 2);
});

test('habitats respect their upgraded capacity, and overflow is visible', () => {
  const game = new Game();
  const meadowCap = game.habitat('meadow').capacity;

  // Fill the meadow to capacity with meadow-dwelling species.
  for (let i = 0; i < meadowCap; i++) {
    game.addBeast(makeWildKinbeast('mossbun', game.rng, 8));
  }
  assert.equal(game.occupantsOf('meadow').length, meadowCap);
  assert.equal(game.isCrowded('meadow'), false);
  assert.equal(game.hasRoom('meadow'), false);

  // With a second habitat open, the next arrival goes there instead.
  game.unlockHabitat('wetland');
  const overflow = makeWildKinbeast('mossbun', game.rng, 8);
  game.addBeast(overflow);
  assert.equal(overflow.habitat, 'wetland', 'a full habitat should push new arrivals elsewhere');
  assert.equal(game.isCrowded('meadow'), false);

  // Capacity upgrades are read from game state, not the static species table.
  game.habitats.meadow.capacity += 2;
  assert.equal(game.habitat('meadow').capacity, meadowCap + 2);
  assert.equal(game.hasRoom('meadow'), true);
});

test('a crowded habitat raises stress instead of easing it', () => {
  const game = new Game();
  const cap = game.habitat('meadow').capacity;
  for (let i = 0; i < cap + 2; i++) game.addBeast(makeWildKinbeast('mossbun', game.rng, 8));
  assert.equal(game.isCrowded('meadow'), true, 'the only habitat should end up over capacity');

  for (const b of game.roster) b.stress = 20;
  game.completeActivity('test', 1);
  assert.ok(game.roster.every((b) => b.stress > 20), 'crowding should add stress');
});
