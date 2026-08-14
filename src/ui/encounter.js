// The wild bonding screen.

import { div, span, el, p, button, clear, labelledMeter, tag, toast } from './dom.js';
import { portrait } from './portrait.js';
import { affinityTags } from './components.js';
import { Encounter, SITUATIONS, approachesFor } from '../core/bonding.js';
import { getSpecies } from '../data/species.js';
import { personality } from '../core/kinbeast.js';
import { TENDENCIES } from '../data/temperaments.js';
import { BattleView } from './battle.js';

export class EncounterView {
  constructor(app, wild, onDone) {
    this.app = app;
    this.wild = wild;
    this.onDone = onDone;
    this.enc = new Encounter(wild, app.game.rng);
    this.root = div({ class: 'stack' });
    this.lastLine = SITUATIONS[this.enc.situation].line;
  }

  /** The shell rebuilds `main` on every render, so re-mount is the norm. */
  mount(host) {
    this.host = host;
    clear(host);
    if (this.subview) {
      this.subview.mount(host);
      return;
    }
    host.appendChild(this.root);
    this.render();
  }

  render() {
    const game = this.app.game;
    const wild = this.wild;
    const species = getSpecies(wild.speciesId);
    const per = personality(wild);
    const enc = this.enc;
    const handler = game.keeper.aptitude === 'handler';

    clear(this.root);

    this.root.appendChild(
      div(
        { class: 'spread' },
        div({}, el('p', { class: 'eyebrow' }, 'Wild encounter'), el('h2', {}, `A ${species.name}`)),
        tag(SITUATIONS[enc.situation].name, 'warn')
      )
    );

    this.root.appendChild(
      div(
        { class: 'row', style: { alignItems: 'flex-start' } },
        portrait(wild, 104, { stage: false }),
        div(
          { style: { flex: '1', minWidth: '0' } },
          div({ class: 'chip-row' }, affinityTags(wild), tag(`Lv ${wild.level}`)),
          p({ class: 'tiny', style: { marginTop: '6px' } }, species.blurb)
        )
      )
    );

    // A Handler reads temperament immediately; everyone else infers it.
    this.root.appendChild(
      div(
        { class: 'card tight stack' },
        handler
          ? div(
              {},
              div({ class: 'tiny' }, 'Handler reading:'),
              div({ style: { fontWeight: '600' } }, per.name),
              p({ class: 'tiny', style: { margin: '2px 0 0' } }, per.note)
            )
          : div(
              {},
              div({ class: 'tiny' }, 'It carries itself like something'),
              div({ style: { fontWeight: '600' } }, `${TENDENCIES[wild.phenotype.temperament[0]].name.toLowerCase()}, you think.`)
            ),
        labelledMeter('Trust', enc.trustPercent, 100, 'trust', `${enc.trustPercent}%`),
        div({ class: 'tiny' }, `${Math.max(0, enc.patience)} approach${enc.patience === 1 ? '' : 'es'} before it loses interest.`)
      )
    );

    this.root.appendChild(div({ class: 'callout' }, this.lastLine));

    if (enc.resolved === 'ready') {
      this.root.appendChild(
        div(
          { class: 'stack' },
          p({ class: 'muted' }, `The ${species.name} is waiting. Offer the Concord Mark.`),
          button('Offer the Concord Mark', {
            class: 'btn primary full',
            onclick: () => {
              enc.acceptConcord();
              game.formConcord(wild);
              toast(`${wild.name} joins Briarhold.`);
              this.app.afterChange();
              this.onDone({ bonded: true, beast: wild });
            },
          }),
          button('Leave it wild', { class: 'btn ghost full', onclick: () => this.onDone({ bonded: false }) })
        )
      );
      return;
    }

    if (enc.resolved) {
      this.root.appendChild(
        div(
          { class: 'stack' },
          p({ class: 'muted' }, enc.resolved === 'fled' ? 'It is gone into the grass and it is not coming back today.' : 'It loses interest and wanders off.'),
          button('Head home', { class: 'btn primary full', onclick: () => this.onDone({ bonded: false }) })
        )
      );
      return;
    }

    const approaches = approachesFor(enc.situation);
    this.root.appendChild(el('h3', {}, 'How do you approach it?'));
    this.root.appendChild(
      div(
        { class: 'stack' },
        approaches.map((a) => {
          const costText = a.cost
            ? Object.entries(a.cost)
                .map(([k, v]) => `${v} ${k.replace(/_/g, ' ')}`)
                .join(', ')
            : null;
          const affordable = !a.cost || game.canAfford(a.cost);
          return el(
            'button',
            {
              type: 'button',
              class: 'move-btn',
              disabled: !affordable,
              onclick: () => this.attempt(a),
            },
            span({ class: 'mn' }, a.name),
            span({ class: 'mm' }, a.blurb),
            costText ? span({ class: 'tiny' }, `costs ${costText}${affordable ? '' : ' — you have none'}`) : null
          );
        })
      )
    );

    this.root.appendChild(
      button('Leave it be', { class: 'btn ghost full', onclick: () => this.onDone({ bonded: false }) })
    );
  }

  attempt(approach) {
    const game = this.app.game;
    if (approach.triggersBattle && !this.enc.battleWon) {
      this.startHonourableBattle();
      return;
    }
    if (approach.cost) game.spend(approach.cost);
    const res = this.enc.attempt(approach.id, { aptitude: game.keeper.aptitude });
    this.lastLine = res.text;
    this.app.afterChange();
    this.render();
  }

  startHonourableBattle() {
    const game = this.app.game;
    const team = game.activeTeam.filter((b) => b.stage !== 'hatchling');
    if (!team.length) {
      toast('Nobody on your team is old enough to fight.');
      return;
    }
    this.subview = new BattleView(this.app, {
      title: `The wild ${getSpecies(this.wild.speciesId).name}`,
      subtitle: 'An honourable answer',
      playerTeam: team,
      foeTeam: [this.wild],
      objective: 'defeat',
      onEnd: (battle) => {
        this.subview = null;
        game.recordBattle(battle, { xp: 45 });
        // The wild Kinbeast is never actually harmed by the encounter — it is
        // being measured, not destroyed.
        this.wild.hpLost = 0;
        if (battle.outcome === 'win') {
          this.enc.recordBattleWin();
          const res = this.enc.attempt('battle', { aptitude: game.keeper.aptitude });
          this.lastLine = res.text;
        } else {
          this.lastLine = 'It wins, decisively, and looks almost disappointed about it.';
          this.enc.patience -= 1;
          if (this.enc.patience <= 0) this.enc.resolved = 'left';
        }
        this.app.afterChange();
      },
    });
    this.mount(this.host);
  }
}
