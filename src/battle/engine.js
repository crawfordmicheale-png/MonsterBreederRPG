// Turn-based 3v3 combat on a visible initiative timeline.
//
// The engine is headless: it emits events and waits for an action whenever the
// active combatant belongs to the player. The UI layer renders the events.

import { MOVES, getMove } from '../data/moves.js';
import { effectiveness } from '../data/affinities.js';
import { REACTIONS } from '../data/temperaments.js';
import { computeStats } from '../core/kinbeast.js';

const CHARGE_GOAL = 1000;

export const OBJECTIVES = {
  defeat:  { id: 'defeat',  name: 'Defeat the opposing team' },
  survive: { id: 'survive', name: 'Survive the required rounds' },
  calm:    { id: 'calm',    name: 'Calm the rampaging Kinbeast' },
  protect: { id: 'protect', name: 'Protect the nest' },
};

export function makeCombatant(beast, side, index) {
  const stats = computeStats(beast);
  return {
    id: beast.id,
    ref: beast,
    side,
    index,
    name: beast.name,
    speciesId: beast.speciesId,
    affinities: beast.phenotype.affinities,
    temperament: beast.phenotype.temperament,
    stats,
    maxHp: stats.maxHp,
    hp: Math.max(1, stats.maxHp - (beast.hpLost ?? 0)),
    maxStamina: stats.maxStamina,
    stamina: stats.maxStamina,
    charge: 0,
    active: index < 3,
    fainted: false,
    statuses: {},
    flags: { firstAttack: true, guarded: false, bondUsed: false, measured: 0, startled: false },
    moves: beast.moves.slice(0, 4),
    bondSkill: beast.bond >= 50 ? bondSkillFor(beast) : null,
    passive: beast.phenotype.species.passive,
  };
}

function bondSkillFor(beast) {
  const id = beast.phenotype.species.bondSkill;
  return MOVES[id] ? id : null;
}

export class Battle {
  /**
   * @param {object[]} playerTeam up to 6 Kinbeasts (first 3 start active)
   * @param {object[]} foeTeam
   * @param {object} config { objective, rounds, rng, foeName, calmThreshold }
   */
  constructor(playerTeam, foeTeam, config = {}) {
    this.config = { objective: 'defeat', rounds: 5, ...config };
    this.rng = config.rng;
    this.round = 1;
    this.finished = false;
    this.outcome = null;
    this.events = [];
    this.turnCount = 0;
    this.nestHp = config.nestHp ?? 100;
    this.calmProgress = 0;

    this.combatants = [
      ...playerTeam.slice(0, 6).map((b, i) => makeCombatant(b, 'player', i)),
      ...foeTeam.slice(0, 6).map((b, i) => makeCombatant(b, 'foe', i)),
    ];

    for (const c of this.combatants) if (c.active) this.onEnterField(c);
  }

  // -- queries -------------------------------------------------------------

  side(side) {
    return this.combatants.filter((c) => c.side === side);
  }

  activeOf(side) {
    return this.combatants.filter((c) => c.side === side && c.active && !c.fainted);
  }

  reservesOf(side) {
    return this.combatants.filter((c) => c.side === side && !c.active && !c.fainted);
  }

  standing(side) {
    return this.combatants.filter((c) => c.side === side && !c.fainted);
  }

  get(id) {
    return this.combatants.find((c) => c.id === id);
  }

  log(type, payload = {}) {
    this.events.push({ type, round: this.round, ...payload });
  }

  /** Drain and return everything logged since the last call. */
  drain() {
    const out = this.events;
    this.events = [];
    return out;
  }

  // -- timeline ------------------------------------------------------------

  effectiveSpeed(c) {
    let speed = c.stats.speed;
    if (c.statuses.slow) speed *= 0.62;
    if (c.statuses.haste) speed *= 1.35;
    if (c.flags.startled) speed *= 1.15;
    return Math.max(1, speed);
  }

  /** Advance charge until someone is ready to act. */
  nextActor() {
    if (this.finished) return null;
    let guard = 0;
    for (;;) {
      const ready = this.combatants
        .filter((c) => c.active && !c.fainted && c.charge >= CHARGE_GOAL)
        .sort((a, b) => b.charge - a.charge || b.stats.speed - a.stats.speed);
      if (ready.length) return ready[0];

      for (const c of this.combatants) {
        if (c.active && !c.fainted) c.charge += this.effectiveSpeed(c);
      }
      if (++guard > 10000) return null; // safety valve
    }
  }

  /** Look ahead at the initiative order without mutating the battle. */
  previewTimeline(count = 6) {
    const snapshot = this.combatants
      .filter((c) => c.active && !c.fainted)
      .map((c) => ({ id: c.id, name: c.name, side: c.side, charge: c.charge, speed: this.effectiveSpeed(c) }));
    const out = [];
    let guard = 0;
    while (out.length < count && guard++ < 6000) {
      const ready = snapshot.filter((c) => c.charge >= CHARGE_GOAL).sort((a, b) => b.charge - a.charge);
      if (ready.length) {
        const actor = ready[0];
        out.push({ id: actor.id, name: actor.name, side: actor.side });
        actor.charge -= CHARGE_GOAL;
      } else {
        for (const c of snapshot) c.charge += c.speed;
      }
    }
    return out;
  }

  // -- field events --------------------------------------------------------

  onEnterField(c) {
    const passive = c.passive?.id;
    if (passive === 'softstep') {
      const allies = this.activeOf(c.side).filter((a) => a.id !== c.id);
      const weakest = allies.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
      if (weakest) this.heal(weakest, Math.round(weakest.maxHp * 0.08), `${c.name}'s Softstep`);
    }
    if (passive === 'tailwindcry') {
      for (const a of this.activeOf(c.side)) this.applyStatus(a, 'haste', 2, `${c.name}'s Tailwind Cry`);
    }
    this.log('enter', { id: c.id, name: c.name, side: c.side });
  }

  // -- actions -------------------------------------------------------------

  /**
   * Perform one action. `action` is
   *   { kind:'move', moveId, targetId } | { kind:'bond', targetId } |
   *   { kind:'switch', withId } | { kind:'flee' }
   */
  takeAction(actor, action) {
    if (this.finished) return;
    actor.charge -= CHARGE_GOAL;
    this.turnCount++;
    actor.flags.guarded = false;

    switch (action.kind) {
      case 'switch':
        this.doSwitch(actor, action.withId);
        break;
      case 'bond':
        this.doMove(actor, actor.bondSkill, action.targetId, true);
        break;
      case 'flee':
        this.log('flee', { name: actor.name });
        this.finish('fled');
        return;
      case 'move':
      default:
        this.doMove(actor, action.moveId, action.targetId, false);
        break;
    }

    this.endOfAction(actor);
  }

  doSwitch(actor, withId) {
    const incoming = this.get(withId);
    if (!incoming || incoming.fainted || incoming.active) {
      this.log('fizzle', { name: actor.name, reason: 'cannot switch' });
      return;
    }
    actor.active = false;
    incoming.active = true;
    incoming.charge = CHARGE_GOAL * 0.35;
    this.log('switch', { out: actor.name, in: incoming.name, side: actor.side });
    this.onEnterField(incoming);
  }

  doMove(actor, moveId, targetId, isBond) {
    const move = MOVES[moveId];
    if (!move) {
      this.log('fizzle', { name: actor.name, reason: 'no such move' });
      return;
    }
    if (isBond) {
      if (actor.flags.bondUsed) {
        this.log('fizzle', { name: actor.name, reason: 'Bond Skill already used' });
        return;
      }
      actor.flags.bondUsed = true;
    } else if (move.cost > actor.stamina) {
      this.log('tired', { name: actor.name, move: move.name });
      actor.stamina = Math.min(actor.maxStamina, actor.stamina + 14);
      return;
    } else {
      // Low Stability makes a Kinbeast's own abilities cost more to hold together.
      const strain = actor.ref.stability < 55 ? 1.25 : 1;
      actor.stamina -= Math.round(move.cost * strain);
    }

    this.log('move', { actor: actor.name, actorId: actor.id, side: actor.side, move: move.name, bond: isBond });

    const targets = this.resolveTargets(actor, move, targetId);
    if (!targets.length) {
      this.log('fizzle', { name: actor.name, reason: 'no valid target' });
      return;
    }

    if (move.effect?.guardUp) {
      actor.flags.guarded = true;
      actor.flags.curlguardReady = actor.passive?.id === 'curlguard';
      this.log('guard', { name: actor.name });
      return;
    }

    for (const target of targets) {
      this.applyMoveTo(actor, target, move, isBond);
      if (this.finished) return;
    }
  }

  resolveTargets(actor, move, targetId) {
    const enemySide = actor.side === 'player' ? 'foe' : 'player';
    switch (move.target) {
      case 'self':
        return [actor];
      case 'ally': {
        const chosen = targetId ? this.get(targetId) : null;
        if (chosen && chosen.side === actor.side && !chosen.fainted && chosen.active) return [chosen];
        return [this.activeOf(actor.side).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0] ?? actor];
      }
      case 'allAllies':
        return this.activeOf(actor.side);
      case 'allEnemies':
        return this.activeOf(enemySide);
      case 'enemy':
      default: {
        const chosen = targetId ? this.get(targetId) : null;
        if (chosen && chosen.side === enemySide && !chosen.fainted && chosen.active) {
          return [this.redirect(chosen, actor)];
        }
        const fallback = this.activeOf(enemySide)[0];
        return fallback ? [this.redirect(fallback, actor)] : [];
      }
    }
  }

  /** Protective allies may step in front of a weaker target. */
  redirect(target, attacker) {
    if (target.hp / target.maxHp > 0.45) return target;
    const protector = this.activeOf(target.side).find(
      (c) =>
        c.id !== target.id &&
        !c.fainted &&
        c.temperament.includes('protective') &&
        c.hp / c.maxHp > 0.35 &&
        this.rng.chance(0.4)
    );
    if (protector) {
      this.log('reaction', { name: protector.name, reaction: REACTIONS.protective.name, detail: `steps in front of ${target.name}` });
      return protector;
    }
    return target;
  }

  applyMoveTo(actor, target, move, isBond) {
    const eff = move.effect ?? {};

    if (move.kind === 'heal') {
      const amount = Math.round((eff.heal ?? 0) * (1 + actor.stats.focus / 220));
      this.heal(target, amount, move.name);
      if (eff.cleanse) this.cleanse(target, eff.cleanse);
      if (actor.passive?.id === 'clearwater' && target.side === actor.side) this.cleanse(target, 1);
    }

    if (eff.guardBuff && target === actor) this.applyStatus(actor, 'guardBuff', eff.guardBuff, move.name);
    if (eff.guardBuffTeam) this.applyStatus(target, 'guardBuff', eff.guardBuffTeam, move.name);
    if (eff.powerUp) this.applyStatus(actor, 'powerUp', eff.powerUp, move.name);
    if (eff.hasteTeam) this.applyStatus(target, 'haste', eff.hasteTeam, move.name);
    if (eff.focusTeam) this.applyStatus(target, 'focusUp', eff.focusTeam, move.name);

    if (move.power > 0) {
      const hit = this.rollAccuracy(actor, target, move);
      if (!hit) {
        this.log('miss', { actor: actor.name, target: target.name });
        return;
      }
      const { damage, mult, crit } = this.computeDamage(actor, target, move, isBond);
      this.damage(target, damage, { source: actor, move, mult, crit });
      if (this.finished) return;
      if (eff.burn && this.rng.chance(eff.burn)) this.applyStatus(target, 'burn', 3, move.name);
      if (eff.slow) this.applyStatus(target, 'slow', eff.slow, move.name);
      if (eff.blind) this.applyStatus(target, 'blind', eff.blind, move.name);
      this.maybeCounter(target, actor, move);
    } else if (move.kind === 'status' && eff.blind) {
      this.applyStatus(target, 'blind', eff.blind, move.name);
    }
  }

  rollAccuracy(actor, target, move) {
    let acc = move.acc;
    if (actor.statuses.blind) acc -= 0.22;
    if (actor.flags.measured) acc += Math.min(0.15, actor.flags.measured * 0.05);
    if (target.temperament.includes('playful') && this.rng.chance(0.12)) {
      this.log('reaction', { name: target.name, reaction: REACTIONS.playful.name, detail: 'slips the attack' });
      return false;
    }
    acc += (actor.stats.focus - target.stats.speed) / 900;
    return this.rng.chance(Math.max(0.35, Math.min(0.99, acc)));
  }

  computeDamage(actor, target, move, isBond) {
    const physical = move.kind === 'physical';
    let atk = physical ? actor.stats.power : actor.stats.focus;
    let def = physical ? target.stats.guard : target.stats.resolve;

    if (actor.statuses.powerUp) atk *= 1.25;
    if (actor.statuses.focusUp && !physical) atk *= 1.2;
    if (target.statuses.guardBuff) def *= 1.3;
    if (target.flags.guarded) def *= 2;

    // Passives.
    if (actor.passive?.id === 'flashkindle' && actor.flags.firstAttack && actor.charge >= target.charge) {
      atk *= 1.3;
      this.log('passive', { name: actor.name, passive: 'Flashkindle' });
    }
    if (actor.passive?.id === 'curlguard' && actor.flags.curlguardReady && physical) {
      atk *= 1.35;
      actor.flags.curlguardReady = false;
      this.log('passive', { name: actor.name, passive: 'Curlguard' });
    }

    // Temperament reactions that colour the numbers.
    if (actor.temperament.includes('bold') && target.hp / target.maxHp > 0.7) atk *= 1.1;
    if (actor.temperament.includes('territorial') && actor.index === 0) atk *= 1.08;
    if (actor.temperament.includes('social') && this.activeOf(actor.side).length === 3) atk *= 1.05;

    const mult = move.affinity ? effectiveness(move.affinity, target.affinities) : 1;
    const stab = move.affinity && actor.affinities.includes(move.affinity) ? 1.2 : 1;
    const crit = this.rng.chance(0.05 + actor.stats.focus / 3000);
    const variance = this.rng.range(0.9, 1.1);
    const levelFactor = (actor.ref.level * 2) / 45 + 1.2;

    let damage = ((move.power * levelFactor * atk) / (def + 55)) * mult * stab * variance;
    if (crit) damage *= 1.55;
    if (isBond) damage *= 1.25;
    // Low Vigor means a body that does not hold up under real pressure.
    damage *= 1 + Math.max(0, 55 - target.ref.vigor) / 400;

    actor.flags.firstAttack = false;
    return { damage: Math.max(1, Math.round(damage)), mult, crit };
  }

  maybeCounter(target, attacker, move) {
    if (target.fainted || move.kind !== 'physical') return;
    if (!target.temperament.includes('aggressive')) return;
    if (!this.rng.chance(0.3)) return;
    const counter = Math.max(1, Math.round((target.stats.power * 0.5 * 1.4) / (attacker.stats.guard / 55 + 1)));
    this.log('reaction', { name: target.name, reaction: REACTIONS.aggressive.name, detail: `strikes back at ${attacker.name}` });
    this.damage(attacker, counter, { source: target, move: MOVES.strike, mult: 1, crit: false });
  }

  // -- state changes -------------------------------------------------------

  heal(target, amount, source) {
    if (target.fainted || amount <= 0) return;
    const before = target.hp;
    target.hp = Math.min(target.maxHp, target.hp + amount);
    this.log('heal', { target: target.name, targetId: target.id, amount: target.hp - before, source });
  }

  damage(target, amount, meta = {}) {
    if (target.fainted) return;
    target.hp = Math.max(0, target.hp - amount);
    this.log('damage', {
      target: target.name,
      targetId: target.id,
      amount,
      mult: meta.mult ?? 1,
      crit: meta.crit ?? false,
      source: meta.source?.name,
      move: meta.move?.name,
    });

    if (this.config.objective === 'calm' && target.side === 'foe') {
      this.calmProgress = Math.min(100, this.calmProgress + (amount / target.maxHp) * 120);
    }

    if (target.hp === 0) this.faint(target);
    this.checkEnd();
  }

  faint(target) {
    target.fainted = true;
    target.active = false;
    this.log('faint', { name: target.name, side: target.side, id: target.id });
    // A reserve steps up automatically.
    const reserve = this.reservesOf(target.side)[0];
    if (reserve) {
      reserve.active = true;
      reserve.charge = CHARGE_GOAL * 0.25;
      this.onEnterField(reserve);
    }
  }

  applyStatus(target, key, rounds, source) {
    if (target.fainted) return;
    if (key === 'burn' || key === 'slow' || key === 'blind') {
      // Resolve gives a chance to shrug off conditions outright.
      if (this.rng.chance(Math.min(0.4, target.stats.resolve / 400))) {
        this.log('resist', { name: target.name, status: key });
        return;
      }
    }
    target.statuses[key] = Math.max(target.statuses[key] ?? 0, rounds);
    this.log('status', { target: target.name, targetId: target.id, status: key, rounds, source });
  }

  cleanse(target, count) {
    const bad = ['burn', 'slow', 'blind'].filter((k) => target.statuses[k]);
    for (const key of bad.slice(0, count)) {
      delete target.statuses[key];
      this.log('cleanse', { target: target.name, status: key });
    }
  }

  // -- round bookkeeping ---------------------------------------------------

  endOfAction(actor) {
    if (this.finished) return;
    actor.stamina = Math.min(actor.maxStamina, actor.stamina + 6);
    if (actor.temperament.includes('patient')) actor.flags.measured = (actor.flags.measured ?? 0) + 1;
    if (actor.temperament.includes('independent') && this.activeOf(actor.side).length === 1) {
      actor.stamina = Math.min(actor.maxStamina, actor.stamina + 6);
    }

    // A full round has passed once everyone active has had roughly one turn.
    const activeCount = Math.max(1, this.activeOf('player').length + this.activeOf('foe').length);
    if (this.turnCount % activeCount === 0) this.endOfRound();
  }

  endOfRound() {
    this.round++;
    for (const c of this.combatants) {
      if (c.fainted || !c.active) continue;
      if (c.statuses.burn) {
        const tick = Math.max(1, Math.round(c.maxHp * 0.05));
        this.log('burnTick', { name: c.name });
        this.damage(c, tick, { move: { name: 'Burn' } });
        if (this.finished) return;
      }
      for (const key of Object.keys(c.statuses)) {
        c.statuses[key] -= 1;
        if (c.statuses[key] <= 0) delete c.statuses[key];
      }
      if (c.passive?.id === 'warmglow' && this.round % 3 === 0) {
        for (const ally of this.activeOf(c.side)) this.heal(ally, Math.round(ally.maxHp * 0.06), 'Warm Glow');
      }
      if (c.temperament.includes('nervous') && !c.flags.startled && c.hp / c.maxHp < 0.6) {
        c.flags.startled = true;
        this.log('reaction', { name: c.name, reaction: REACTIONS.nervous.name, detail: 'quickens' });
      }
    }
    this.log('round', { round: this.round });

    if (this.config.objective === 'protect') {
      this.nestHp -= this.activeOf('foe').length * 4;
      if (this.nestHp <= 0) this.finish('lose');
    }
    this.checkEnd();
  }

  checkEnd() {
    if (this.finished) return;
    if (!this.standing('player').length) return this.finish('lose');
    if (!this.standing('foe').length) return this.finish('win');
    if (this.config.objective === 'survive' && this.round > this.config.rounds) return this.finish('win');
    if (this.config.objective === 'calm' && this.calmProgress >= 100) return this.finish('win');
  }

  finish(outcome) {
    if (this.finished) return;
    this.finished = true;
    this.outcome = outcome;
    this.log('end', { outcome });
  }

  // -- opponent AI ---------------------------------------------------------

  /** Pick a reasonable action for a non-player combatant. */
  autoAction(actor) {
    const enemySide = actor.side === 'player' ? 'foe' : 'player';
    const foes = this.activeOf(enemySide);
    const allies = this.activeOf(actor.side);
    const hurtAlly = allies.sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];

    // Heal when someone is badly hurt and a heal is available.
    if (hurtAlly && hurtAlly.hp / hurtAlly.maxHp < 0.4) {
      const heal = actor.moves.find((m) => MOVES[m]?.kind === 'heal' && MOVES[m].cost <= actor.stamina);
      if (heal) return { kind: 'move', moveId: heal, targetId: hurtAlly.id };
    }

    // Otherwise pick the highest expected damage against the softest target.
    let best = null;
    for (const moveId of actor.moves) {
      const move = MOVES[moveId];
      if (!move || move.cost > actor.stamina) continue;
      if (move.power <= 0) {
        const score = move.kind === 'status' ? 20 : 0;
        if (!best || score > best.score) best = { score, action: { kind: 'move', moveId, targetId: foes[0]?.id } };
        continue;
      }
      for (const foe of foes) {
        const mult = move.affinity ? effectiveness(move.affinity, foe.affinities) : 1;
        const stab = move.affinity && actor.affinities.includes(move.affinity) ? 1.2 : 1;
        const soft = 1 + (1 - foe.hp / foe.maxHp) * 0.5;
        const score = move.power * mult * stab * soft * move.acc;
        if (!best || score > best.score) best = { score, action: { kind: 'move', moveId, targetId: foe.id } };
      }
    }
    if (best) return best.action;

    // Nothing affordable — brace and recover.
    return { kind: 'move', moveId: 'guard', targetId: actor.id };
  }
}

export function summariseOutcome(battle) {
  return {
    outcome: battle.outcome,
    rounds: battle.round,
    survivors: battle.standing('player').map((c) => ({ id: c.id, hp: c.hp, maxHp: c.maxHp })),
    defeated: battle.side('foe').filter((c) => c.fainted).length,
  };
}
