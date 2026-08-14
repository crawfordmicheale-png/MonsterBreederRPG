// Echoes — inherited fragments of ancestral memory.
//
// A fragment lives in a bloodline, not in an individual. Breeding carries it
// forward; the Echo Hall assembles compatible fragments into a whole scene.

export const FRAGMENTS = {
  ash_hands: {
    id: 'ash_hands',
    name: 'A Pair of Hands',
    kind: 'person',
    text: 'Hands lifting something warm out of the straw. Ash on the knuckles. The hands are shaking and the voice above them is steady, which is the wrong way round.',
    echo: 'night_of_ash_first',
  },
  ash_stair: {
    id: 'ash_stair',
    name: 'A Stair That Should Not Be There',
    kind: 'location',
    text: 'Under the nursery floor, a stair going down further than the hill allows. Cut stone. Recent tool marks.',
    echo: 'night_of_ash_first',
  },
  ash_bell: {
    id: 'ash_bell',
    name: 'The Bell, Rung Wrong',
    kind: 'sound',
    text: 'The sanctuary bell rung in a pattern nobody was taught. Not fire. Not visitors. Something with no signal of its own.',
    echo: 'night_of_ash_first',
  },
  meadow_first: {
    id: 'meadow_first',
    name: 'First Season in the Long Grass',
    kind: 'moment',
    text: 'Grass over your head and the whole world smelling of rain coming. Somebody counting hatchlings and getting the number wrong on purpose, to make a child laugh.',
    echo: 'briarhold_before',
  },
  meadow_names: {
    id: 'meadow_names',
    name: 'The Naming of Lines',
    kind: 'technique',
    text: 'A woman writing names on a slate — not the Kinbeasts\' names, the lines\' names. "They forget individuals," she says. "They remember families."',
    echo: 'briarhold_before',
  },
};

export const ECHOES = {
  night_of_ash_first: {
    id: 'night_of_ash_first',
    name: 'The Night of Ash — First Light',
    requires: ['ash_hands', 'ash_stair', 'ash_bell'],
    summary:
      'Your mother took the egg down a stair that should not have existed, while the bell rang a pattern nobody had been taught.',
    scene: [
      'The memory is not yours. It is older than you and it arrives sideways, the way they always do.',
      'A woman kneels in the nursery straw with something warm in both hands. There is ash on her knuckles. Behind her the floor is open — a stair going down into cut stone, tool marks still bright.',
      'Above, the sanctuary bell is ringing a pattern that means nothing. Not fire. Not visitors. Something with no signal of its own.',
      'She sets the egg into the dark and seals it, and says, clearly, to no one who was listening at the time: "Not for them. For whoever comes back."',
      'Echoryx presses its head against your leg and does not move for a long while.',
    ],
    reward: { flag: 'echo_night_of_ash_first', legacyMove: null },
  },
  briarhold_before: {
    id: 'briarhold_before',
    name: 'Briarhold, Before',
    requires: ['meadow_first', 'meadow_names'],
    summary: 'What the sanctuary was, when it was still working.',
    scene: [
      'Long grass, higher than a child. Someone counting hatchlings and getting the number wrong on purpose.',
      'A slate by the nursery door with names written on it — not the Kinbeasts\' names. The lines\' names.',
      '"They forget individuals," your mother says, to nobody, to you. "They remember families. So write down the families."',
    ],
    reward: { flag: 'echo_briarhold_before', unlocksLineageNaming: true },
  },
};

export function fragmentsOf(beast) {
  return (beast.genome.echoes ?? []).map((id) => FRAGMENTS[id]).filter(Boolean);
}

/** Which Echoes the player can assemble from fragments across the whole roster. */
export function reconstructable(roster, completed = []) {
  const held = new Set();
  for (const beast of roster) for (const f of beast.genome.echoes ?? []) held.add(f);
  return Object.values(ECHOES).map((echo) => {
    const have = echo.requires.filter((f) => held.has(f));
    return {
      echo,
      have,
      missing: echo.requires.filter((f) => !held.has(f)),
      ready: have.length === echo.requires.length && !completed.includes(echo.id),
      done: completed.includes(echo.id),
    };
  });
}
