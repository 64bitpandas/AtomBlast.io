import * as PIXI from 'pixi.js'
import { keyboard } from './lib/keyboard'
import { GLOBAL } from './global'
import { Player } from './obj/player'
import { hideElement, showElement, selectedBlueprints, updateCompoundButtons, selectedCompound, cookieInputs, mouseX, mouseY } from './app'
import { socket, objects, teamColors } from './socket'
import { BLUEPRINTS } from './obj/blueprints'
import { TILES, MAP_LAYOUT, TILE_NAMES } from './obj/tiles'
import { requestCreateCompound } from './obj/create'
import { MapTile } from './obj/maptile'
import { joystick } from './app'

export var isSetup // True after the stage is fully set up
export var player // The player being controlled by this client
export var screenCenterX // X-coordinate of the center of the screen
export var screenCenterY // Y-coordinate of the center of the screen
export var app // Pixi app
export var spritesheet // Spritesheet containing all sprites that need to be loaded

export let mouseDown = false // True if mouse is pressed down
let inGame = false // True after game has begun
let esc, space, blueprintKeys, moveKeys // Key handlers
let streamID = 0 // Current stream compound number. Resets when mouse/space is released; otherwise increments by one every time a compound is created.

export function loadTextures () {
	if (!isSetup) {
		// Initialization
		let type = (PIXI.utils.isWebGLSupported()) ? 'WebGL' : 'canvas'
		PIXI.utils.sayHello(type)

		// Create a Pixi Application
		app = new PIXI.Application(0, 0, {
			view: document.getElementById('gameView')
		})
		// Add the canvas that Pixi automatically created for you to the HTML document
		// document.body.appendChild(app.view);

		// Renderer settings
		app.renderer.autoResize = true
		app.renderer.resize(window.innerWidth, window.innerHeight)
		screenCenterX = window.innerWidth / 2 - GLOBAL.PLAYER_RADIUS
		screenCenterY = window.innerHeight / 2 - GLOBAL.PLAYER_RADIUS

		// Load resources if not already loaded
		// let TEXTURES = []
		// TEXTURES.push(GLOBAL.IGNITE_SPRITE)
		// for (let bp in BLUEPRINTS) {
		// 	// Prevent duplicate textures from being loaded
		// 	if (TEXTURES.indexOf(BLUEPRINTS[bp].texture) < 0) {
		// 		TEXTURES.push(BLUEPRINTS[bp].texture)
		// 	}
		// 	if (BLUEPRINTS[bp].params.splashImage !== undefined && TEXTURES.indexOf(BLUEPRINTS[bp].params.splashImage) < 0) {
		// 		TEXTURES.push(BLUEPRINTS[bp].params.splashImage)
		// 	}
		// }
		// for (let atom of GLOBAL.ATOM_SPRITES) {
		// 	if (TEXTURES.indexOf(atom) < 0) {
		// 		TEXTURES.push(atom)
		// 	}
		// }
		// for (let tile in TILES) {
		// 	if (TEXTURES.indexOf(GLOBAL.TILE_TEXTURE_DIR + TILES[tile].texture) < 0) {
		// 		TEXTURES.push(GLOBAL.TILE_TEXTURE_DIR + TILES[tile].texture)
		// 	}
		// }
		// console.log(TEXTURES)

		// Initiate resource loading
		if (Object.keys(PIXI.loader.resources).length < 1) {
			PIXI.loader
				.add(GLOBAL.SPRITESHEET_DIR)
				.load(registerCallbacks)
		}
	}

	// If already initialized, use existing app variable
	if (isSetup) {
		console.info('Stage already initialized!')
		clearStage()
		registerCallbacks()
	}
}

/**
 * Sets up the stage. Call after init(), and begins the draw() loop once complete.
 */
function registerCallbacks () {
	if (!isSetup) {
		// Set up key listeners
		esc = keyboard(GLOBAL.KEY_ESC)
		space = keyboard(GLOBAL.KEY_SPACE)

		// All the movement keys for easy access
		moveKeys = [
			keyboard(GLOBAL.KEY_A), // Left
			keyboard(GLOBAL.KEY_D), // Right
			keyboard(GLOBAL.KEY_W), // Up
			keyboard(GLOBAL.KEY_S) // Down
		]

		// Set up the blueprint key listeners
		blueprintKeys = [
			keyboard(GLOBAL.KEY_1),
			keyboard(GLOBAL.KEY_2),
			keyboard(GLOBAL.KEY_3),
			keyboard(GLOBAL.KEY_4)
		]

		// Escape key setup
		esc.press = () => {
			if (isFocused()) {
				if (document.activeElement !== document.getElementById('chatInput')) {
					toggleMenu()
				}
				else {
					document.getElementById('chatInput').blur()
				}
			}
		}

		// Chat box styling on select
		document.getElementById('chatInput').onfocus = () => {
			document.getElementById('chatbox').style.boxShadow = '0px 0px 1rem 0px #311B92'
		}

		document.getElementById('chatInput').onblur = () => {
			document.getElementById('chatbox').style.boxShadow = '0px 0px 1rem 0px rgba(180,180,180)'
		}

		// Bind each blueprint key
		for (let key in blueprintKeys) {
			blueprintKeys[key].press = () => {
				if (isFocused() && inGame) {
					updateCompoundButtons(key)
				}
			}
		}

		// Background
		app.renderer.backgroundColor = 0xFFFFFF

		// Resize
		document.getElementsByTagName('body')[0].onresize = () => {
			app.renderer.resize(window.innerWidth, window.innerHeight)
			screenCenterX = window.innerWidth / 2 - GLOBAL.PLAYER_RADIUS
			screenCenterY = window.innerHeight / 2 - GLOBAL.PLAYER_RADIUS
			player.x = screenCenterX
			player.y = screenCenterY
		}

		// Assign spritesheet object
		spritesheet = PIXI.loader.resources[GLOBAL.SPRITESHEET_DIR].spritesheet
		console.log(spritesheet)

		// Begin game loop
		app.ticker.add(delta => draw(delta))
	}

	isSetup = true

	// Draw map
	for (let row = 0; row < MAP_LAYOUT.length; row++) {
		for (let col = 0; col < MAP_LAYOUT[0].length; col++) {
			let tileName = 'tile_' + col + '_' + (MAP_LAYOUT.length - row - 1)
			if (objects.tiles[tileName] === undefined || objects.tiles[tileName] === null) {
				if (TILE_NAMES[MAP_LAYOUT[row][col]] !== undefined) {
					objects.tiles[tileName] = new MapTile(TILE_NAMES[MAP_LAYOUT[row][col]], col, MAP_LAYOUT.length - row - 1)
				}
				else {
					throw new Error('Tile ' + MAP_LAYOUT[row][col] + ' could not be resolved to a name.')
				}
			}
		}
	}

	showGameUI()
}

/**
 * Called once per frame. Updates all moving sprites on the stage.
 * Also checks key inputs.
 * @param {number} delta Time value from Pixi
 */
function draw (delta) {
	// Handle this player and movement
	if (player !== undefined) {
		// Make sure player is not in chat before checking move
		if (isFocused() && inGame) {
			// Keyboard based controls

			if ((moveKeys[0].isDown || joystick.mobileKey.leftDown === true) && player.vx > -GLOBAL.MAX_SPEED * player.speedMult) { // Left
				mobileMovement('left')
			}
			if ((moveKeys[1].isDown || joystick.mobileKey.rightDown === true) && player.vx < GLOBAL.MAX_SPEED * player.speedMult) { // Right
				mobileMovement('right')
			}
			if ((moveKeys[2].isDown || joystick.mobileKey.upDown === true) && player.vy < GLOBAL.MAX_SPEED * player.speedMult) { // Up
				mobileMovement('up')
			}
			if ((moveKeys[3].isDown || joystick.mobileKey.downDown === true) && player.vy > -GLOBAL.MAX_SPEED * player.speedMult) { // Down
				mobileMovement('down')
			}
			player.isMoving = false
			for (let key of moveKeys) {
				if (key.isDown) {
					player.isMoving = true
				}
			}
		}
		else {
			player.isMoving = false

			// Because the document is not focused disable all keys(Stops moving!)
			for (let key in moveKeys) {
				moveKeys[key].isDown = false
				moveKeys[key].isUp = true
			}
		}

		// Slow down gradually - unaffected by chat input
		if (!moveKeys[2].isDown && !moveKeys[3].isDown) {
			player.vy *= GLOBAL.VELOCITY_STEP
		}
		if (!moveKeys[0].isDown && !moveKeys[1].isDown) {
			player.vx *= GLOBAL.VELOCITY_STEP
		}

		// Shooting
		space.press = () => {
			if (selectedBlueprints[selectedCompound].type !== 'stream') {
				shootHandler({ clientX: mouseX, clientY: mouseY }, false)
			}
		}

		// Streams
		if ((space.isDown || mouseDown) && selectedBlueprints[selectedCompound].type === 'stream') {
			shootHandler({ clientX: mouseX, clientY: mouseY }, true)
		}

		// Reset stream count when space key is released
		space.release = () => {
			streamID = 0
		}

		// Move player
		player.tick()

		// Send coordinates
		socket.emit('move', {
			type: 'players',
			id: player.id,
			posX: player.posX,
			posY: player.posY,
			vx: player.vx,
			vy: player.vy
		})
	}

	// Handle objects except for this player
	for (let objType in objects) {
		for (let obj in objects[objType]) {
			if (objType !== 'players' || player !== objects[objType][obj]) {
				objects[objType][obj].tick()
			}
		}
	}
}

/**
 * Shows or hides the in-game menu box
 */
function toggleMenu () {
	if (document.getElementById('menubox').offsetParent === null) {
		showElement('menubox')
	}
	else {
		hideElement('menubox')
	}
}

/**
 * Remove all elements pre-rendered on stage.
 */
function clearStage () {
	for (var i = app.stage.children.length - 1; i >= 0; i--) {
		app.stage.removeChild(app.stage.children[i])
	}
}

/**
 * Destroy everything in PIXI. DANGEROUS avoid!
 */
export function destroyPIXI () {
	app.destroy(true, {
		children: true,
		texture: true,
		baseTexture: true
	})
	PIXI.loader.reset()
	isSetup = false
	app = undefined
}

/**
 * Call this function to hide loading div and show UI
 */
export function showGameUI () {
	// Hide loading screen
	hideElement('loading')
	if (!inGame) {
		showElement('lobby')
	}
}

/**
 * Creates a Player instance once the stage is fully set up and ready.
 * @param {*} data Starting values to assign to the player. Generated from server
 * @returns {Player} The Player object that was created
 */
export function createPlayer (data) {
	if (isSetup) {
		console.log('create player ' + data.id)
		// console.log(data)
		let newPlayer = new Player(spritesheet.textures[teamColors[data.team] + 'player.png'], data.id, data.name, data.room, data.team, data.health, data.posX, data.posY, data.vx, data.vy)
		if (data.id === socket.id) {
			player = newPlayer
		}

		return newPlayer
	}
}

/**
 * If the document is Focused return true otherwise false
 **/
export function isFocused () {
	return document.hasFocus() && document.activeElement !== document.getElementById('chatInput')
}

/**
 * Starts the game after lobby closes.
 * @param {boolean} emit True if this client should emit the event to the server.
 * @param {*} teams Array of teams on the scoreboard.
 */
export function startGame (emit, teams) {
	setIngame(true)
	hideElement('lobby')
	showElement('hud')
	if (emit) {
		socket.emit('startGame', {
			start: true
		})
	}

	// Init scoreboard
	if (teams !== undefined) {
		// Reset scoreboard from previous rounds
		document.getElementById('score').innerHTML = ''

		for (let i = 0; i < teams.length; i++) {
			document.getElementById('score').innerHTML += '-<span id="team-score-' + i + '">0</span>'
			document.getElementById('team-score-' + i).style.color = '#' + GLOBAL.TEAM_COLORS[i]
		}
		document.getElementById('score').style.fontSize = '3vw'
		document.getElementById('score').innerHTML += '-'
	}
}

/**
 * Sets the value of inGame
 * @param {boolean} newValue Value to set inGame to
 */
export function setIngame (newValue) {
	inGame = newValue
}

/**
 * @returns {boolean} Returns inGame variable
 */
export function getIngame () {
	return inGame
}

/**
 * Called on mouse up from app.js
 * @param {*} e Click event
 */
export function mouseUpHandler (e) {
	mouseDown = true
	if (selectedBlueprints[selectedCompound] && selectedBlueprints[selectedCompound].type !== 'stream') {
		shootHandler(e, false)
	}
}
/**
 * Called on mouse down from app.js
 * @param {*} e Click event
 */
export function mouseDownHandler (e) {
	mouseDown = false
	streamID = 0
}

/**
 * Handles shooting mechanics on mouse/spacebar click/hold.
 * @param {*} e Click event
 * @param {boolean} stream True if sending a stream (such as water); false otherwise.
 */
function shootHandler (e, stream) {
	if (isFocused() && inGame) {
		if (stream) {
			streamID++
		}
		requestCreateCompound(selectedBlueprints[selectedCompound], e.clientX, e.clientY, streamID)
	}
}

// actually name this better bro
export function mobileMovement (direction) {
	if (direction === 'up') {
		player.vy += GLOBAL.VELOCITY_STEP * player.speedMult
	}
	if (direction === 'down') {
		player.vy += -GLOBAL.VELOCITY_STEP * player.speedMult
	}
	if (direction === 'right') {
		player.vx += GLOBAL.VELOCITY_STEP * player.speedMult
	}
	if (direction === 'left') {
		player.vx += -GLOBAL.VELOCITY_STEP * player.speedMult
	}
}
