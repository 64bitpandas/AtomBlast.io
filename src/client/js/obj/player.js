import { GLOBAL } from '../global.js'
import * as PIXI from 'pixi.js'
import { screenCenterX, screenCenterY, mouseDown, spritesheet } from '../pixigame.js'
import { socket, teamColors } from '../socket.js'
import { GameObject } from './gameobject.js'
import { cookieInputs } from '../app.js'

export class Player extends GameObject {
	/**
     * Constructor for creating a new Player in the server side.
     * Player is a Sprite instance that can be added to the stage.
     * Each Player should only be created once, and updated subsequently with
     * setData().
     * @param {PIXI.Texture} texture The texture associated with this sprite
     * @param {string} id Socket ID of the player
     * @param {string} name Name of the player
     * @param {string} room Room that the player belongs to
     * @param {string} team Team that the player belongs to
     * @param {number} health Health of the player
     * @param {number} x Global x-coordinate
     * @param {number} y Global y-coordinate
     * @param {number} vx Horizontal velocity
     * @param {number} vy Vertical velocity
     */
	constructor (texture, id, name, room, team, health, x, y, vx, vy, experience) {
		// Call GameObject
		super(texture, id, x, y, vx, vy)

		// Pixi Values
		this.width = GLOBAL.PLAYER_RADIUS * 2
		this.height = GLOBAL.PLAYER_RADIUS * 2

		if (id === socket.id) {
			// console.log('this player');
			this.x = screenCenterX
			this.y = screenCenterY
		}
		else { // take this player off screen until it can be processed
			this.hide()
		}

		// Custom fields
		this.name = name
		this.room = room
		this.team = team
		this.health = health // Set the health of the player
		this.isMoving = false
		this.experience = experience // Sets the experience of the player(Passed in)
		this.speedMult = 1 // Speed multiplier. Increased/decreased by different compounds
		this.hasShield = false
		this.stronghold = 'none'

		this.damagedBy = {} // Object containing the values of damage that each player has dealt.
		this.textObjects = {} // Contains Text to be drawn under the player (name, id, etc)
		this.playerSprite = new PIXI.Sprite(texture)

		this.setup()
	}

	/**
     * First-time setup for this player. All of the functions in this method will only be called once.
     */
	setup () {
		// Create text objects
		this.textObjects.nametext = new PIXI.Text('name: ')
		this.textObjects.idtext = new PIXI.Text('id: ')
		this.textObjects.postext = new PIXI.Text('placeholderpos')
		this.textObjects.teamtext = new PIXI.Text('team: ')
		this.textObjects.healthtext = new PIXI.Text('health: ')

		// Assign values and positions
		this.textObjects.idtext.position.set(0, GLOBAL.PLAYER_RADIUS * 9)
		this.textObjects.idtext.text += this.id
		this.textObjects.nametext.position.set(0, GLOBAL.PLAYER_RADIUS * 9 + 100)
		this.textObjects.nametext.text += this.name
		this.textObjects.postext.position.set(0, GLOBAL.PLAYER_RADIUS * 9 + 200)
		this.textObjects.teamtext.text += this.team
		this.textObjects.teamtext.position.set(0, GLOBAL.PLAYER_RADIUS * 9 + 300)

		// create text and assign color
		for (let item in this.textObjects) {
			// Add text
			this.textObjects[item].style = new PIXI.TextStyle({
				fill: '0x' + GLOBAL.TEAM_COLORS[teamColors[this.team]],
				fontSize: 120
			})
			this.addChild(this.textObjects[item])
		}

		// Create player sprite child
		this.playerSprite.anchor.set(0.5, 0.5)
		this.playerSprite.position.set(GLOBAL.PLAYER_RADIUS * 5, GLOBAL.PLAYER_RADIUS * 5)
		this.playerSprite.scale.set(1.3, 1.3)
		this.addChild(this.playerSprite)
	}
	/**
      * Draws all components of a given player.
      * This method should be included in the ticker and called once a frame.
    * Therefore, all setup tasks
     * should be called in setup().
    */
	tick () {
		// Movement
		super.tick(true)

		// Update text
		this.textObjects.postext.text = '(' + Math.round(this.posX) + ', ' + Math.round(this.posY) + ')'
		this.textObjects.healthtext.text = 'health: ' + this.health

		// Rotation
		this.playerSprite.rotation += (this.id === socket.id && mouseDown) ? GLOBAL.PLAYER_EXPEDITED_ROTATION : GLOBAL.PLAYER_ROTATION

		// Draw other player
		if (this.id !== socket.id) {
			this.draw()
		}
	}

	/**
	 * Notifies the player to check for a sprite change (shield, etc).
	 * @param {boolean} hasShield True if the player has shield from an element
	 * @param {string} stronghold 'team' if player is in team stronghold, 'notteam' if player is in enemy stronghold, 'none', if not in a stronghold
	 */
	changeSprite(hasShield, stronghold) {

		// Set values
		this.hasShield = hasShield
		this.stronghold = stronghold
		
		// Set sprite
		if (this.hasShield || this.stronghold === 'team') {
			this.playerSprite.texture = spritesheet.textures[teamColors[this.team] + 'playershield.png']
		} else {
			this.playerSprite.texture = spritesheet.textures[teamColors[this.team] + 'player.png']
		}
	}
}
