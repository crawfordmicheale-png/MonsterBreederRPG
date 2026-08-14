// Wild bonding.
//
// Kinbeasts are not captured inside objects. A wild Kinbeast joins you by
// accepting a Concord Mark, and it only does that if you read it correctly.
// There is no capture probability to grind — there is a creature in front of
// you with a temperament and a situation, and you either understand it or you
// do not.

import { TENDENCIES } from '../data/temperaments.js';

export const SITUATIONS = {
  wary:       { id: 'wary',       name: 'Wary',       line: 'It has not decided whether you are a threat.' },
  injured:    { id: 'injured',    name: 'Injured',    line: 'It is favouring one side and will not let you close.' },
  hungry:     { id: 'hungry',     name: 'Hungry',     line: 'It has been searching the same patch of ground for a while.' },
  nesting:    { id: 'nesting',    name: 'Guarding a nest', line: 'It has put itself between you and something small.' },
  playful:    { id: 'playful',    name: 'Playful',    line: 'It keeps darting away and looking back to see if you follow.' },
  challenging:{ id: 'challenging',name: 'Challenging',line: 'It has planted its feet and is waiting for you to try.' },
  lost:       { id: 'lost',       name: 'Separated',  line: 'A juvenile is calling from somewhere it should not be.' },
};

export const APPROACHES = {
  offer_food:    { id: 'offer_food',    name: 'Offer food',           cost: { meadow_herb: 1 }, blurb: 'Set something down and step back.' },
  heal:          { id: 'heal',          name: 'Tend the injury',      cost: { meadow_herb: 1 }, blurb: 'Move slowly and treat what you can reach.' },
  play:          { id: 'play',          name: 'Match its challenge',  cost: null, blurb: 'Give it the chase it is asking for.' },
  show_strength: { id: 'show_strength', name: 'Show your strength',   cost: null, blurb: 'Stand your ground and let it measure you.' },
  stay_still:    { id: 'stay_still',    name: 'Remain still',         cost: null, blurb: 'Do nothing at all, for as long as it takes.' },
  protect_nest:  { id: 'protect_nest',  name: 'Guard its nest',       cost: null, blurb: 'Put yourself between the nest and the open field.' },
  return_young:  { id: 'return_young',  name: 'Return the juvenile',  cost: null, blurb: 'Carry the small one back to where it was calling from.' },
  battle:        { id: 'battle',        name: 'Answer honourably',    cost: null, blurb: 'Accept the fight. Win it cleanly.', triggersBattle: true },
};

// How each approach lands, as a base trust delta, modified by temperament.
const BASE = {
  offer_food:    { hungry: 34, wary: 14, nesting: 10, injured: 12, playful: 8,  challenging: -4, lost: 6 },
  heal:          { injured: 38, wary: 8,  hungry: 10, nesting: 12, playful: 2,  challenging: -8, lost: 10 },
  play:          { playful: 34, wary: 6,  hungry: -2, nesting: -10,injured: -8, challenging: 12, lost: 0 },
  show_strength: { challenging: 26, wary: 6, nesting: -14, injured: -12, hungry: -4, playful: 8, lost: -6 },
  stay_still:    { wary: 26, nesting: 18, injured: 14, hungry: 6,  playful: -6, challenging: -6, lost: 4 },
  protect_nest:  { nesting: 40, wary: 6,  injured: 4,  hungry: 2,  playful: 0,  challenging: -2, lost: 12 },
  return_young:  { lost: 44, nesting: 24, wary: 8,  injured: 6, hungry: 4, playful: 4, challenging: 0 },
  battle:        { challenging: 30, wary: 12, playful: 14, hungry: 0, injured: -18, nesting: -20, lost: -10 },
};

// Temperament shading — the same gesture means different things to different
// creatures, which is the entire point.
const TEMPERAMENT_MOD = {
  offer_food:    { gentle: 6, social: 6, nervous: -4, territorial: -6, independent: -4 },
  heal:          { gentle: 8, nervous: 4, protective: 6, aggressive: -8, territorial: -6 },
  play:          { playful: 12, curious: 8, social: 6, patient: -4, territorial: -8 },
  show_strength: { aggressive: 10, bold: 10, territorial: 6, nervous: -14, gentle: -8 },
  stay_still:    { nervous: 14, patient: 10, independent: 6, playful: -8, aggressive: -4 },
  protect_nest:  { protective: 14, loyal: 8, territorial: 8, independent: -2 },
  return_young:  { protective: 14, gentle: 8, loyal: 8, social: 6 },
  battle:        { aggressive: 14, bold: 12, territorial: 8, nervous: -12, gentle: -10 },
};

/** Approaches that make sense to offer for a given situation. */
export function approachesFor(situation) {
  const always = ['stay_still', 'show_strength', 'battle'];
  const bySituation = {
    wary: ['offer_food'],
    injured: ['heal', 'offer_food'],
    hungry: ['offer_food'],
    nesting: ['protect_nest', 'offer_food'],
    playful: ['play'],
    challenging: ['play'],
    lost: ['return_young', 'offer_food'],
  };
  return [...(bySituation[situation] ?? []), ...always].map((id) => APPROACHES[id]);
}

export function pickSituation(beast, rng) {
  const t = beast.phenotype.temperament;
  const pool = [];
  const add = (id, w) => { for (let i = 0; i < w; i++) pool.push(id); };
  add('wary', 4);
  add('hungry', 3);
  if (t.includes('playful') || t.includes('curious')) add('playful', 5);
  if (t.includes('aggressive') || t.includes('bold') || t.includes('territorial')) add('challenging', 5);
  if (t.includes('protective') || t.includes('loyal')) add('nesting', 4);
  if (t.includes('gentle') || t.includes('nervous')) add('injured', 3);
  add('lost', 1);
  return rng.pick(pool);
}

export class Encounter {
  constructor(beast, rng, opts = {}) {
    this.beast = beast;
    this.rng = rng;
    this.situation = opts.situation ?? pickSituation(beast, rng);
    this.trust = 12 + Math.round(rng.range(0, 10));
    this.patience = opts.patience ?? 4;
    this.used = new Set();
    this.log = [];
    this.resolved = null; // 'bonded' | 'fled' | 'left'
    this.threshold = thresholdFor(beast);
    this.battleWon = false;
  }

  get trustPercent() {
    return Math.max(0, Math.min(100, Math.round((this.trust / this.threshold) * 100)));
  }

  /** Apply an approach. Returns a narrated result. */
  attempt(approachId, ctx = {}) {
    if (this.resolved) return { text: 'The encounter is already over.', delta: 0 };
    const approach = APPROACHES[approachId];
    if (!approach) return { text: 'Nothing happens.', delta: 0 };

    let delta = BASE[approachId]?.[this.situation] ?? 0;
    const mods = TEMPERAMENT_MOD[approachId] ?? {};
    for (const tendency of this.beast.phenotype.temperament) {
      delta += mods[tendency] ?? 0;
    }

    // Repeating yourself works less well each time.
    if (this.used.has(approachId)) delta = Math.round(delta * 0.4);
    this.used.add(approachId);

    // A Handler reads creatures faster.
    if (ctx.aptitude === 'handler') delta += delta > 0 ? 5 : 0;
    if (approachId === 'battle' && this.battleWon) delta += 12;

    delta += Math.round(this.rng.bell() * 4);
    this.trust += delta;
    this.patience -= 1;

    const text = narrate(this.beast, this.situation, approachId, delta);
    this.log.push({ approachId, delta, text });

    if (this.trust >= this.threshold) {
      this.resolved = 'ready';
    } else if (this.trust <= -12 || this.patience <= 0) {
      this.resolved = this.trust <= -12 ? 'fled' : 'left';
    }
    return { text, delta, resolved: this.resolved };
  }

  /** Called after the player wins the optional honourable battle. */
  recordBattleWin() {
    this.battleWon = true;
    this.patience += 1;
  }

  /** Offer the Concord Mark. Only valid once trust is high enough. */
  acceptConcord() {
    if (this.resolved !== 'ready') return false;
    this.resolved = 'bonded';
    return true;
  }
}

function thresholdFor(beast) {
  const rarity = beast.phenotype.species.rarity;
  const base = { common: 46, uncommon: 62, rare: 80, veryrare: 100 }[rarity] ?? 46;
  const shy = beast.phenotype.temperament.reduce(
    (m, t) => m + (1 - (TENDENCIES[t]?.bond ?? 1)) * 10,
    0
  );
  return Math.round(base + shy);
}

function narrate(beast, situation, approachId, delta) {
  const name = beast.phenotype.species.name;
  const good = delta >= 14;
  const fine = delta > 0;
  const lines = {
    offer_food: good
      ? `The ${name} eats without taking its eyes off you, which is as close to trust as it gets today.`
      : fine
      ? `It sniffs at the offering, then at you.`
      : `It ignores the food entirely. That was not the problem.`,
    heal: good
      ? `It lets you finish. When you step back it does not move away.`
      : fine
      ? `It allows one touch, then two.`
      : `It will not let you near the injury.`,
    play: good
      ? `You lose the chase badly and the ${name} seems delighted about it.`
      : fine
      ? `It circles once, testing whether you mean it.`
      : `It stops playing. Whatever this is, it is not a game to it.`,
    show_strength: good
      ? `The ${name} measures you, and decides you are worth standing beside.`
      : fine
      ? `It holds your gaze a moment longer than before.`
      : `It reads the display as a threat and backs away stiff-legged.`,
    stay_still: good
      ? `After a long time, the ${name} comes close enough that you could touch it. You do not.`
      : fine
      ? `The grass settles. So does it, a little.`
      : `Stillness only makes it impatient.`,
    protect_nest: good
      ? `It watches you keep the field clear, and something in its posture lets go.`
      : fine
      ? `It permits you to stand there. That is not nothing.`
      : `It does not want you near the nest at all.`,
    return_young: good
      ? `The juvenile scrambles back. The adult looks at you for a long moment before it follows.`
      : fine
      ? `It accepts the young one and retreats a step.`
      : `It takes the juvenile and puts more distance between you.`,
    battle: good
      ? `You fight it fairly and it accepts the result the way its kind always has.`
      : fine
      ? `It gives ground, respectfully.`
      : `The fight only convinces it that you are dangerous.`,
  };
  return lines[approachId] ?? 'Nothing changes.';
}
