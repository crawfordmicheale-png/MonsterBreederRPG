// The linear campaign.
//
// A chapter is a list of beats. A beat is either a scene (read it, move on) or
// an objective (a predicate over game state). Progression is strictly
// sequential — the bible is explicit that the story does not branch.

export const CHAPTERS = [
  {
    id: 'prologue',
    number: 0,
    title: 'Ashes at Briarhold',
    location: 'Briarhold Sanctuary',
    beats: [
      {
        id: 'arrival',
        kind: 'scene',
        title: 'The Letter',
        scene: [
          { who: 'narration', text: 'The gate is where you left it. Most of it.' },
          { who: 'narration', text: 'Briarhold Sanctuary sits under fifteen years of weather and nobody has argued with the weather once. The family banners have gone the colour of old tea. The meadow habitat has eaten the fence.' },
          { who: 'Orren Hale', text: 'You came. I half wrote that letter expecting you would not.' },
          { who: 'Orren Hale', text: 'I have kept the wilderness off the buildings and that is the entire list of what I have managed. The nursery roof came down two winters ago. I could not lift it alone.' },
          { who: 'Orren Hale', text: 'Come and lift it with me.' },
        ],
      },
      {
        id: 'clear_nursery',
        kind: 'objective',
        title: 'Clear the collapsed nursery',
        objective: 'Complete the sanctuary project: Clear the Nursery.',
        hint: 'Sanctuary → Projects.',
        done: (g) => g.flags.nursery_cleared,
      },
      {
        id: 'hatch_echoryx',
        kind: 'scene',
        title: 'What Was Under the Floor',
        scene: [
          { who: 'narration', text: 'Under the fallen beams the nursery floor is not floor. It is a sealed slab, and the seal is your mother\'s.' },
          { who: 'Orren Hale', text: 'I have walked over that every day for fifteen years.' },
          { who: 'narration', text: 'Inside the chamber, on a bed of straw that should have rotted and has not, there is one egg. It is warm.' },
          { who: 'narration', text: 'It hatches in your hands. Whatever comes out of it is small, four-legged, and entirely unimpressive — until its markings shift to match the moss on your sleeve, and hold there.' },
          { who: 'Orren Hale', text: '...I do not know what that is. And I knew every line your parents kept.' },
        ],
        onEnter: (g) => g.grantEchoryx(),
      },
      {
        id: 'veyra',
        kind: 'scene',
        title: 'Crown Property',
        scene: [
          { who: 'narration', text: 'The Crown coach arrives before the dust in the nursery has settled, which tells you how long it has been waiting for a reason.' },
          { who: 'Director Veyra', text: 'Briarhold\'s keeper licence was revoked after the Night of Ash. You are standing in a ruin with an unregistered Kinbeast. Both of those are mine to collect.' },
          { who: 'Orren Hale', text: 'Concord law. Fourth article. Any keeper who earns all five regional Seals may petition to restore a revoked sanctuary.' },
          { who: 'Director Veyra', text: 'That article is two hundred years old.' },
          { who: 'Orren Hale', text: 'It is also still law.' },
          { who: 'Director Veyra', text: 'Then let them try. Five Seals. Understand that I am not granting you a chance — I am granting you enough rope to be publicly done with.' },
          { who: 'narration', text: 'The coach leaves. Echoryx watches it the entire way down the lane and does not blink once.' },
        ],
        onEnter: (g) => {
          g.flags.challenge_accepted = true;
          g.flags.exploration_unlocked = true;
        },
      },
      {
        id: 'first_bond',
        kind: 'objective',
        title: 'Form your first Concord',
        objective: 'Bond with a wild Kinbeast in Hearthmere Fields.',
        hint: 'Explore → any site. Read the creature before you approach it.',
        done: (g) => g.roster.filter((b) => b.origin === 'wild').length >= 1,
      },
      {
        id: 'first_battle',
        kind: 'objective',
        title: 'Win a battle',
        objective: 'Win one battle in the field.',
        hint: 'Expeditions will find you a fight soon enough.',
        done: (g) => g.stats.battlesWon >= 1,
      },
      {
        id: 'first_echo',
        kind: 'scene',
        title: 'The First Echo',
        scene: [
          { who: 'narration', text: 'It happens in the night, without warning, the way they always will.' },
          { who: 'narration', text: 'Hands lifting something warm out of the straw. Ash on the knuckles. A voice above them, steady in a way the hands are not.' },
          { who: 'narration', text: 'Then nothing. Echoryx is asleep against your boot and does not wake.' },
          { who: 'Orren Hale', text: 'That is an Echo. A memory carried in the blood rather than the head.' },
          { who: 'Orren Hale', text: 'They come in pieces, and the pieces travel down a bloodline. If you want the whole of it — and you do — you will have to breed for it.' },
        ],
        onEnter: (g) => {
          g.giveFragment(g.echoryxId, 'ash_hands');
          g.flags.echoes_unlocked = true;
        },
      },
    ],
  },

  {
    id: 'chapter_one',
    number: 1,
    title: 'The Meadow Seal',
    location: 'Hearthmere Fields',
    beats: [
      {
        id: 'ch1_open',
        kind: 'scene',
        title: 'The Hearthmere Trial',
        scene: [
          { who: 'Orren Hale', text: 'The local Trial is the smallest of the five and it still turns most candidates away, because of the entry condition.' },
          { who: 'Orren Hale', text: 'You may not enter with Kinbeasts you found. You must enter with one you raised. Second generation, hatched under your own roof.' },
          { who: 'Orren Hale', text: 'So: two adults who share a Brood Family and can stand each other. A working Nursery. An egg. And the patience to wait for it.' },
          { who: 'Orren Hale', text: 'Start with the Nursery. I will start with the fence.' },
        ],
        onEnter: (g) => {
          g.flags.ch1_started = true;
          g.flags.breeding_unlocked = true;
        },
      },
      {
        id: 'ch1_nursery',
        kind: 'objective',
        title: 'Rebuild the Nursery',
        objective: 'Complete the sanctuary project: Rebuild the Nursery.',
        hint: 'Sanctuary → Projects. You will need Soft Reed and River Stone.',
        done: (g) => g.facilities.nursery >= 1,
      },
      {
        id: 'ch1_pair',
        kind: 'objective',
        title: 'Raise two compatible adults',
        objective: 'Have two adult Kinbeasts of the same species who will pair.',
        hint: 'Adults are level 8 and up. Train them in the yard or take them on expeditions.',
        done: (g) => g.hasCompatiblePair(),
      },
      {
        id: 'ch1_egg',
        kind: 'objective',
        title: 'Produce an egg',
        objective: 'Pair two Kinbeasts in the Nursery and produce an egg.',
        hint: 'Breed → choose a Form Parent and a Trait Parent.',
        done: (g) => g.stats.eggsLaid >= 1,
      },
      {
        id: 'ch1_hatch',
        kind: 'objective',
        title: 'Hatch the egg',
        objective: 'Advance the egg to hatching by doing sanctuary work and expeditions.',
        hint: 'Eggs develop through completed activities, not real time.',
        done: (g) => g.stats.eggsHatched >= 1,
      },
      {
        id: 'ch1_raise',
        kind: 'objective',
        title: 'Raise the offspring to Juvenile',
        objective: 'Bring a second-generation Kinbeast to the Juvenile stage.',
        hint: 'Level 3. Training counts; so does carrying it along on an expedition.',
        done: (g) => g.roster.some((b) => b.generation >= 2 && b.level >= 3),
      },
      {
        id: 'ch1_trial',
        kind: 'objective',
        title: 'Win the Meadow Trial',
        objective: 'Enter the Meadow Trial with your second-generation Kinbeast on the team.',
        hint: 'Sanctuary → Trials. The Trial checks your roster at the gate.',
        done: (g) => g.seals.includes('meadow'),
      },
      {
        id: 'ch1_close',
        kind: 'scene',
        title: 'One Seal',
        scene: [
          { who: 'narration', text: 'The Meadow Seal is a disc of grey field-stone with a groove worn across it by two centuries of thumbs. It is not impressive. It is legal, which is better.' },
          { who: 'Orren Hale', text: 'One. Four to go, and the next four will not be Hearthmere.' },
          { who: 'narration', text: 'That night the Echo comes clearer than before.' },
          { who: 'narration', text: 'Your parents, in the nursery doorway, arguing with somebody in Crown grey. Your mother has her arms folded. Your father is not saying anything, which was always the worse sign.' },
          { who: 'Crown official (memory)', text: '—not a request, Briarhold. The research is already Crown-adjacent. You are being offered the courtesy of agreeing.' },
          { who: 'Your mother (memory)', text: 'Get off my land.' },
          { who: 'Orren Hale', text: '...I remember that night. I remember it from the other side of the door.' },
          { who: 'Orren Hale', text: 'We should talk about Emberbreak. Tomorrow.' },
        ],
        onEnter: (g) => {
          g.flags.ch1_complete = true;
          g.giveFragment(g.echoryxId, 'ash_bell');
        },
      },
    ],
  },

  {
    id: 'chapter_two',
    number: 2,
    title: 'The Trial of Embers',
    location: 'The Emberbreak Range',
    beats: [
      {
        id: 'ch2_open',
        kind: 'scene',
        title: 'A Letter from Embervale',
        scene: [
          { who: 'Orren Hale', text: 'Embervale has written to you. To *you*, which tells you how bad it has got — House Embervale does not ask Briarhold for anything.' },
          { who: 'Orren Hale', text: 'Their furnace lines have turned. Aggressive, and barely laying. The works run on those Kinbeasts. If the furnaces go cold, so do four towns.' },
          { who: 'Orren Hale', text: 'Take the road up. Earn the Ember Seal while you are there, if they will let you try.' },
          { who: 'narration', text: 'The Emberbreak Range is black rock and standing heat, and you smell the works an hour before you see them.' },
        ],
        onEnter: (g) => {
          g.flags.ch2_started = true;
          g.flags.catalysts_unlocked = true;
          g.unlockRegion('emberbreak');
        },
      },
      {
        id: 'ch2_survey',
        kind: 'objective',
        title: 'Get the measure of Emberbreak',
        objective: 'Run an expedition anywhere in the Emberbreak Range.',
        hint: 'Explore → switch region to the Emberbreak Range.',
        done: (g) => g.flags.visited_emberbreak,
      },
      {
        id: 'ch2_maeve',
        kind: 'scene',
        title: 'The Trial Master',
        scene: [
          { who: 'Maeve Embervale', text: 'Briarhold. I am going to be direct, because I have not slept properly in a season.' },
          { who: 'Maeve Embervale', text: 'The Crown sends us a treatment. We feed it to the furnace lines. They burn hotter for about two years and then they stop laying, and the ones that do lay produce nothing that opens.' },
          { who: 'Maeve Embervale', text: 'I have said this to Highcourt four times. They send more treatment.' },
          { who: 'Maeve Embervale', text: 'There are records in the deep tunnels, below the working levels. That is where the failed stock went. I cannot send crews down — nothing we have can take the heat that long.' },
          { who: 'Maeve Embervale', text: 'And before you ask: no, you cannot walk in behind one good animal. The crews go in threes and they come out in threes. All three have to be able to stand it.' },
          { who: 'Maeve Embervale', text: 'You are a breeder. So breed me a party that can.' },
        ],
        onEnter: (g) => {
          g.flags.ch2_briefed = true;
        },
      },
      {
        id: 'ch2_heatproof',
        kind: 'objective',
        title: 'Raise a party that can take the heat',
        objective: 'Get all three active Kinbeasts to Heatproof tolerance 76 or better.',
        hint:
          'Explore → the Deep Tunnels lists every member of the party and exactly why each one falls short. One well-adapted Kinbeast is a donor, not a solution — breed the trait outward. Two copies of the allele beat one, and Flame affinity, plating and a high Resolve aptitude all add to the same total.',
        done: (g) => g.teamClears('heat'),
      },
      {
        id: 'ch2_tunnels',
        kind: 'objective',
        title: 'Reach the deep tunnels',
        objective: 'Run an expedition into the Deep Tunnels and recover a Crown Ledger Page.',
        hint: 'Explore → Emberbreak → The Deep Tunnels.',
        done: (g) => (g.resources.crown_ledger ?? 0) >= 1,
      },
      {
        id: 'ch2_records',
        kind: 'scene',
        title: 'What Was Written Down',
        scene: [
          { who: 'narration', text: 'The deep tunnels are not a laboratory. They are a store room, and what is stored is failure.' },
          { who: 'narration', text: 'Rows of cold nests. Ledger pages nailed to the rock where the damp could not get them. Clutch counts, season by season, in a neat Crown hand.' },
          { who: 'narration', text: 'Every column falls. Not one of them turns back up.' },
          { who: 'Maeve Embervale', text: '...They knew. Before the first dose reached us, they already knew what it did.' },
          { who: 'Maeve Embervale', text: 'Eleven generations of my House\'s lines. And a clerk in Highcourt wrote the number down each year and sent the next shipment.' },
          { who: 'Maeve Embervale', text: 'Come to the Trial ground. I would like very much to hit something, and it may as well be you.' },
        ],
        onEnter: (g) => {
          g.flags.ch2_records = true;
          g.giveFragment(g.echoryxId, 'ash_ledger');
        },
      },
      {
        id: 'ch2_trial',
        kind: 'objective',
        title: 'Win the Trial of Embers',
        objective: 'Defeat Trial Master Maeve Embervale and earn the Ember Seal.',
        hint: 'Sanctuary → Trials. She fields a Heatproof line of her own.',
        done: (g) => g.seals.includes('ember'),
      },
      {
        id: 'ch2_close',
        kind: 'scene',
        title: 'Two Seals',
        scene: [
          { who: 'Maeve Embervale', text: 'Better than I expected. Not better than me, until the last exchange, and I want that on the record.' },
          { who: 'narration', text: 'The Ember Seal is a disc of dark glass with a thread of live orange still moving somewhere inside it.' },
          { who: 'Maeve Embervale', text: 'House Embervale stops the treatment today. We will lose the hot burn and probably a contract. We will keep the lines.' },
          { who: 'Maeve Embervale', text: 'One more thing. The ledger pages are in a Highcourt hand, but the *test* records underneath them are not. They are signed from a facility at Briarhold.' },
          { who: 'Orren Hale', text: '...' },
          { who: 'Maeve Embervale', text: 'I assumed you knew. Greenmantle next, if you are going in order. Their trouble is the opposite of ours — too many of one thing rather than too little.' },
        ],
        onEnter: (g) => {
          g.flags.ch2_complete = true;
          g.giveFragment(g.echoryxId, 'ash_nest');
          g.flags.cross_species_unlocked = true;
        },
      },
    ],
  },
];

export const CHAPTER_BY_ID = Object.fromEntries(CHAPTERS.map((c) => [c.id, c]));

export function beatAt(chapterIndex, beatIndex) {
  const chapter = CHAPTERS[chapterIndex];
  if (!chapter) return null;
  return chapter.beats[beatIndex] ?? null;
}

export function totalBeats() {
  return CHAPTERS.reduce((n, c) => n + c.beats.length, 0);
}
