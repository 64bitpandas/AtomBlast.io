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
	flame: {
		texture: 'FlameTile.png',
		type: 'flame'
	},
	topLeft: {
		texture: 'InteriorCorner BR.png',
		type: 'wall',
		params: {
			border: ['bottom', 'right']
		}
	},
	topRight: {
		texture: 'InteriorCorner BL.png',
		type: 'wall',
		params: {
			border: ['bottom', 'left']
		}
	},
	bottomLeft: {
		texture: 'InteriorCorner TR.png',
		type: 'wall',
		params: {
			border: ['top', 'right']
		}
	},
	bottomRight: {
		texture: 'InteriorCorner TL.png',
		type: 'wall',
		params: {
			border: ['top', 'left']
		}
	},
	edgeTop: {
		texture: 'EdgeTile B.png',
		type: 'wall',
		params: {
			border: ['bottom']
		}
	},
	edgeBottom: {
		texture: 'EdgeTile T.png',
		type: 'wall',
		params: {
			border: ['top']
		}
	},
	edgeLeft: {
		texture: 'EdgeTile R.png',
		type: 'wall',
		params: {
			border: ['right']
		}
	},
	edgeRight: {
		texture: 'EdgeTile L.png',
		type: 'wall',
		params: {
			border: ['left']
		}
	},
	hydrogenVent: {
		texture: 'HydrogenVent.png',
		type: 'spawner',
		params: {
			atomsToSpawn: ['h']
		}
	},
	oxygenVent: {
		texture: 'OxygenVent.png',
		type: 'spawner',
		params: {
			atomsToSpawn: ['o']
		}
	},
	nitrogenVent: {
		texture: 'NitrogenVent.png',
		type: 'spawner',
		params: {
			atomsToSpawn: ['n']
		}
	},
	carbonVent: {
		texture: 'CarbonSource.png',
		type: 'spawner',
		params: {
			atomsToSpawn: ['c']
		}
	}
}

/**
 * 2D array containing the entire map tile layout. Top left is (0,0), furthest right is (n, 0) and furthest bottom is (0, n).
 * Shortcuts:
 * E = Empty
 * O = Oxygen
 * N = Nitrogen
 * C = Carbon
 */
export const MAP_LAYOUT = [
	['H', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'H'],
	['E', 'O', 'O', 'E', 'N', 'N', 'E', 'O', 'O', 'E'],
	['E', 'O', 'E', 'E', 'E', 'E', 'E', 'E', 'O', 'E'],
	['E', 'E', 'E', 'H', 'F', 'F', 'H', 'E', 'E', 'E'],
	['E', 'N', 'E', 'F', 'C', 'C', 'F', 'E', 'N', 'E'],
	['F', 'N', 'E', 'F', 'C', 'C', 'F', 'E', 'N', 'E'],
	['E', 'E', 'E', 'H', 'F', 'F', 'H', 'E', 'E', 'E'],
	['E', 'O', 'E', 'E', 'E', 'E', 'E', 'E', 'O', 'E'],
	['E', 'O', 'O', 'E', 'N', 'N', 'E', 'O', 'O', 'E'],
	['H', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'E', 'H']
]

export const TILE_NAMES = {
	E: 'empty',
	O: 'oxygenVent',
	N: 'nitrogenVent',
	C: 'carbonVent',
	H: 'hydrogenVent',
	F: 'flame',
	q: 'topLeft',
	w: 'edgeTop',
	e: 'topRight',
	a: 'edgeLeft',
	d: 'edgeRight',
	z: 'bottomLeft',
	x: 'edgeBottom',
	c: 'bottomRight'
}
