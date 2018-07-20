/**
 * This constant contains all data on how to draw and manage tiles. 
 * 
 * Fields required:
 * type: Choose one: spawner, teamBase, wall
 * params: Different for each type. For example, spawner will require the `atomToSpawn` param, and teamBase will require the `teamName` param.
 * texture: String path of the texture file for this texture, starting in the `map` folder. (ex. 'foo.png' corresponds to '../../assets/map/Tiles/foo.png') 
 */
export const TILES = {
    empty: {
        texture: 'SolidTile.png',
        type: 'none'
    },
    topLeft: {
        texture: 'Corner TL.png',
        type: 'wall',
        params: {
            border: ['top', 'left']
        }
    },
    topRight: {
        texture: 'Corner TR.png',
        type: 'wall',
        params: {
            border: ['top', 'left']
        }
    },
    bottomLeft: {
        texture: 'Corner BL.png',
        type: 'wall',
        params: {
            border: ['top', 'left']
        }
    },
    bottomRight: {
        texture: 'Corner BR.png',
        type: 'wall',
        params: {
            border: ['top', 'left']
        }
    },
    edgeTop: {
        texture: 'EdgeTile T.png',
        type: 'wall',
        params: {
            border: ['top']
        }
    },
    edgeBottom: {
        texture: 'EdgeTile B.png',
        type: 'wall',
        params: {
            border: ['top']
        }
    },
    edgeLeft: {
        texture: 'EdgeTile L.png',
        type: 'wall',
        params: {
            border: ['top']
        }
    },
    edgeRight: {
        texture: 'EdgeTile R.png',
        type: 'wall',
        params: {
            border: ['top']
        }
    },
    hydrogenVent: {
        texture: 'HydrogenVent.png',
        type: 'spawner',
        params: {
            atomsToSpawn: ['h']
        }
    }
};

/**
 * 2D array containing the entire map tile layout. Top left is (0,0), furthest right is (n, 0) and furthest bottom is (0, n).
 */
export const MAP_LAYOUT = [
    [
        'topLeft', 'edgeTop', 'topRight'
    ],
    [
        'edgeLeft', 'empty', 'edgeRight'
    ],
    [
        'bottomLeft', 'edgeBottom', 'bottomRight'
    ]
];
