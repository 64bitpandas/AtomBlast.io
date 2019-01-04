import * as PIXI from 'pixi.js'
import { app, screenCenterX, screenCenterY, player } from '../pixigame'
import { GLOBAL } from '../global'
import { MAP_LAYOUT } from './tiles'

/**
 * GameObject class that all objects in the game space should inherit.
 * Provides standard field variables such as posX and posY, as well as
 * standard methods to manipulate them.
 *
 * A GameObject cannot be added directly; it must be inherited.
 * setup() and tick() must be overridden.
 */
export class GameObject extends PIXI.Sprite {
	/**
     * Creates a new GameObject.
     * @param {PIXI.Texture} texture The texture associated with this sprite
     * @param {string} id Unique identifier- for example, socket ID for players, numerical ID for atoms
     * @param {number} x Global x-coordinate
     * @param {number} y Global y-coordinate
     * @param {number} vx Horizontal velocity
     * @param {number} vy Vertical velocity
     */
	constructor (texture, id, x, y, vx, vy) {
		super(texture)
		this.id = id
		this.posX = x
		this.posY = y
		this.vx = vx
		this.vy = vy
		this.destroyed = false

		app.stage.addChild(this)
	}

	/**
     * Sets global coordinates of this player
     * @param {number} newX New x-coordinate to move to
     * @param {number} newY New y-coordinate to move to
     */
	setCoordinates (newX, newY) {
		this.posX = newX
		this.posY = newY
	}

	/**
     * Sets global coordinates and speeds of this player
     * @param {number} newX New x-coordinate to move to
     * @param {number} newY New y-coordinate to move to
     * @param {number} vx New x velocity
     * @param {number} vy New y velocity
     */
	setData (newX, newY, vx, vy) {
		this.setCoordinates(newX, newY)
		this.vx = vx
		this.vy = vy
	}

	/**
     * Call during tick() if necessary.
     * Draws object in the correct position on the player screen.
     */
	draw () {
		if (player !== undefined && !this.destroyed) {
			this.x = screenCenterX + this.posX - player.posX
			this.y = screenCenterY + player.posY - this.posY
		}
	}

	/** TEMP
     * Moves this object to (9999, 9999) on local screen space, effectively
     * hiding it from view.
     */
	hide () {
		// console.warn('hide() is called');
		if (this.transform === null || this.transform === undefined) {
			console.warn('hide() function exception. THIS IS ABNORMAL. The following object contains invalid transform object:')
			console.warn(this)
			return 1
		}
		this.x = 9999
		this.y = 9999
	}

	/**
     * Override optional. Called once, during game setup phase.
     */
	setup () {
	}

	/**
     * Override optional. Default behavior: handles movement. Call super.tick() from child class if movable.
     * @param {boolean} noDraw - true if tick() should only process movement, not drawing.
     */
	tick (noDraw) {
		// Prevent drifting due to minimal negative values

		if (this.destroyed) { return }

		if (Math.abs(this.vx) < GLOBAL.DEADZONE) { this.vx = 0 }
		if (Math.abs(this.vy) < GLOBAL.DEADZONE) { this.vy = 0 }

		// Change position based on speed and direction. Don't allow objects to go out of bounds
		if ((this.vx > 0 && this.posX < MAP_LAYOUT[0].length * GLOBAL.GRID_SPACING * 2 - GLOBAL.GRID_SPACING) || (this.vx < 0 && this.posX > 0)) { this.posX += this.vx }
		if ((this.vy > 0 && this.posY < (MAP_LAYOUT.length - 1) * GLOBAL.GRID_SPACING * 2) || (this.vy < 0 && this.posY > -GLOBAL.GRID_SPACING)) { this.posY += this.vy }

		if (this.ignited) { this.texture = PIXI.loader.resources[GLOBAL.IGNITE_SPRITE].texture }

		if (!noDraw) {
			this.draw()
		}
	}

	/**
     * Destroyes the Sprite
     */
	destroy () {
		this.destroyed = true
		super.destroy()
	}
}
