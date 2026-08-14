// Regions and expedition sites.
//
// The vertical slice covers Hearthmere. Later regions slot in with the same
// shape: a set of sites, each with its own encounter table and resources.

export const REGIONS = {
  hearthmere: {
    id: 'hearthmere',
    name: 'Hearthmere Fields',
    blurb:
      'Long grass, low stone walls and the smell of rain coming. The countryside around Briarhold has been left to itself for years.',
    unlockedBy: null,
    sites: [
      {
        id: 'meadow',
        name: 'The Open Meadow',
        blurb: 'Waist-high grass that moves when nothing is moving it.',
        encounters: [
          { species: 'mossbun', weight: 40, level: [3, 6] },
          { species: 'cinderkit', weight: 22, level: [4, 7] },
          { species: 'galecrest', weight: 24, level: [4, 7] },
          { species: 'pebbleback', weight: 14, level: [4, 8] },
        ],
        resources: ['meadow_herb', 'soft_reed'],
      },
      {
        id: 'brook',
        name: 'Hearthmere Brook',
        blurb: 'Cold, clear and shallow enough to wade. Something keeps stealing the fish.',
        encounters: [
          { species: 'brookfin', weight: 46, level: [4, 7] },
          { species: 'mossbun', weight: 24, level: [3, 6] },
          { species: 'galecrest', weight: 16, level: [5, 8] },
          { species: 'pebbleback', weight: 14, level: [5, 8] },
        ],
        resources: ['river_stone', 'clearwater_flask'],
      },
      {
        id: 'hollow',
        name: 'The Hollow Under the Hill',
        blurb: 'A chalk cave the local children are told not to enter. They enter anyway.',
        encounters: [
          { species: 'glowgrub', weight: 42, level: [4, 8] },
          { species: 'pebbleback', weight: 30, level: [5, 9] },
          { species: 'cinderkit', weight: 16, level: [5, 8] },
          { species: 'mossbun', weight: 12, level: [4, 7] },
        ],
        resources: ['lantern_moss', 'river_stone'],
        requires: 'ch1_started',
      },
    ],
  },
};

export const RESOURCES = {
  meadow_herb:     { id: 'meadow_herb',     name: 'Meadow Herb',      short: 'Herb',      desc: 'Common, bitter, and exactly what a stressed Kinbeast needs.' },
  soft_reed:       { id: 'soft_reed',       name: 'Soft Reed',        short: 'Reed',        desc: 'Nesting material. The Nursery always wants more.' },
  river_stone:     { id: 'river_stone',     name: 'River Stone',      short: 'Stone',      desc: 'Smooth and heavy. Used in habitat repair.' },
  clearwater_flask:{ id: 'clearwater_flask',name: 'Clearwater Flask', short: 'Water', desc: 'Water clean enough to raise a hatchling on.' },
  lantern_moss:    { id: 'lantern_moss',    name: 'Lantern Moss',     short: 'Moss',     desc: 'Glows faintly. Hatcheries use it to regulate light.' },
};

export function getRegion(id) {
  return REGIONS[id];
}

export function siteById(regionId, siteId) {
  return REGIONS[regionId]?.sites.find((s) => s.id === siteId);
}

/** Sites the player can currently visit, given their story flags. */
export function availableSites(regionId, flags) {
  const region = REGIONS[regionId];
  if (!region) return [];
  return region.sites.filter((s) => !s.requires || flags[s.requires]);
}
