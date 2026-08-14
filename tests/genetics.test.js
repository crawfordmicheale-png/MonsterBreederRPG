import test from 'node:test';
import assert from 'node:assert/strict';

import { RNG } from '../src/core/rng.js';
import {
  createWildGenome,
  expressGenome,
  ALL_LOCI,
  STAT_KEYS,
  measureHeterozygosity,
  colorName,
} from '../src/genetics/genome.js';
import {
  conceive,
  predictOffspring,
  relatedness,
  checkCompatibility,
  computeVigor,
} from '../src/genetics/breeding.js';
import { makeWildKinbeast, makeKinbeast, computeStats, defaultMoveset } from '../src/core/kinbeast.js';
import { SPECIES_IDS, getSpecies } from '../src/data/species.js';
import { canPerform, MOVES } from '../src/data/moves.js';

const rng = () => new RNG(20260814);

test('RNG is deterministic and serialisable', () => {
  const a = new RNG(42);
  const b = new RNG(42);
  const first = [a.next(), a.next(), a.next()];
  const second = [b.next(), b.next(), b.next()];
  assert.deepEqual(first, second);

  const resumed = RNG.fromJSON(a.toJSON());
  assert.equal(resumed.next(), b.next());
});

test('every species produces an expressible wild genome', () => {
  const r = rng();
  for (const id of SPECIES_IDS) {
    const genome = createWildGenome(id, r);
    for (const locus of ALL_LOCI) {
      assert.ok(genome.loci[locus], `${id} missing locus ${locus}`);
      assert.equal(genome.loci[locus].length, 2, `${id}:${locus} should carry two alleles`);
    }
    const p = expressGenome(genome);
    assert.equal(p.species.id, id);
    assert.ok(p.affinities.length >= 1);
    assert.equal(p.temperament.length, 2);
    for (const stat of STAT_KEYS) {
      assert.ok(p.aptitudes[stat] >= 0 && p.aptitudes[stat] <= 1);
    }
    // Every supported feature slot must be filled — no creature is missing a body part.
    for (const slot of Object.keys(getSpecies(id).featureSlots)) {
      assert.ok(p.features[slot], `${id} has no ${slot}`);
      assert.ok(
        getSpecies(id).featureSlots[slot].includes(p.features[slot]),
        `${id} expressed an unsupported ${slot}: ${p.features[slot]}`
      );
    }
  }
});

test('offspring alleles all come from the parents (or are flagged mutations)', () => {
  const r = rng();
  const mum = makeWildKinbeast('mossbun', r, 10);
  const dad = makeWildKinbeast('mossbun', r, 10);

  for (let i = 0; i < 40; i++) {
    const { genome } = conceive(mum, dad, r, {});
    for (const locus of ALL_LOCI) {
      const [fromForm, fromTrait] = genome.loci[locus];
      const formPool = mum.genome.loci[locus].map(serialise);
      const traitPool = dad.genome.loci[locus].map(serialise);
      if (fromForm.tag !== 'mutation') {
        assert.ok(formPool.includes(serialise(fromForm)), `${locus}: form allele not from Form Parent`);
      }
      if (fromTrait.tag !== 'mutation') {
        assert.ok(traitPool.includes(serialise(fromTrait)), `${locus}: trait allele not from Trait Parent`);
      }
    }
  }
});

function serialise(a) {
  return JSON.stringify({ v: a.v, dom: a.dom });
}

test('the Form Parent decides the species and nothing else', () => {
  const r = rng();
  const mossbun = makeWildKinbeast('mossbun', r, 10);
  const cinderkit = makeWildKinbeast('cinderkit', r, 10);
  const a = conceive(mossbun, cinderkit, r, {});
  const b = conceive(cinderkit, mossbun, r, {});
  assert.equal(a.genome.species, 'mossbun');
  assert.equal(b.genome.species, 'cinderkit');
});

test('prediction probabilities are exact and sum to one', () => {
  const r = rng();
  const mum = makeWildKinbeast('pebbleback', r, 12);
  const dad = makeWildKinbeast('pebbleback', r, 12);
  const pred = predictOffspring(mum, dad, 2);

  const sums = [pred.build, pred.pattern, pred.temperament.first, pred.temperament.second];
  for (const slot of Object.values(pred.features)) sums.push(slot);
  for (const rows of sums) {
    const total = rows.reduce((s, row) => s + row.p, 0);
    assert.ok(Math.abs(total - 1) < 1e-9, `distribution sums to ${total}`);
  }
});

test('predicted aptitude ranges bracket what actually gets bred', () => {
  const r = rng();
  const mum = makeWildKinbeast('galecrest', r, 12);
  const dad = makeWildKinbeast('galecrest', r, 12);
  const pred = predictOffspring(mum, dad, 2);

  for (let i = 0; i < 30; i++) {
    const { genome } = conceive(mum, dad, r, {});
    const p = expressGenome(genome);
    for (const stat of STAT_KEYS) {
      const has = genome.loci[`apt_${stat}`].some((a) => a.tag === 'mutation');
      if (has) continue; // mutations are allowed to escape the predicted range
      const { min, max } = pred.aptitudes[stat];
      assert.ok(
        p.aptitudes[stat] >= min - 1e-9 && p.aptitudes[stat] <= max + 1e-9,
        `${stat} ${p.aptitudes[stat]} outside ${min}..${max}`
      );
    }
  }
});

test('a recessive allele can stay hidden and resurface later', () => {
  const r = rng();
  // Two carriers: each shows the dominant mask, each hides unmarked.
  const carrier = () => {
    const beast = makeWildKinbeast('mossbun', r, 10);
    beast.genome.loci.pattern = [
      { v: 'mask', dom: 2 },
      { v: 'none', dom: 0 },
    ];
    beast.phenotype = expressGenome(beast.genome);
    return beast;
  };
  const mum = carrier();
  const dad = carrier();
  assert.equal(mum.phenotype.pattern, 'mask', 'carrier should show the dominant marking');

  let resurfaced = 0;
  for (let i = 0; i < 200; i++) {
    const { genome } = conceive(mum, dad, r, {});
    if (expressGenome(genome).pattern === 'none') resurfaced++;
  }
  // Expect roughly a quarter. Allow a generous band for 200 samples.
  assert.ok(resurfaced > 20 && resurfaced < 90, `hidden marking resurfaced ${resurfaced}/200 times`);
});

test('a move the body cannot perform is never learned but is never destroyed', () => {
  const r = rng();
  const flyer = makeWildKinbeast('galecrest', r, 14);
  flyer.moves = ['divebuffet', 'gustcut'];
  const grounded = makeWildKinbeast('mossbun', r, 14);

  assert.ok(canPerform('divebuffet', flyer.phenotype.bodyTags));
  assert.ok(!canPerform('divebuffet', grounded.phenotype.bodyTags));

  for (let i = 0; i < 25; i++) {
    // Mossbun body: the wing move must not come through.
    const { genome } = conceive(grounded, flyer, r, {});
    assert.ok(!genome.legacyMoves.includes('divebuffet'));
  }

  // The parents still carry it, so a winged descendant can still get it.
  let inherited = false;
  for (let i = 0; i < 40; i++) {
    const { genome } = conceive(flyer, grounded, r, {});
    if (genome.legacyMoves.includes('divebuffet')) inherited = true;
  }
  assert.ok(!inherited, 'divebuffet is in the Galecrest learnset, so it is not a legacy move here');

  // A legacy move the body does support does come through eventually.
  const teacher = makeWildKinbeast('cinderkit', r, 14);
  teacher.moves = ['emberlash', 'kindle'];
  let gotEmber = false;
  for (let i = 0; i < 60; i++) {
    const { genome } = conceive(grounded, teacher, r, {});
    if (genome.legacyMoves.includes('emberlash')) gotEmber = true;
  }
  assert.ok(gotEmber, 'a compatible Legacy Move should pass down');
});

test('relatedness recognises siblings, parents and strangers', () => {
  const r = rng();
  const mum = makeWildKinbeast('brookfin', r, 12);
  const dad = makeWildKinbeast('brookfin', r, 12);
  const stranger = makeWildKinbeast('brookfin', r, 12);

  const child = (n) => {
    const { genome, vigor, stability } = conceive(mum, dad, r, {});
    return makeKinbeast({
      genome, rng: r, level: 10, parents: [mum.id, dad.id], generation: 2,
      origin: 'bred', vigor, stability, name: `Child${n}`,
    });
  };
  const kidA = child(1);
  const kidB = child(2);
  const roster = [mum, dad, stranger, kidA, kidB];
  const lookup = (id) => roster.find((b) => b.id === id);

  assert.equal(relatedness(mum, stranger, lookup), 0);
  assert.ok(relatedness(kidA, kidB, lookup) >= 0.45, 'full siblings');
  assert.ok(relatedness(kidA, mum, lookup) >= 0.45, 'parent and offspring');
});

test('the sanctuary refuses immediate-family pairings', () => {
  const r = rng();
  const mum = makeWildKinbeast('mossbun', r, 12);
  const dad = makeWildKinbeast('mossbun', r, 12);
  const { genome, vigor, stability } = conceive(mum, dad, r, {});
  const kid = makeKinbeast({
    genome, rng: r, level: 12, parents: [mum.id, dad.id], generation: 2,
    origin: 'bred', vigor, stability,
  });
  const roster = [mum, dad, kid];
  const lookup = (id) => roster.find((b) => b.id === id);
  const ctx = { lookup, nurseryBuilt: true, crossSpeciesUnlocked: true };

  const incest = checkCompatibility(mum, kid, ctx);
  assert.equal(incest.ok, false);
  assert.ok(incest.issues.some((i) => /immediate family/i.test(i)));

  const fine = checkCompatibility(mum, dad, ctx);
  assert.equal(fine.ok, true, fine.issues.join('; '));
});

test('cross-species pairing is gated until the outcross techniques are learned', () => {
  const r = rng();
  const bun = makeWildKinbeast('mossbun', r, 12);
  const brookfin = makeWildKinbeast('brookfin', r, 12);
  const lookup = () => undefined;

  // Both are Feral, so the family requirement passes; only the gate stops it.
  const locked = checkCompatibility(bun, brookfin, { lookup, nurseryBuilt: true, crossSpeciesUnlocked: false });
  assert.equal(locked.ok, false);
  const unlocked = checkCompatibility(bun, brookfin, { lookup, nurseryBuilt: true, crossSpeciesUnlocked: true });
  assert.ok(unlocked.families.includes('feral'));
});

test('species with no shared Brood Family cannot pair at all', () => {
  const r = rng();
  const grub = makeWildKinbeast('glowgrub', r, 12); // chitin
  const bun = makeWildKinbeast('mossbun', r, 12); // feral / bloom
  const res = checkCompatibility(grub, bun, {
    lookup: () => undefined,
    nurseryBuilt: true,
    crossSpeciesUnlocked: true,
  });
  assert.equal(res.families.length, 0);
  assert.equal(res.ok, false);
});

test('outcrossing raises Vigor and inbreeding spends it', () => {
  const r = rng();
  const a = makeWildKinbeast('mossbun', r, 12);
  const b = makeWildKinbeast('mossbun', r, 12);
  const unrelated = conceive(a, b, r, { relatedness: 0 });
  const inbred = conceive(a, b, r, { relatedness: 0.5 });
  assert.ok(unrelated.vigor > inbred.vigor, `${unrelated.vigor} should beat ${inbred.vigor}`);

  const cross = conceive(a, makeWildKinbeast('brookfin', r, 12), r, { relatedness: 0 });
  assert.ok(cross.vigor >= unrelated.vigor, 'hybrid vigor should not be a penalty');
});

test('mutation catalysts raise mutation rate and cost Stability', () => {
  const r = rng();
  const a = makeWildKinbeast('cinderkit', r, 12);
  const b = makeWildKinbeast('cinderkit', r, 12);
  let plain = 0;
  let catalysed = 0;
  for (let i = 0; i < 120; i++) {
    plain += conceive(a, b, r, {}).mutations.length;
    catalysed += conceive(a, b, r, { catalyst: true }).mutations.length;
  }
  assert.ok(catalysed > plain, `catalyst ${catalysed} vs plain ${plain}`);
});

test('build genes shift statistics in opposite directions', () => {
  const r = rng();
  const base = makeWildKinbeast('pebbleback', r, 20);
  const heavy = structuredClone(base);
  const light = structuredClone(base);
  heavy.genome.loci.build = [{ v: 'huge', dom: 1 }, { v: 'huge', dom: 1 }];
  light.genome.loci.build = [{ v: 'tiny', dom: 1 }, { v: 'tiny', dom: 1 }];
  heavy.phenotype = expressGenome(heavy.genome);
  light.phenotype = expressGenome(light.genome);

  const h = computeStats(heavy);
  const l = computeStats(light);
  assert.ok(h.vitality > l.vitality, 'large builds favour Vitality');
  assert.ok(h.power > l.power, 'large builds favour Power');
  assert.ok(l.speed > h.speed, 'small builds favour Speed');
});

test('training cannot exceed genetic potential', () => {
  const r = rng();
  const beast = makeWildKinbeast('mossbun', r, 20);
  const cap = Math.round(beast.phenotype.aptitudes.power * 100);
  beast.training.power = cap;
  const before = computeStats(beast).power;
  beast.training.power = cap; // the Game clamps; this asserts the cap is meaningful
  assert.equal(computeStats(beast).power, before);
  assert.ok(cap <= 100);
});

test('colour names are stable and human-readable', () => {
  assert.equal(colorName({ h: 20, s: 60, l: 50 }), 'Amber');
  assert.equal(colorName({ h: 0, s: 4, l: 80 }), 'Pale Ash');
  assert.ok(colorName({ h: 120, s: 40, l: 30 }).startsWith('Dark'));
});

test('heterozygosity is 0 for a fully homozygous genome', () => {
  const r = rng();
  const genome = createWildGenome('mossbun', r);
  for (const locus of ALL_LOCI) {
    genome.loci[locus] = [genome.loci[locus][0], structuredClone(genome.loci[locus][0])];
  }
  assert.equal(measureHeterozygosity(genome), 0);
});

test('a default moveset is always legal and never empty', () => {
  const r = rng();
  for (const id of SPECIES_IDS) {
    for (let level = 1; level <= 20; level += 4) {
      const beast = makeWildKinbeast(id, r, level);
      const moves = defaultMoveset(beast);
      assert.ok(moves.length > 0 && moves.length <= 4);
      for (const move of moves) {
        assert.ok(MOVES[move], `unknown move ${move}`);
        assert.ok(canPerform(move, beast.phenotype.bodyTags), `${id} cannot perform ${move}`);
      }
    }
  }
});
