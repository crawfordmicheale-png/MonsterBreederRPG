// The game state and every operation that changes it.
//
// The UI never mutates state directly — it calls methods here and re-renders.

import { RNG } from './rng.js';
import {
  makeKinbeast,
  makeWildKinbeast,
  computeStats,
  grantXp,
  addBond,
  healFully,
  defaultMoveset,
  seedIdCounter,
  stageForLevel,
  nextId,
} from './kinbeast.js';
import { createWildGenome, expressGenome, STAT_KEYS } from '../genetics/genome.js';
import {
  conceive,
  checkCompatibility,
  relatedness,
  computeVigor,
} from '../genetics/breeding.js';
import { getSpecies, SPECIES } from '../data/species.js';
import { HABITATS, PROJECTS, projectById } from '../data/sanctuary.js';
import { REGIONS, RESOURCES, siteById, availableSites } from '../data/regions.js';
import { CHAPTERS } from '../data/story.js';
import { ECHOES, FRAGMENTS, reconstructable } from '../data/echoes.js';

export const SAVE_KEY = 'broodkeepers-oath-save-v1';
const SAVE_VERSION = 1;

export const APTITUDES = {
  handler: { id: 'handler', name: 'Handler', desc: 'Wild Kinbeasts give ground faster, and you read temperaments early.' },
  breeder: { id: 'breeder', name: 'Breeder', desc: 'You see more before a pairing, and sanctuary projects cost less effort.' },
  warden:  { id: 'warden',  name: 'Warden',  desc: 'Expeditions bring back more, and rare encounters find you.' },
};

export class Game {
  constructor(save = null) {
    if (save) this.load(save);
    else this.newGame();
  }

  // -- lifecycle -----------------------------------------------------------

  newGame(profile = {}) {
    this.version = SAVE_VERSION;
    this.rng = new RNG((Date.now() ^ 0x9e3779b9) >>> 0);
    this.keeper = {
      name: profile.name ?? 'Briarhold',
      aptitude: profile.aptitude ?? 'handler',
      rank: 1,
    };
    this.roster = [];
    this.eggs = [];
    this.resources = { meadow_herb: 2, soft_reed: 1, river_stone: 1 };
    this.facilities = { nursery: 0, hatchery: 0, archive: 0, echoHall: 0, clinic: 0, trainingYard: 0 };
    this.habitatsUnlocked = ['meadow'];
    this.habitats = { meadow: { ...HABITATS.meadow } };
    this.flags = {};
    this.seals = [];
    this.completedProjects = [];
    this.completedEchoes = [];
    this.lineages = {};
    this.echoryxId = null;
    this.chapterIndex = 0;
    this.beatIndex = 0;
    this.activityCount = 0;
    this.journal = [];
    this.stats = { battlesWon: 0, battlesLost: 0, eggsLaid: 0, eggsHatched: 0, bondsFormed: 0, expeditions: 0 };
    this.pending = null; // an in-progress encounter or battle, held by the UI
    this.team = [];
    return this;
  }

  configureKeeper(profile) {
    this.keeper = { ...this.keeper, ...profile };
  }

  // -- journal -------------------------------------------------------------

  note(text) {
    this.journal.unshift({ text, at: this.activityCount });
    if (this.journal.length > 120) this.journal.pop();
  }

  // -- roster --------------------------------------------------------------

  lookup = (id) => this.roster.find((b) => b.id === id);

  get echoryx() {
    return this.lookup(this.echoryxId);
  }

  /** Everything except Echoryx, who is a story companion rather than stock. */
  get breedable() {
    return this.roster.filter((b) => b.id !== this.echoryxId && (b.stage === 'adult' || b.stage === 'elder'));
  }

  addBeast(beast) {
    this.roster.push(beast);
    this.assignHabitat(beast);
    if (this.team.length < 6 && beast.stage !== 'hatchling') this.team.push(beast.id);
    return beast;
  }

  removeBeast(id) {
    this.roster = this.roster.filter((b) => b.id !== id);
    this.team = this.team.filter((t) => t !== id);
  }

  assignHabitat(beast) {
    const preferred = getSpecies(beast.speciesId).habitat;
    beast.habitat = this.habitatsUnlocked.includes(preferred) ? preferred : this.habitatsUnlocked[0];
  }

  occupantsOf(habitatId) {
    return this.roster.filter((b) => b.habitat === habitatId);
  }

  unlockHabitat(id) {
    if (this.habitatsUnlocked.includes(id)) return;
    this.habitatsUnlocked.push(id);
    this.habitats[id] = { ...HABITATS[id] };
    for (const beast of this.roster) {
      if (getSpecies(beast.speciesId).habitat === id) beast.habitat = id;
    }
  }

  /** Active battle team, in order. */
  get activeTeam() {
    return this.team.map((id) => this.lookup(id)).filter(Boolean).filter((b) => b.stage !== 'hatchling');
  }

  setTeam(ids) {
    this.team = ids.slice(0, 6);
  }

  // -- story ---------------------------------------------------------------

  get chapter() {
    return CHAPTERS[this.chapterIndex] ?? null;
  }

  get beat() {
    return this.chapter?.beats[this.beatIndex] ?? null;
  }

  /** Advance past the current beat. Scenes call this on dismissal. */
  advanceBeat() {
    const chapter = this.chapter;
    if (!chapter) return;
    this.beatIndex++;
    if (this.beatIndex >= chapter.beats.length) {
      this.chapterIndex++;
      this.beatIndex = 0;
    }
    this.enterCurrentBeat();
  }

  enterCurrentBeat() {
    const beat = this.beat;
    if (beat?.onEnter) beat.onEnter(this);
  }

  /** Called after any state change — auto-completes satisfied objectives. */
  checkStory() {
    let guard = 0;
    while (guard++ < 20) {
      const beat = this.beat;
      if (!beat) return;
      if (beat.kind === 'objective' && beat.done(this)) {
        this.note(`Objective complete: ${beat.title}.`);
        this.advanceBeat();
        continue;
      }
      return;
    }
  }

  grantEchoryx() {
    if (this.echoryxId) return this.echoryx;
    // Echoryx uses the Mossbun body template in the slice — its adaptive form
    // is a late-game system, but its markings already drift toward its bonds.
    const genome = createWildGenome('mossbun', this.rng);
    genome.loci.colorPrimary = [
      { v: { h: 268, s: 22, l: 62 }, dom: 2 },
      { v: { h: 190, s: 30, l: 70 }, dom: 1 },
    ];
    genome.loci.colorAccent = [
      { v: { h: 300, s: 62, l: 70 }, dom: 2 },
      { v: { h: 45, s: 70, l: 74 }, dom: 1 },
    ];
    genome.loci.pattern = [{ v: 'luminous', dom: 3 }, { v: 'spots', dom: 1 }];
    const beast = makeKinbeast({
      genome,
      name: 'Echoryx',
      rng: this.rng,
      level: 5,
      origin: 'story',
      vigor: 88,
      stability: 92,
      bond: 60,
      generation: 1,
    });
    beast.isEchoryx = true;
    beast.notes.push('Hatched from the sealed chamber beneath the Briarhold nursery.');
    this.echoryxId = beast.id;
    this.addBeast(beast);
    this.note('Echoryx hatched.');
    return beast;
  }

  giveFragment(beastId, fragmentId) {
    const beast = this.lookup(beastId);
    if (!beast || !FRAGMENTS[fragmentId]) return;
    if (!beast.genome.echoes.includes(fragmentId)) {
      beast.genome.echoes.push(fragmentId);
      this.note(`${beast.name} carries a new Echo fragment: ${FRAGMENTS[fragmentId].name}.`);
    }
  }

  // -- resources & projects ------------------------------------------------

  addResource(id, n = 1) {
    this.resources[id] = (this.resources[id] ?? 0) + n;
  }

  canAfford(cost) {
    return Object.entries(cost ?? {}).every(([k, v]) => (this.resources[k] ?? 0) >= v);
  }

  spend(cost) {
    for (const [k, v] of Object.entries(cost ?? {})) this.resources[k] -= v;
  }

  availableProjects() {
    return PROJECTS.filter((p) => !this.completedProjects.includes(p.id) && p.available(this));
  }

  runProject(id) {
    const project = projectById(id);
    if (!project || this.completedProjects.includes(id)) return { ok: false, reason: 'Not available.' };
    if (!project.available(this)) return { ok: false, reason: 'Not available yet.' };
    if (!this.canAfford(project.cost)) return { ok: false, reason: 'Not enough materials.' };
    this.spend(project.cost);
    this.completedProjects.push(id);
    project.apply(this);
    // Sanctuary work is an activity: eggs develop while you build.
    const effort = this.keeper.aptitude === 'breeder' ? Math.max(1, project.effort - 1) : project.effort;
    this.completeActivity('project', effort);
    this.checkStory();
    return { ok: true, project };
  }

  // -- activities & incubation ---------------------------------------------

  /**
   * Every meaningful action advances the world a little. Eggs develop through
   * completed activities rather than real-world time — no timers, ever.
   */
  completeActivity(kind, weight = 1) {
    this.activityCount += weight;
    const hatched = [];
    for (const egg of this.eggs) {
      egg.progress += weight * (this.facilities.hatchery ? 1.6 : 1);
      if (egg.progress >= egg.needed) hatched.push(egg);
    }
    for (const egg of hatched) this.hatch(egg.id);
    this.recoverSanctuary(weight);
    return hatched;
  }

  recoverSanctuary(weight) {
    for (const beast of this.roster) {
      beast.stress = Math.max(0, beast.stress - weight * (this.facilities.clinic ? 4 : 2));
      if (this.facilities.clinic) {
        const stats = computeStats(beast);
        beast.hpLost = Math.max(0, beast.hpLost - Math.round(stats.maxHp * 0.08 * weight));
      }
      // Habitat life: neighbours slowly get to know each other.
      const neighbours = this.occupantsOf(beast.habitat).filter((o) => o.id !== beast.id);
      const other = neighbours[Math.floor(this.rng.next() * neighbours.length)];
      if (other) {
        const compatible = beast.phenotype.temperament.some((t) => other.phenotype.temperament.includes(t));
        const delta = compatible ? 2 : this.rng.chance(0.75) ? 1 : -1;
        beast.relationships[other.id] = Math.max(-40, Math.min(100, (beast.relationships[other.id] ?? 0) + delta));
        other.relationships[beast.id] = beast.relationships[other.id];
      }
    }
  }

  // -- exploration ---------------------------------------------------------

  sitesIn(regionId) {
    return availableSites(regionId, this.flags);
  }

  /**
   * Run an expedition. Returns resources found and, usually, an encounter.
   * The encounter itself is driven by the bonding module in the UI layer.
   */
  explore(regionId, siteId) {
    const site = siteById(regionId, siteId);
    if (!site) return null;
    this.stats.expeditions++;

    const warden = this.keeper.aptitude === 'warden';
    const found = [];
    const draws = warden ? 3 : 2;
    for (let i = 0; i < draws; i++) {
      if (this.rng.chance(0.72)) {
        const id = this.rng.pick(site.resources);
        this.addResource(id, 1);
        found.push(RESOURCES[id]);
      }
    }

    // Everyone who came along gets a little experience and a little bond.
    const party = this.activeTeam.slice(0, 3);
    const growth = [];
    for (const beast of party) {
      const res = grantXp(beast, 26 + Math.round(this.rng.range(0, 12)));
      addBond(beast, 2);
      beast.moves = beast.moves.length ? beast.moves : defaultMoveset(beast);
      if (res.levels.length || res.staged) growth.push({ beast, res });
    }

    const entry = this.rng.weighted(site.encounters, site.encounters.map((e) => e.weight));
    const level = this.rng.int(entry.level[0], entry.level[1]);
    const wild = makeWildKinbeast(entry.species, this.rng, level);

    this.completeActivity('expedition', 2);
    this.checkStory();

    return { site, found, wild, growth };
  }

  /** Accept a Concord Mark from a wild Kinbeast. */
  formConcord(wild) {
    wild.origin = 'wild';
    wild.bond = 20;
    this.addBeast(wild);
    this.stats.bondsFormed++;
    this.note(`${wild.name} the ${getSpecies(wild.speciesId).name} accepted a Concord Mark.`);
    this.completeActivity('bond', 1);
    this.checkStory();
    return wild;
  }

  // -- battle results ------------------------------------------------------

  recordBattle(battle, { xp = 60, isTrial = false, trialId = null } = {}) {
    const won = battle.outcome === 'win';
    if (won) this.stats.battlesWon++;
    else this.stats.battlesLost++;

    const growth = [];
    for (const c of battle.side('player')) {
      const beast = this.lookup(c.id);
      if (!beast) continue;
      beast.hpLost = Math.max(0, c.maxHp - c.hp);
      beast.stress = Math.min(100, beast.stress + (c.fainted ? 22 : 8));
      if (won) {
        const share = c.fainted ? 0.5 : 1;
        const res = grantXp(beast, Math.round(xp * share));
        addBond(beast, c.fainted ? 1 : 3);
        beast.battlesWon += c.fainted ? 0 : 1;
        if (res.levels.length || res.staged || res.learned.length) growth.push({ beast, res });
      } else {
        addBond(beast, 1);
      }
    }

    if (won && isTrial && trialId && !this.seals.includes(trialId)) {
      this.seals.push(trialId);
      this.keeper.rank++;
      this.note(`Concord Seal earned: ${trialId}.`);
    }

    this.completeActivity('battle', won ? 2 : 1);
    this.checkStory();
    return { won, growth };
  }

  // -- training ------------------------------------------------------------

  train(beastId, stat) {
    const beast = this.lookup(beastId);
    if (!beast) return { ok: false, reason: 'No such Kinbeast.' };
    if (!this.facilities.trainingYard) return { ok: false, reason: 'The Training Yard is not built.' };
    if (beast.stage === 'hatchling') return { ok: false, reason: `${beast.name} is too young to train.` };
    if (!STAT_KEYS.includes(stat)) return { ok: false, reason: 'Unknown statistic.' };

    // Training pushes toward genetic potential and then stops. Level alone
    // cannot create the perfect Kinbeast.
    const cap = Math.round(beast.phenotype.aptitudes[stat] * 100);
    if (beast.training[stat] >= cap) {
      return { ok: false, reason: `${beast.name} has reached its natural ${stat} potential.` };
    }
    const gain = Math.min(cap - beast.training[stat], 6 + Math.round(this.rng.range(0, 5)));
    beast.training[stat] += gain;
    addBond(beast, 1.5);
    beast.stress = Math.min(100, beast.stress + 4);
    const res = grantXp(beast, 18);
    this.completeActivity('training', 1);
    this.checkStory();
    return { ok: true, gain, cap, res, beast, stat };
  }

  mentor(elderId, studentId) {
    const elder = this.lookup(elderId);
    const student = this.lookup(studentId);
    if (!elder || !student || elder.stage !== 'elder') return { ok: false, reason: 'Needs an Elder mentor.' };
    const teachable = (elder.moves ?? []).filter(
      (m) => !student.moves.includes(m) && student.moves.length < 4
    );
    student.mentor = elder.id;
    let taught = null;
    if (teachable.length) {
      taught = teachable[0];
      student.moves.push(taught);
    }
    grantXp(student, 40);
    addBond(student, 3);
    this.completeActivity('mentor', 1);
    return { ok: true, taught, elder, student };
  }

  // -- breeding ------------------------------------------------------------

  compatibility(a, b) {
    return checkCompatibility(a, b, {
      lookup: this.lookup,
      nurseryBuilt: this.facilities.nursery >= 1,
      crossSpeciesUnlocked: Boolean(this.flags.cross_species_unlocked),
    });
  }

  hasCompatiblePair() {
    const pool = this.breedable;
    for (let i = 0; i < pool.length; i++) {
      for (let j = i + 1; j < pool.length; j++) {
        if (this.compatibility(pool[i], pool[j]).ok) return true;
      }
    }
    return false;
  }

  /** Produce an egg. The genome is fixed here, not at hatching. */
  breed(formParentId, traitParentId, opts = {}) {
    const form = this.lookup(formParentId);
    const trait = this.lookup(traitParentId);
    const compat = this.compatibility(form, trait);
    if (!compat.ok) return { ok: false, reason: compat.issues[0], compat };

    const r = relatedness(form, trait, this.lookup);
    const { genome, mutations, vigor, stability } = conceive(form, trait, this.rng, {
      relatedness: r,
      catalyst: opts.catalyst,
      guaranteedEchoes: opts.guaranteedEchoes,
    });

    const generation = Math.max(form.generation, trait.generation) + 1;
    const needed = Math.round(10 * (1 / getSpecies(genome.species).fertility) + generation);
    const egg = {
      id: nextId('egg'),
      genome,
      parents: [form.id, trait.id],
      parentNames: [form.name, trait.name],
      generation,
      progress: 0,
      needed,
      mutations,
      vigor,
      stability,
      lineage: form.lineage ?? trait.lineage ?? null,
      laidAt: this.activityCount,
    };
    this.eggs.push(egg);
    form.eggsProduced++;
    trait.eggsProduced++;
    form.stress = Math.min(100, form.stress + 10);
    trait.stress = Math.min(100, trait.stress + 10);
    this.stats.eggsLaid++;
    this.note(`${form.name} and ${trait.name} produced an egg.`);
    this.completeActivity('breeding', 1);
    this.checkStory();
    return { ok: true, egg, mutations };
  }

  hatch(eggId) {
    const index = this.eggs.findIndex((e) => e.id === eggId);
    if (index === -1) return null;
    const egg = this.eggs.splice(index, 1)[0];
    const beast = makeKinbeast({
      genome: egg.genome,
      rng: this.rng,
      level: 1,
      parents: egg.parents,
      generation: egg.generation,
      origin: 'bred',
      vigor: egg.vigor,
      stability: egg.stability,
      bond: 25,
      lineage: egg.lineage,
    });
    beast.notes.push(`Hatched at Briarhold. Out of ${egg.parentNames[0]} by ${egg.parentNames[1]}.`);
    this.addBeast(beast);
    this.stats.eggsHatched++;
    this.note(`An egg hatched: ${beast.name}, generation ${beast.generation}.`);
    if (egg.mutations.length) {
      for (const m of egg.mutations) this.note(`Mutation — ${m}.`);
    }
    this.checkStory();
    return { beast, mutations: egg.mutations };
  }

  nameLineage(beastId, name) {
    const beast = this.lookup(beastId);
    if (!beast) return false;
    const id = name.toLowerCase().replace(/\s+/g, '_');
    this.lineages[id] = { id, name, founder: beast.id, foundedAt: this.activityCount };
    // The whole descending line takes the name.
    const tag = (b) => {
      b.lineage = id;
      for (const child of this.roster) {
        if (child.parents?.includes(b.id) && child.lineage !== id) tag(child);
      }
    };
    tag(beast);
    this.note(`Bloodline named: ${name}.`);
    return true;
  }

  lineageMembers(lineageId) {
    return this.roster.filter((b) => b.lineage === lineageId);
  }

  // -- echoes --------------------------------------------------------------

  echoStatus() {
    return reconstructable(this.roster, this.completedEchoes);
  }

  reconstructEcho(echoId) {
    const echo = ECHOES[echoId];
    if (!echo || this.completedEchoes.includes(echoId)) return { ok: false };
    const status = this.echoStatus().find((s) => s.echo.id === echoId);
    if (!status?.ready) return { ok: false, reason: 'Fragments are still missing.' };
    this.completedEchoes.push(echoId);
    if (echo.reward?.flag) this.flags[echo.reward.flag] = true;
    if (echo.reward?.unlocksLineageNaming) this.flags.lineage_naming = true;
    this.note(`Echo reconstructed: ${echo.name}.`);
    this.completeActivity('echo', 1);
    this.checkStory();
    return { ok: true, echo };
  }

  // -- clinic --------------------------------------------------------------

  restAll() {
    for (const beast of this.roster) healFully(beast);
    this.completeActivity('rest', 1);
    this.note('The sanctuary rests. Everyone is back on their feet.');
    this.checkStory();
  }

  // -- pedigree ------------------------------------------------------------

  pedigree(beastId, depth = 3) {
    const build = (id, d) => {
      const beast = this.lookup(id);
      if (!beast) return null;
      if (d >= depth) return { beast, parents: [] };
      return { beast, parents: (beast.parents ?? []).map((p) => build(p, d + 1)).filter(Boolean) };
    };
    return build(beastId, 0);
  }

  descendantsOf(beastId) {
    return this.roster.filter((b) => b.parents?.includes(beastId));
  }

  // -- persistence ---------------------------------------------------------

  toJSON() {
    return {
      version: SAVE_VERSION,
      rng: this.rng.toJSON(),
      keeper: this.keeper,
      roster: this.roster.map(serialiseBeast),
      eggs: this.eggs,
      resources: this.resources,
      facilities: this.facilities,
      habitatsUnlocked: this.habitatsUnlocked,
      habitats: this.habitats,
      flags: this.flags,
      seals: this.seals,
      completedProjects: this.completedProjects,
      completedEchoes: this.completedEchoes,
      lineages: this.lineages,
      echoryxId: this.echoryxId,
      chapterIndex: this.chapterIndex,
      beatIndex: this.beatIndex,
      activityCount: this.activityCount,
      journal: this.journal,
      stats: this.stats,
      team: this.team,
    };
  }

  load(save) {
    this.newGame();
    Object.assign(this, {
      keeper: save.keeper,
      eggs: save.eggs ?? [],
      resources: save.resources ?? {},
      facilities: save.facilities ?? this.facilities,
      habitatsUnlocked: save.habitatsUnlocked ?? ['meadow'],
      habitats: save.habitats ?? { meadow: { ...HABITATS.meadow } },
      flags: save.flags ?? {},
      seals: save.seals ?? [],
      completedProjects: save.completedProjects ?? [],
      completedEchoes: save.completedEchoes ?? [],
      lineages: save.lineages ?? {},
      echoryxId: save.echoryxId ?? null,
      chapterIndex: save.chapterIndex ?? 0,
      beatIndex: save.beatIndex ?? 0,
      activityCount: save.activityCount ?? 0,
      journal: save.journal ?? [],
      stats: save.stats ?? this.stats,
      team: save.team ?? [],
    });
    this.rng = RNG.fromJSON(save.rng);
    this.roster = (save.roster ?? []).map(deserialiseBeast);
    seedIdCounter(this.roster.length + this.eggs.length + 2);
    return this;
  }

  save() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.toJSON()));
      return true;
    } catch (err) {
      console.warn('Could not save:', err);
      return false;
    }
  }

  static loadFromStorage() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (data.version !== SAVE_VERSION) return null;
      return new Game(data);
    } catch (err) {
      console.warn('Could not load save:', err);
      return null;
    }
  }

  static clearStorage() {
    localStorage.removeItem(SAVE_KEY);
  }
}

// -- (de)serialisation -------------------------------------------------------

const BEAST_FIELDS = [
  'id', 'name', 'speciesId', 'genome', 'level', 'xp', 'retired', 'stage', 'parents',
  'generation', 'origin', 'lineage', 'bond', 'stress', 'vigor', 'stability', 'training',
  'relationships', 'habitat', 'moves', 'hpLost', 'battlesWon', 'eggsProduced', 'mentor',
  'notes', 'isEchoryx',
];

function serialiseBeast(beast) {
  const out = {};
  for (const key of BEAST_FIELDS) if (beast[key] !== undefined) out[key] = beast[key];
  return out;
}

function deserialiseBeast(data) {
  const beast = { ...data };
  beast.phenotype = expressGenome(beast.genome);
  beast.stage = data.stage ?? stageForLevel(beast.level, beast.retired);
  beast.moves = data.moves?.length ? data.moves : defaultMoveset(beast);
  beast.relationships = data.relationships ?? {};
  beast.notes = data.notes ?? [];
  return beast;
}

export { serialiseBeast, deserialiseBeast };
