// The battle screen. Drives the headless engine and renders each event.

import { div, span, el, p, button, clear, meter, tag } from './dom.js';
import { portrait } from './portrait.js';
import { Battle } from '../battle/engine.js';
import { MOVES } from '../data/moves.js';
import { effectiveness, effectivenessLabel } from '../data/affinities.js';
import { getSpecies } from '../data/species.js';

const PAUSE = 620;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export class BattleView {
  /**
   * @param {object} app
   * @param {object} spec { playerTeam, foeTeam, objective, rounds, title, subtitle, onEnd }
   */
  constructor(app, spec) {
    this.app = app;
    this.spec = spec;
    this.battle = new Battle(spec.playerTeam, spec.foeTeam, {
      objective: spec.objective ?? 'defeat',
      rounds: spec.rounds ?? 5,
      rng: app.game.rng,
    });
    this.logLines = [];
    this.awaiting = null;
    this.selectedMove = null;
    this.root = div({ class: 'battlefield' });
    this.busy = false;
    this.reactionBanner = null;
  }

  /**
   * Attach to a host element. Safe to call again after the shell re-renders —
   * the battle loop is only started once.
   */
  mount(host) {
    clear(host);
    host.appendChild(this.root);
    this.render();
    if (!this.started) {
      this.started = true;
      this.run();
    }
  }

  // -- main loop -----------------------------------------------------------

  async run() {
    while (!this.battle.finished) {
      const actor = this.battle.nextActor();
      if (!actor) break;
      this.acting = actor;
      this.render();

      let action;
      if (actor.side === 'player') {
        action = await this.awaitPlayerAction(actor);
      } else {
        await sleep(PAUSE * 0.75);
        action = this.battle.autoAction(actor);
      }

      this.battle.takeAction(actor, action);
      this.flush();
      this.render();
      await sleep(PAUSE * 0.6);
    }
    this.acting = null;
    this.flush();
    this.render();
    await sleep(320);
    this.showResult();
  }

  awaitPlayerAction(actor) {
    return new Promise((resolve) => {
      this.awaiting = { actor, resolve };
      this.render();
    });
  }

  submit(action) {
    if (!this.awaiting) return;
    const { resolve } = this.awaiting;
    this.awaiting = null;
    this.selectedMove = null;
    resolve(action);
  }

  flush() {
    for (const ev of this.battle.drain()) {
      const line = describe(ev);
      if (line) this.logLines.push(line);
      if (ev.type === 'reaction' || ev.type === 'passive') {
        this.reactionBanner = {
          text: ev.type === 'reaction'
            ? `${ev.name} — ${ev.reaction}`
            : `${ev.name}'s ${ev.passive}`,
          detail: ev.detail ?? '',
          until: Date.now() + 1600,
        };
      }
    }
    this.logLines = this.logLines.slice(-40);
  }

  // -- rendering -----------------------------------------------------------

  render() {
    const b = this.battle;
    clear(this.root);

    this.root.appendChild(
      div(
        { class: 'spread' },
        div({}, el('p', { class: 'eyebrow' }, this.spec.subtitle ?? 'Battle'), el('h2', {}, this.spec.title ?? 'Field Battle')),
        tag(`Round ${b.round}`)
      )
    );

    if (b.config.objective !== 'defeat') {
      this.root.appendChild(div({ class: 'callout' }, objectiveText(b)));
    }

    if (this.reactionBanner && Date.now() < this.reactionBanner.until) {
      this.root.appendChild(
        div(
          { class: 'reaction-banner' },
          div({ class: 'reaction-banner-title' }, this.reactionBanner.text),
          this.reactionBanner.detail
            ? div({ class: 'tiny' }, this.reactionBanner.detail)
            : null
        )
      );
    } else {
      this.reactionBanner = null;
    }

    // Initiative timeline.
    const preview = b.previewTimeline(7);
    this.root.appendChild(
      div(
        { class: 'timeline' },
        preview.map((entry, i) =>
          div({ class: `tick ${entry.side}${i === 0 ? ' now' : ''}` }, entry.name)
        )
      )
    );

    this.root.appendChild(this.lineView('foe'));
    this.root.appendChild(
      div({ class: 'tiny', style: { textAlign: 'center', opacity: '0.7' } }, '— — —')
    );
    this.root.appendChild(this.lineView('player'));

    const log = div({ class: 'battle-log' }, this.logLines.slice(-14).map((l) => div({ html: l })));
    this.root.appendChild(log);
    log.scrollTop = log.scrollHeight;

    this.root.appendChild(this.actionBar());
  }

  lineView(side) {
    const b = this.battle;
    const active = b.combatants.filter((c) => c.side === side && c.active);
    const reserves = b.combatants.filter((c) => c.side === side && !c.active && !c.fainted);
    const targeting = this.selectedMove && side === 'foe';
    const allyTargeting = this.selectedMove && MOVES[this.selectedMove]?.target === 'ally' && side === 'player';

    return div(
      {},
      div(
        { class: 'combat-line' },
        active.map((c) => this.slotView(c, targeting || allyTargeting))
      ),
      reserves.length
        ? div(
            { class: 'chip-row', style: { marginTop: '5px' } },
            span({ class: 'tiny' }, 'Reserve:'),
            reserves.map((c) => tag(`${c.name} ${Math.round((c.hp / c.maxHp) * 100)}%`))
          )
        : null
    );
  }

  slotView(c, targetable) {
    const isActing = this.acting?.id === c.id;
    const node = div(
      {
        class: `combat-slot${c.fainted ? ' fainted' : ''}${isActing ? ' acting' : ''}${targetable && !c.fainted ? ' targetable' : ''}`,
        onclick: targetable && !c.fainted ? () => this.chooseTarget(c) : null,
      },
      portrait(c.ref, 52, { stage: false, shadow: false }),
      span({ class: 'cname' }, c.name),
      meter(c.hp, c.maxHp, `hp${c.hp / c.maxHp < 0.35 ? ' low' : ''}`),
      span({ class: 'chp' }, `${c.hp}/${c.maxHp}`),
      c.side === 'player' ? meter(c.stamina, c.maxStamina, '') : null,
      Object.keys(c.statuses).length
        ? div({ class: 'chip-row' }, Object.keys(c.statuses).map((s) => tag(s, s === 'haste' ? 'good' : 'bad')))
        : null
    );
    return node;
  }

  actionBar() {
    const waiting = this.awaiting;
    if (this.battle.finished) {
      return div({ class: 'tiny', style: { textAlign: 'center', padding: '10px' } }, 'The field goes quiet.');
    }
    if (!waiting) {
      return div({ class: 'tiny', style: { textAlign: 'center', padding: '10px' } }, '…');
    }

    const actor = waiting.actor;

    if (this.selectedMove) {
      const move = MOVES[this.selectedMove];
      return div(
        { class: 'stack' },
        div({ class: 'callout' }, `${move.name} — choose a target.`),
        button('Back', { class: 'btn small ghost', onclick: () => { this.selectedMove = null; this.render(); } })
      );
    }

    const grid = div({ class: 'move-grid' });
    for (const id of actor.moves) {
      const move = MOVES[id];
      if (!move) continue;
      const affordable = move.cost <= actor.stamina;
      const foe = this.battle.activeOf('foe')[0];
      const eff = move.affinity && foe ? effectiveness(move.affinity, foe.affinities) : 1;
      const effLabel = move.power > 0 && move.affinity ? effectivenessLabel(eff) : null;
      grid.appendChild(
        el(
          'button',
          {
            type: 'button',
            class: 'move-btn',
            disabled: !affordable,
            onclick: () => this.pickMove(id),
          },
          span({ class: 'mn' }, move.name),
          span(
            { class: 'mm' },
            [move.power > 0 ? `pow ${move.power}` : move.kind, `st ${move.cost}`, effLabel?.text]
              .filter(Boolean)
              .join(' · ')
          )
        )
      );
    }

    if (actor.bondSkill && !actor.flags.bondUsed) {
      const bond = MOVES[actor.bondSkill];
      grid.appendChild(
        el(
          'button',
          { type: 'button', class: 'move-btn bond', onclick: () => this.pickMove(actor.bondSkill, true) },
          span({ class: 'mn' }, `✦ ${bond.name}`),
          span({ class: 'mm' }, 'Bond Skill · once per battle')
        )
      );
    }

    const reserves = this.battle.reservesOf('player');
    const extra = div({ class: 'btn-row', style: { marginTop: '8px' } });
    if (reserves.length) {
      extra.appendChild(
        button('Switch', {
          class: 'btn small',
          onclick: () => this.openSwitch(reserves),
        })
      );
    }
    if (this.spec.canFlee !== false) {
      extra.appendChild(
        button('Withdraw', { class: 'btn small ghost', onclick: () => this.submit({ kind: 'flee' }) })
      );
    }

    return div(
      { class: 'stack' },
      div({ class: 'tiny' }, `${actor.name} is ready.`),
      grid,
      extra
    );
  }

  pickMove(id, isBond = false) {
    const move = MOVES[id];
    this.pendingBond = isBond;
    if (move.target === 'self' || move.target === 'allAllies' || move.target === 'allEnemies') {
      this.submit(isBond ? { kind: 'bond' } : { kind: 'move', moveId: id });
      return;
    }
    this.selectedMove = id;
    this.render();
  }

  chooseTarget(c) {
    const id = this.selectedMove;
    const isBond = this.pendingBond;
    this.selectedMove = null;
    this.submit(isBond ? { kind: 'bond', targetId: c.id } : { kind: 'move', moveId: id, targetId: c.id });
  }

  openSwitch(reserves) {
    const grid = div(
      { class: 'stack' },
      reserves.map((c) =>
        el(
          'button',
          {
            type: 'button',
            class: 'beast-row',
            onclick: () => this.submit({ kind: 'switch', withId: c.id }),
          },
          portrait(c.ref, 44, { stage: false }),
          div({ class: 'body' }, div({ class: 'nm' }, c.name), div({ class: 'sp' }, `${c.hp}/${c.maxHp} HP`))
        )
      )
    );
    clear(this.root);
    this.root.appendChild(el('h3', {}, 'Bring in'));
    this.root.appendChild(grid);
    this.root.appendChild(button('Back', { class: 'btn small ghost', onclick: () => this.render() }));
  }

  showResult() {
    const b = this.battle;
    const won = b.outcome === 'win';
    clear(this.root);
    this.root.appendChild(
      div(
        { class: 'stack' },
        el('h2', {}, won ? 'The field is yours.' : b.outcome === 'fled' ? 'You withdraw.' : 'You are beaten back.'),
        p({ class: 'muted' }, resultLine(b, this.spec)),
        button('Continue', {
          class: 'btn primary full',
          onclick: () => this.spec.onEnd?.(b),
        })
      )
    );
  }
}

function objectiveText(b) {
  switch (b.config.objective) {
    case 'survive':
      return `Hold out for ${b.config.rounds} rounds. Round ${b.round} of ${b.config.rounds}.`;
    case 'calm':
      return `Calm the Kinbeast — ${Math.round(b.calmProgress)}% settled.`;
    case 'protect':
      return `Protect the nest — ${Math.max(0, Math.round(b.nestHp))}% intact.`;
    default:
      return 'Defeat the opposing team.';
  }
}

function resultLine(b, spec) {
  if (b.outcome === 'win') {
    const standing = b.standing('player').length;
    return `${standing} of your Kinbeasts are still standing after ${b.round} rounds.`;
  }
  if (b.outcome === 'fled') return 'Everyone comes home. That counts for something.';
  return 'Nothing is lost permanently. Rest them, and come back.';
}

// ---------------------------------------------------------------------------

function describe(ev) {
  const b = (s) => `<span class="hl">${escapeHtml(s)}</span>`;
  switch (ev.type) {
    case 'move':
      return `${b(ev.actor)} uses ${ev.bond ? '✦ ' : ''}${escapeHtml(ev.move)}.`;
    case 'damage': {
      const bits = [`${b(ev.target)} takes ${ev.amount}`];
      if (ev.crit) bits.push('<span class="good">critical</span>');
      if (ev.mult >= 2) bits.push('<span class="good">devastating</span>');
      else if (ev.mult > 1) bits.push('<span class="good">effective</span>');
      else if (ev.mult < 1) bits.push('<span class="bad">resisted</span>');
      return `${bits.join(' · ')}.`;
    }
    case 'heal':
      return ev.amount > 0 ? `${b(ev.target)} recovers ${ev.amount}. <span class="tiny">(${escapeHtml(ev.source ?? '')})</span>` : null;
    case 'miss':
      return `${b(ev.actor)} misses ${escapeHtml(ev.target)}.`;
    case 'faint':
      return `<span class="bad">${escapeHtml(ev.name)} is down.</span>`;
    case 'status':
      return `${b(ev.target)} is ${escapeHtml(ev.status)} for ${ev.rounds}.`;
    case 'cleanse':
      return `${b(ev.target)} shakes off ${escapeHtml(ev.status)}.`;
    case 'resist':
      return `${b(ev.name)} resists ${escapeHtml(ev.status)}.`;
    case 'reaction':
      return `<span class="reaction-log"><span class="good">${escapeHtml(ev.name)} — ${escapeHtml(ev.reaction)}</span>: ${escapeHtml(ev.detail)}.</span>`;
    case 'passive':
      return `<span class="reaction-log"><span class="good">${escapeHtml(ev.name)}'s ${escapeHtml(ev.passive)} triggers.</span></span>`;
    case 'switch':
      return `${b(ev.out)} steps back; ${b(ev.in)} comes forward.`;
    case 'guard':
      return `${b(ev.name)} braces.`;
    case 'tired':
      return `${b(ev.name)} is too winded for ${escapeHtml(ev.move)} and catches its breath.`;
    case 'burnTick':
      return `${b(ev.name)} is burning.`;
    case 'round':
      return `<span class="tiny">— round ${ev.round} —</span>`;
    default:
      return null;
  }
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (ch) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch])
  );
}
