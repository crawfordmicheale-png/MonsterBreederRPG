// Concord Trials. The slice ships the Hearthmere Meadow Trial.
//
// A Trial has an entry condition that is checked against the roster at the
// gate, so the requirement is legible before the player commits to a battle.

import { makeWildKinbeast } from '../core/kinbeast.js';

export const TRIALS = {
  meadow: {
    id: 'meadow',
    name: 'The Meadow Trial',
    master: 'Trial Master Bevan Ashlow',
    region: 'hearthmere',
    seal: 'meadow',
    blurb:
      'Hearthmere\'s Trial is the smallest of the five. It has exactly one rule, and the rule is not about winning.',
    rule: 'Enter with a Kinbeast you bred yourself — second generation or later.',
    intro: [
      { who: 'Bevan Ashlow', text: 'Briarhold. Well. That is a name I have not written on a form in some time.' },
      { who: 'Bevan Ashlow', text: 'You know the rule. I do not care how strong your team is. I care that one of them was born here.' },
      { who: 'Bevan Ashlow', text: 'Second generation on the field. Then we can begin.' },
    ],
    victory: [
      { who: 'Bevan Ashlow', text: 'Hm. The young one held its position better than the ones you caught. That is breeding, not luck.' },
      { who: 'Bevan Ashlow', text: 'The Meadow Seal. It is stone and it is ugly and four more people will have to hand you one before the Crown has to listen.' },
    ],
    defeat: [
      { who: 'Bevan Ashlow', text: 'No. Come back when the line has settled. It will.' },
    ],
    /** Roster gate. Returns { ok, reason }. */
    entry: (game) => {
      const bred = game.activeTeam.filter((b) => b.generation >= 2 && b.origin === 'bred');
      if (!bred.length) {
        return { ok: false, reason: 'No second-generation Kinbeast on your active team.' };
      }
      if (!game.activeTeam.some((b) => b.stage !== 'hatchling')) {
        return { ok: false, reason: 'Your team cannot field anyone old enough to battle.' };
      }
      return { ok: true };
    },
    /** Build the opposing team, scaled to the player's roster. */
    buildTeam: (game) => {
      const rng = game.rng;
      const level = Math.max(
        7,
        Math.round(
          game.activeTeam.reduce((s, b) => s + b.level, 0) / Math.max(1, game.activeTeam.length)
        )
      );
      const roster = [
        makeWildKinbeast('mossbun', rng, level + 1),
        makeWildKinbeast('pebbleback', rng, level + 1),
        makeWildKinbeast('galecrest', rng, level + 2),
      ];
      for (const beast of roster) {
        beast.name = TRIAL_NAMES[roster.indexOf(beast)] ?? beast.name;
        beast.bond = 70;
        // Trial Kinbeasts are trained, not merely levelled.
        for (const stat of Object.keys(beast.training)) {
          beast.training[stat] = Math.round(beast.phenotype.aptitudes[stat] * 55);
        }
      }
      return roster;
    },
    reward: { xp: 130, resources: { river_stone: 2, meadow_herb: 2 } },
  },
};

const TRIAL_NAMES = ['Hedgerow', 'Millstone', 'Weathervane'];

export function trialById(id) {
  return TRIALS[id];
}

export function availableTrials(game) {
  return Object.values(TRIALS).filter((t) => !game.seals.includes(t.seal));
}
