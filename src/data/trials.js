// Concord Trials. The slice ships the Hearthmere Meadow Trial.
//
// A Trial has an entry condition that is checked against the roster at the
// gate, so the requirement is legible before the player commits to a battle.

import { makeWildKinbeast } from '../core/kinbeast.js';
import { partyClears } from './environment.js';

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

  ember: {
    id: 'ember',
    name: 'The Trial of Embers',
    master: 'Trial Master Maeve Embervale',
    region: 'emberbreak',
    seal: 'ember',
    blurb:
      'Embervale runs its Trial on the floor of a working furnace hall. The heat is part of the examination.',
    rule: 'Field a full party of three who can all stand the furnace floor — Heatproof tolerance 76 each.',
    intro: [
      { who: 'Maeve Embervale', text: 'On the furnace floor, not the yard. If your team cannot stand in it, we have nothing to discuss.' },
      { who: 'Maeve Embervale', text: 'Mine can. Mine have stood in it for eleven generations, which is rather the problem.' },
      { who: 'Maeve Embervale', text: 'Begin.' },
    ],
    victory: [
      { who: 'Maeve Embervale', text: 'Stop. Stop — that is the Trial.' },
      { who: 'Maeve Embervale', text: 'You bred that tolerance in this season. Mine took eleven generations and a Crown treatment that is killing them. Say nothing. I can hear it myself.' },
    ],
    defeat: [
      { who: 'Maeve Embervale', text: 'The heat took more out of you than I did. Go and breed for it properly, and come back.' },
    ],
    /** Roster gate: someone on the team must be able to stand in the hall. */
    entry: (game) => {
      const party = game.partyFor('heat');
      if (party.shortHanded) {
        return { ok: false, reason: `The furnace floor takes a party of ${party.needed} adults. You have ${party.members.length}.` };
      }
      if (!party.ok) {
        const w = party.weakest;
        return {
          ok: false,
          reason: `${w.beast.name} would not last: ${w.tolerance.score} of ${w.tolerance.threshold} Heatproof tolerance.`,
        };
      }
      return { ok: true };
    },
    buildTeam: (game) => {
      const rng = game.rng;
      const level = Math.max(
        13,
        Math.round(
          game.activeTeam.reduce((s, b) => s + b.level, 0) / Math.max(1, game.activeTeam.length)
        ) + 1
      );
      const roster = [
        makeWildKinbeast('embermole', rng, level + 1),
        makeWildKinbeast('brambletusk', rng, level),
        makeWildKinbeast('cinderkit', rng, level + 2),
      ];
      for (let i = 0; i < roster.length; i++) {
        const beast = roster[i];
        beast.name = EMBER_NAMES[i] ?? beast.name;
        beast.bond = 85;
        for (const stat of Object.keys(beast.training)) {
          beast.training[stat] = Math.round(beast.phenotype.aptitudes[stat] * 78);
        }
      }
      return roster;
    },
    reward: { xp: 200, resources: { iron_scrap: 3, ember_ash: 3, thermal_salt: 2 } },
  },
};

const TRIAL_NAMES = ['Hedgerow', 'Millstone', 'Weathervane'];
const EMBER_NAMES = ['Slagwake', 'Bellows', 'Quench'];

export function trialById(id) {
  return TRIALS[id];
}

const TRIAL_GATES = { meadow: 'ch1_started', ember: 'ch2_briefed' };

/** Trials the player has been told about and has not yet won. */
export function availableTrials(game) {
  return Object.values(TRIALS).filter(
    (t) => !game.seals.includes(t.seal) && game.flags[TRIAL_GATES[t.id] ?? 'ch1_started']
  );
}
