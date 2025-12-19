// Anwe3 Tiles
const TILES = {
    EMPTY: 0,
    GROUND: 1,
    GRASS: 2,
    BRICK: 3,
    COIN: 4,
    PLAYER: 5,
    ENEMY: 6,
    FINISH: 7
};

// Anwe3 Collisions
const COLLISION_TYPES = {
    NONE: 0,
    FULL: 1,
    HALF_TOP: 2,
    HALF_BOTTOM: 3,
    HALF_LEFT: 4,
    HALF_RIGHT: 5,
    QUARTER_TL: 6,
    QUARTER_TR: 7,
    QUARTER_BL: 8,
    QUARTER_BR: 9,
    THIRD_TOP: 10,
    THIRD_BOTTOM: 11,
    THIRD_LEFT: 12,
    THIRD_RIGHT: 13
};

// Alwen Tiles
const TILE_COLORS = {
    [TILES.EMPTY]: '#333',
    [TILES.GROUND]: '#654321',
    [TILES.GRASS]: '#228B22',
    [TILES.BRICK]: '#B22222',
    [TILES.COIN]: '#FFD700',
    [TILES.PLAYER]: '#00BFFF',
    [TILES.ENEMY]: '#FF4500',
    [TILES.FINISH]: '#FFFFFF'
};
