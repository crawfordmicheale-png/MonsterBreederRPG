// Application shell: top bar, navigation, screen routing, story scenes.

import { div, span, el, p, button, clear, tag, toast, sheet } from './dom.js';
import { sanctuaryScreen, exploreScreen, rosterScreen, breedScreen, journalScreen } from './screens.js';
import { EncounterView } from './encounter.js';
import { BattleView } from './battle.js';
import { Game, APTITUDES } from '../core/state.js';
import { RESOURCES } from '../data/regions.js';
import { trialById } from '../data/trials.js';
import { STAGE_INFO } from '../core/kinbeast.js';

const TABS = [
  { id: 'sanctuary', label: 'Sanctuary', glyph: '⌂', render: sanctuaryScreen },
  { id: 'explore',   label: 'Explore',   glyph: '❧', render: exploreScreen },
  { id: 'roster',    label: 'Roster',    glyph: '❋', render: rosterScreen },
  { id: 'breed',     label: 'Nursery',   glyph: '◍', render: breedScreen },
  { id: 'journal',   label: 'Journal',   glyph: '✎', render: journalScreen },
];

export class App {
  constructor(host) {
    this.host = host;
    this.game = null;
    this.tab = 'sanctuary';
    this.mode = 'title'; // 'title' | 'play' | 'encounter' | 'battle'
    this.sceneOpen = false;
    this.shownScene = null;
    this.breedState = { form: null, trait: null };
  }

  // -- boot ----------------------------------------------------------------

  boot() {
    const save = Game.loadFromStorage();
    if (save) {
      this.game = save;
      this.mode = 'play';
    }
    this.render();
  }

  startNewGame(profile) {
    this.game = new Game();
    this.game.configureKeeper(profile);
    this.game.note('You came back to Briarhold.');
    this.mode = 'play';
    this.tab = 'sanctuary';
    this.afterChange();
  }

  hardReset() {
    Game.clearStorage();
    this.game = null;
    this.mode = 'title';
    this.render();
  }

  /** Called after any state mutation: persist, re-check story, re-render. */
  afterChange() {
    if (this.game) {
      this.game.checkStory();
      this.game.save();
    }
    this.render();
  }

  // -- rendering -----------------------------------------------------------

  render() {
    clear(this.host);
    if (this.mode === 'title' || !this.game) {
      this.host.appendChild(this.titleScreen());
      return;
    }

    this.host.appendChild(this.topbar());
    const main = el('main', {});
    this.host.appendChild(main);

    if (this.mode === 'encounter' && this.encounterView) {
      this.encounterView.mount(main);
      return;
    }
    if (this.mode === 'battle' && this.battleView) {
      this.battleView.mount(main);
      return;
    }

    const tab = TABS.find((t) => t.id === this.tab) ?? TABS[0];
    main.appendChild(tab.render(this));
    this.host.appendChild(this.nav());
    this.maybeShowScene();
  }

  topbar() {
    const game = this.game;
    const chapter = game.chapter;
    const resources = Object.entries(game.resources).filter(([, v]) => v > 0);
    return div(
      { class: 'topbar' },
      div({ class: 'sub' }, chapter ? `Chapter ${chapter.number} · ${chapter.title}` : 'Postgame · Briarhold stands'),
      div(
        { class: 'topbar-line' },
        el('h1', {}, 'Briarhold Sanctuary'),
        div(
          { class: 'resource-strip' },
          resources.length
            ? resources.map(([k, v]) =>
                span({}, `${RESOURCES[k]?.short ?? RESOURCES[k]?.name ?? k} `, el('b', {}, v))
              )
            : span({}, 'no materials')
        )
      )
    );
  }

  nav() {
    const objectiveWaiting = this.game.beat?.kind === 'objective';
    return div(
      { class: 'nav' },
      div(
        { class: 'nav-inner' },
        TABS.map((t) =>
          el(
            'button',
            {
              type: 'button',
              class: this.tab === t.id ? 'active' : '',
              onclick: () => {
                this.tab = t.id;
                this.render();
              },
            },
            span({ class: 'glyph' }, t.glyph),
            span({}, t.label),
            t.id === 'sanctuary' && objectiveWaiting && this.tab !== 'sanctuary' ? span({ class: 'dot' }) : null
          )
        )
      )
    );
  }

  // -- title ---------------------------------------------------------------

  titleScreen() {
    let aptitude = 'handler';
    const nameInput = el('input', { type: 'text', placeholder: 'Your name', maxlength: '18', value: 'Wren Briarhold' });
    const cards = div({ class: 'stack' });

    const paint = () => {
      clear(cards);
      for (const a of Object.values(APTITUDES)) {
        cards.appendChild(
          el(
            'button',
            {
              type: 'button',
              class: `aptitude-card${aptitude === a.id ? ' selected' : ''}`,
              onclick: () => {
                aptitude = a.id;
                paint();
              },
            },
            div({ style: { fontWeight: '600' } }, a.name),
            p({ class: 'tiny', style: { margin: '2px 0 0' } }, a.desc)
          )
        );
      }
    };
    paint();

    return div(
      { class: 'title-screen' },
      div({ class: 'eyebrow' }, 'A monster-breeding RPG'),
      el('h1', {}, "The Broodkeeper's\nOath"),
      p(
        { class: 'oath' },
        'You inherit a ruined sanctuary, one egg nobody was supposed to find, and a family name that everyone in Alderreach remembers for the wrong reason.'
      ),
      el('hr', { class: 'rule' }),
      div({ class: 'eyebrow' }, 'Keeper'),
      nameInput,
      div({ class: 'eyebrow', style: { marginTop: '8px' } }, 'Keeper Aptitude'),
      cards,
      button('Return to Briarhold', {
        class: 'btn primary full',
        onclick: () => this.startNewGame({ name: nameInput.value.trim() || 'Briarhold', aptitude }),
      }),
      p({ class: 'tiny' }, 'Vertical slice — prologue and Chapter One. Progress saves to this device.')
    );
  }

  // -- story scenes --------------------------------------------------------

  maybeShowScene() {
    const beat = this.game.beat;
    if (!beat || beat.kind !== 'scene' || this.sceneOpen) return;
    const key = `${this.game.chapterIndex}:${this.game.beatIndex}`;
    if (this.shownScene === key) return;
    this.shownScene = key;
    this.showScene(beat.title, beat.scene, () => {
      this.game.advanceBeat();
      this.afterChange();
    });
  }

  /** Full-screen scene reader. Lines reveal one tap at a time. */
  showScene(title, lines, onDone) {
    this.sceneOpen = true;
    let shown = 1;
    const inner = div({ class: 'scene-inner' });
    const overlay = div({ class: 'scene-overlay' }, inner);

    const paint = () => {
      clear(inner);
      inner.appendChild(div({ class: 'scene-title' }, title));
      for (const line of lines.slice(0, shown)) {
        inner.appendChild(
          p(
            { class: `scene-line${line.who === 'narration' ? ' narration' : ''}` },
            line.who && line.who !== 'narration' ? span({ class: 'who' }, line.who) : null,
            line.text
          )
        );
      }
      const more = shown < lines.length;
      inner.appendChild(
        button(more ? 'Continue' : 'Close', {
          class: 'btn primary full',
          style: { marginTop: '10px' },
          onclick: () => {
            if (more) {
              shown++;
              paint();
            } else {
              overlay.remove();
              this.sceneOpen = false;
              onDone?.();
            }
          },
        })
      );
      if (more) {
        inner.appendChild(
          button('Skip ahead', {
            class: 'btn ghost full',
            onclick: () => {
              shown = lines.length;
              paint();
            },
          })
        );
      }
    };

    paint();
    document.body.appendChild(overlay);
  }

  // -- encounters ----------------------------------------------------------

  startEncounter(wild) {
    this.encounterView = new EncounterView(this, wild, () => {
      this.encounterView = null;
      this.mode = 'play';
      this.afterChange();
    });
    this.mode = 'encounter';
    this.render();
  }

  // -- battles -------------------------------------------------------------

  startBattle(spec) {
    this.battleView = new BattleView(this, {
      ...spec,
      onEnd: (battle) => {
        this.battleView = null;
        this.mode = 'play';
        spec.onEnd?.(battle);
      },
    });
    this.mode = 'battle';
    this.render();
  }

  startTrial(trialId) {
    const game = this.game;
    const trial = trialById(trialId);
    if (!trial) return;
    const gate = trial.entry(game);
    if (!gate.ok) return toast(gate.reason);

    this.showScene(trial.name, trial.intro, () => {
      const foeTeam = trial.buildTeam(game);
      this.startBattle({
        title: trial.name,
        subtitle: trial.master,
        playerTeam: game.activeTeam,
        foeTeam,
        objective: 'defeat',
        canFlee: false,
        onEnd: (battle) => {
          const res = game.recordBattle(battle, {
            xp: trial.reward.xp,
            isTrial: true,
            trialId: trial.seal,
          });
          if (res.won) {
            for (const [k, v] of Object.entries(trial.reward.resources ?? {})) game.addResource(k, v);
          }
          this.afterChange();
          this.showScene(trial.name, res.won ? trial.victory : trial.defeat, () => this.afterChange());
        },
      });
    });
  }
}
