import * as PIXI from 'pixi.js'
import { TILES } from './tiles'
import { GLOBAL } from '../global'
import { app, player, screenCenterX, screenCenterY, spritesheet } from '../pixigame'
/**
 * One Tile component of the map.
 */
export class MapTile extends PIXI.Sprite {
	/**
     * Constructs one Tile to add to the map.
     * @param {string} name Name of the tile to place. Takes this name from `tiles.js` and loads its resources
     * @param {number} gridX X-coordinate on the grid. Every 1 gridX = 400 posX
     * @param {number} gridY Y-coordinate on the grid.
     */
	constructor (name, gridX, gridY) {
		super(spritesheet.textures[TILES[name].texture])
		this.tile = TILES[name]
		this.posX = gridX * GLOBAL.GRID_SPACING * 2
		this.posY = gridY * GLOBAL.GRID_SPACING * 2
		this.height = GLOBAL.GRID_SPACING * 2
		this.width = GLOBAL.GRID_SPACING * 2

		// To be assigned later
		this.owner = null
		this.captured = false

		if (TILES[name].type === 'spawner' || TILES[name].type === 'stronghold' || TILES[name].type === 'nucleus') {
			// Create text object
			this.hpText = new PIXI.Text('HP: ' + GLOBAL[('MAX_' + TILES[name].type + '_HEALTH').toUpperCase()])
			// Set style
			this.hpText.style = new PIXI.TextStyle({
				fontSize: 36
			})
			this.addChild(this.hpText)
		}


		app.stage.addChild(this)
	}

	/**
     * Draws object in the correct position on the player screen.
     */
	tick () {
		if (player !== undefined) {
			this.x = screenCenterX + this.posX - player.posX
			this.y = screenCenterY + player.posY - this.posY
		}
	}

	updateHealth(newHealth) {
		this.hpText.text = 'HP: ' + newHealth
	}

	/** TEMP
     * Moves this tile to (9999, 9999) on local screen space, effectively
     * hiding it from view.
     */
	// hide() {
	//     this.x = 9999;
	//     this.y = 9999;
	// }
}
