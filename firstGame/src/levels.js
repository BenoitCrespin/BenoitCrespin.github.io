// Level data. The ground surface is at y = 660.
// Blocks: x, y are the CENTER of the block, w, h its size.
// Pigeons: x, y are the center of the pigeon (radius 18).
// balls: the countryballs available, in launch order.

export const LEVELS = [
    {
        name: 'Dublin Docks',
        sky: 0x9fc9e8,
        ground: 0x4c9a4c,
        balls: ['ireland', 'spain', 'france'],
        blocks: [
            // Wooden hut
            { type: 'wood', x: 900, y: 600, w: 20, h: 120 },
            { type: 'wood', x: 1000, y: 600, w: 20, h: 120 },
            { type: 'wood', x: 950, y: 530, w: 160, h: 20 },
            // Glass room on top
            { type: 'glass', x: 920, y: 480, w: 20, h: 80 },
            { type: 'glass', x: 980, y: 480, w: 20, h: 80 },
            { type: 'glass', x: 950, y: 430, w: 100, h: 20 },
            // Stone pedestal
            { type: 'stone', x: 1120, y: 630, w: 60, h: 60 }
        ],
        pigeons: [
            { x: 950, y: 642 },
            { x: 950, y: 502 },
            { x: 950, y: 402 },
            { x: 1120, y: 582 }
        ]
    },
    {
        name: 'Paris Rooftops',
        sky: 0xf6d7b0,
        ground: 0x8a8a7a,
        balls: ['spain', 'ireland', 'france', 'ireland'],
        blocks: [
            // Stone ground floor
            { type: 'stone', x: 850, y: 610, w: 30, h: 100 },
            { type: 'stone', x: 1010, y: 610, w: 30, h: 100 },
            { type: 'stone', x: 930, y: 548, w: 200, h: 24 },
            // Wooden first floor
            { type: 'wood', x: 870, y: 486, w: 20, h: 100 },
            { type: 'wood', x: 990, y: 486, w: 20, h: 100 },
            { type: 'wood', x: 930, y: 426, w: 160, h: 20 },
            // Glass attic
            { type: 'glass', x: 895, y: 376, w: 20, h: 80 },
            { type: 'glass', x: 965, y: 376, w: 20, h: 80 },
            { type: 'glass', x: 930, y: 326, w: 100, h: 20 },
            // Small side tower
            { type: 'wood', x: 1110, y: 590, w: 20, h: 140 },
            { type: 'wood', x: 1190, y: 590, w: 20, h: 140 },
            { type: 'wood', x: 1150, y: 510, w: 120, h: 20 },
            { type: 'glass', x: 1150, y: 480, w: 40, h: 40 }
        ],
        pigeons: [
            { x: 930, y: 642 },
            { x: 930, y: 518 },
            { x: 930, y: 398 },
            { x: 930, y: 298 },
            { x: 1150, y: 642 }
        ]
    }
];
