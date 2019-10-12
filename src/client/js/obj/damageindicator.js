import * as PIXI from 'pixi.js'
import { app, spritesheet, player, screenCenterX, screenCenterY } from '../pixigame'
/**
 * One Tile component of the map.
 */
export class DamageIndicator extends PIXI.Sprite {
	/**
     *
     * @param {*} damageAmount
     * @param {*} posX
     * @param {*} posY
     */
	constructor(damageAmount, posX, posY) {
		super(spritesheet.textures['notexture.png'])

		this.posX = posX
		this.posY = posY
		this.height = 1
		this.width = 1

		// Create text object
		this.text = new PIXI.Text('-' + damageAmount)

		// Set style
		this.text.style = new PIXI.TextStyle({
			fontSize: 25,
			fill: '0xf44336'
		})

		this.addChild(this.text)
		app.stage.addChild(this)
	}

	/**
     * Draws object in the correct position on the player screen.
     */
	tick() {
		if (player !== undefined) {
			this.x = screenCenterX + this.posX - player.posX
			this.y = screenCenterY + player.posY - this.posY
		}
	}
}
