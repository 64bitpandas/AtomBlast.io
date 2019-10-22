/**
 * App.js is responsible for connecting the UI with the game functionality.
 * Most of the functionality is used for the main menu and connecting/disconnecting behavior.
 */
'use strict'
import { GLOBAL } from './global.js'
import * as cookies from './lib/cookies.js'
import { BLUEPRINTS, TOOLTIPS } from './obj/blueprints.js'
import { beginConnection, disconnect, teamColors } from './socket.js'
import { player, setIngame, startGame, mouseUpHandler, mouseDownHandler } from './pixigame.js'
import swal from 'sweetalert'
import VirtualJoystick from './lib/mobilejoystick.js'

// Array containing all inputs which require cookies, and their values
export const cookieInputs = GLOBAL.COOKIES.map(val => document.getElementById(val))

// Array containing the four chosen blueprints
export var selectedBlueprints = new Array(GLOBAL.BP_MAX)

const nickErrorText = document.getElementById('nickErrorText')

// Mouse position - used for tooltips
export let mouseX, mouseY

// Currently selected blueprint slot
export let selectedCompound = 0

let selectedSlot

export let music

export let sfx

let errorSound = new Sound('assets/sfx/error.mp3')

export let joystick = new VirtualJoystick()

// Starts the game if the name is valid.
function joinGame() {
	if (!allBlueprintsSelected()) {
		swal('Blueprint(s) not selected', 'Make sure all your blueprint slots are filled before joining a game!', 'error')
	}
	// check if the nick is valid
	else if (validNick()) {
		// Set cookies for inputs
		for (let i = 0; i < GLOBAL.INPUT_COUNT; i++) {
			cookies.setCookie(GLOBAL.COOKIES[i], cookieInputs[i].value, GLOBAL.COOKIE_DAYS)
		}

		// Use cookies to set the ingame blueprint slot values
		for (let i = 1; i <= GLOBAL.BP_MAX; i++) {
			selectedBlueprints[i - 1] = BLUEPRINTS[cookies.getCookie(GLOBAL.COOKIES[i - 1 + GLOBAL.INPUT_COUNT])]

			// Check whether blueprint is selected!
			document.getElementById('bp-ingame-' + i).innerHTML = selectedBlueprints[i - 1].name + ' (' + getCompoundFormula(selectedBlueprints[i - 1]) + ')'
		}

		// Show game window
		showElement('gameAreaWrapper')
		hideElement('startMenuWrapper')

		// Show loading screen
		showElement('loading')

		// Cookie Inputs: 0=player, 1=room, 2=team

		// Connect to server
		beginConnection()
	}
	else {
		nickErrorText.style.display = 'inline'
	}
}

/** check if nick is valid alphanumeric characters (and underscores)
 * @returns true if the nickname is valid, false otherwise
 */
function validNick() {
	const regex = /^(\w|_|-| |!|\.|\?){2,16}$/
	for (let i = 0; i < GLOBAL.INPUT_COUNT; i++) {
		if (regex.exec(cookieInputs[i].value) === null && !(i === 1 && cookieInputs[7].value !== 'private')) {
			return false
		}
	}

	return true
}

/**
 * Returns true if all four blueprint slots are filled.
 */
function allBlueprintsSelected() {
	for (let i = GLOBAL.INPUT_COUNT - 1; i < GLOBAL.INPUT_COUNT + GLOBAL.BP_MAX; i++) {
		if (cookieInputs[i].innerHTML.substring(0, 1) === '-') {
			return false
		}
	}
	return true
}

/**
 * Onload function. Initializes the menu screen, creates click events, and loads cookies.
 */
window.onload = () => {
	// Patch logo for firefox
	if (typeof InstallTrigger !== 'undefined') { document.getElementById('logo').innerHTML = `<img src="assets/logos/logo.svg" id="logo-firefox">`; } // eslint-disable-line

	// Cookie loading - create array of all cookie values
	let cookieValues = GLOBAL.COOKIES.map(val => cookies.getCookie(val))

	// Continue loading cookies only if it exists
	let i = 0
	for (let cookie of cookieValues) {
		if (cookie !== null && cookie.length > 0) {
			if (cookieInputs[i].tagName === 'INPUT' || cookieInputs[i].tagName === 'SELECT') {
				cookieInputs[i].value = cookie
			}
			else if (cookieInputs[i].tagName === 'BUTTON' && BLUEPRINTS[cookie] !== undefined) {
				cookieInputs[i].innerHTML = BLUEPRINTS[cookie].name
			}
		}
		i++
	}

	// Add listeners to start game to enter key and button click

	document.addEventListener('pointerdown', mouseUpHandler)
	document.addEventListener('pointerup', mouseDownHandler)

	bindHandler('startButton', function () {
		joinGame()
	})

	bindHandler('quitButton', function () {
		quitGame('You have left the game.', false)
	})

	bindHandler('exitButton', function () {
		quitGame('The game has ended.', false)
		hideElement('winner-panel')
	})

	bindHandler('resumeButton', function () {
		hideElement('menubox')
	})

	bindHandler('optionsButton', function () {
		errorSound.play()
		swal('', 'This feature is not implemented.', 'info')
	})

	bindHandler('controlsButton', function () {
		errorSound.play()
		swal('', 'This feature is not implemented.', 'info')
	})

	bindHandler('creditsButton', function () {
		swal('', 'Created by BananiumLabs.com', 'info')
	})

	bindHandler('btn-start-game', function () {
		console.log('starting game')
		startGame(true)
	})

	bindHandler('newsBox', function () {
		swal('', 'hello world', 'info')
	})

	// document.getElementById('gameView', onClick, false);

	for (let i = 0; i < selectedBlueprints.length; i++) {
		bindHandler('bp-ingame-' + (i + 1), function () {
			selectedCompound = i
			updateCompoundButtons()
		})
	}

	// Set up the blueprint slot buttons
	for (let i = 1; i <= GLOBAL.BP_MAX; i++) {
		document.getElementById('bp-slot-' + i).onclick = () => {
			showElement('bp-select')
			document.getElementById('bp-select-header').innerHTML = GLOBAL.BP_SELECT + i
			selectedSlot = i
		}
	}

	document.getElementById('btn-close').onclick = () => {
		hideElement('bp-select')
	}

	// Set up blueprint selection buttons
	for (let blueprint in BLUEPRINTS) {
		if (BLUEPRINTS[blueprint].unlocked) {
			let bp = BLUEPRINTS[blueprint]

			document.getElementById('blueprint-wrapper').innerHTML +=
				`
				<button onmouseenter="tooltipFollow(this)" class="button width-override col-6 col-12-sm btn-blueprint blueprint-${bp.type}" id="btn-blueprint-${blueprint}">
					<p>${bp.name}</p>
					<h6>-${getCompoundFormula(bp)} (${bp.type.charAt(0).toUpperCase() + bp.type.slice(1)})-</h6>
					<img src="${GLOBAL.COMPOUND_DIR + bp.texture}">
					<span class="tooltip">${bp.tooltip}</span>
				</button>
				`
		}
	}
	// Blueprint Slots
	for (let btn of document.getElementsByClassName('btn-blueprint')) {
		btn.onclick = () => {
			let blueprint = btn.id.substring(14) // Name of the blueprint, the first 14 characters are 'btn-blueprint-'
			console.log(blueprint + ' selected in slot ' + selectedSlot)
			document.getElementById('bp-slot-' + selectedSlot).innerHTML = BLUEPRINTS[blueprint].name
			hideElement('bp-select')
			cookies.setCookie(GLOBAL.COOKIES[selectedSlot + GLOBAL.INPUT_COUNT - 1], blueprint, GLOBAL.COOKIE_DAYS)
		}
	}

	// Add enter listeners for all inputs
	for (let i = 0; i < GLOBAL.INPUT_COUNT; i++) {
		cookieInputs[i].addEventListener('keypress', e => {
			const key = e.which || e.keyCode

			if (key === GLOBAL.KEY_ENTER) {
				joinGame()
			}
		})
	}

	// Behavior when room type is changed
	if (cookieInputs[7].value !== 'private') {
		hideElement('room')
	}
	else {
		showElement('room')
	}

	cookieInputs[7].onchange = () => {
		if (cookieInputs[7].value === 'private') {
			showElement('room')
		}
		else {
			hideElement('room')
		}

		cookies.setCookie(GLOBAL.COOKIES[7], cookieInputs[7].value, GLOBAL.COOKIE_DAYS)
	}

	// Server changed
	cookieInputs[8].onchange = () => {
		cookies.setCookie(GLOBAL.COOKIES[8], cookieInputs[8].value, GLOBAL.COOKIE_DAYS)
	}

	document.getElementById('team-option').onchange = document.getElementById('solo').onchange = () => {
		console.log('change')
		if (document.querySelector('input[name="queue-type"]:checked').id === 'team-option') {
			showElement('team')
		}
		else {
			hideElement('team')
		}
	}

	playMusic()
}

/**
 * Sets mouse positions for tooltip
 */
window.onmousemove = (e) => {
	mouseX = e.clientX
	mouseY = e.clientY
}

/**
 * Loop main menu music
 */
function playMusic() {
	music = document.createElement('audio')
	HTMLElement.prototype.randomSelectMM = function () {
		music.src = GLOBAL.MAINMENU_MUSICLIST[Math.floor(Math.random() * GLOBAL.MAINMENU_MUSICLIST.length)]
	}
	music.randomSelectMM()
	music.style.display = 'none'	// fix ios device
	// music.autoplay = true
	music.type = 'audio/mpeg'
	music.id = 'mainmenu'

	music.onended = function () {
		music.randomSelectMM()
		music.play()
	}
	// music.loop = true
	// audio.onended = function() {
	// 	audio.remove()
	// };
	document.body.appendChild(music)
	let audioPlay = document.getElementById('mainmenu').play()

	if (audioPlay !== undefined) {
		audioPlay.then(_ => {
			console.log('Music started')
		}).catch(error => {
			console.warn(error)
			console.log('Music start prevented. Starting Bypass method.')
			// How this works is that the iframe with audio
			let bypassElement = document.createElement('iframe')
			bypassElement.src = 'assets/sfx/silence.mp3'
			bypassElement.allow = 'autoplay'
			bypassElement.type = 'audio/mpeg'
			bypassElement.id = 'bypassaudio'
			document.body.appendChild(bypassElement)
			document.getElementById('bypassaudio').addEventListener('load', function () {
				document.getElementById('mainmenu').play()
				document.getElementById('bypassaudio').remove()
			})
		})
	}
}

function Sound(src) {
	this.sound = document.createElement('audio')
	this.sound.src = src
	this.sound.setAttribute('preload', 'auto')
	this.sound.setAttribute('controls', 'none')
	this.sound.style.display = 'none'
	document.body.appendChild(this.sound)
	this.play = function () {
		this.sound.currentTime = 0
		this.sound.play()
	}
	this.stop = function () {
		this.sound.pause()
	}
}

/**
 * Transitions from in-game displays to the main menu.
 * @param {string} msg The message to be displayed in the menu after disconnect.
 * @param {boolean} isError True if the game quit was due to an error; false otherwise.
 */
export function quitGame(msg, isError) {
	// Disconnect from server
	disconnect()

	// Set status of ingame
	setIngame(false)

	// menu
	hideElement('gameAreaWrapper')
	hideElement('hud')
	hideElement('menubox')
	showElement('startMenuWrapper')
	hideElement('lobby')
	hideElement('winner-panel')
	swal('Disconnected from Game', msg, (isError) ? 'error' : 'info')
}

/**
 * Binds handlerMethod to onclick event for element id.
 * @param {string} id
 * @param {function} handlerMethod
 */
export function bindHandler(id, handlerMethod) {
	document.getElementById(id).onclick = handlerMethod
}

/**
 * Displays a hidden element
 * @param {string} el The id of the element to show
 */
export function showElement(el) {
	document.getElementById(el).style.display = 'block'
	if (el === 'startMenuWrapper') {
		music.randomSelectMM()
		music.currentTime = 0
		music.play()
	}
	else if (el === 'lobby') {	// In lobby
		music.pause()	// Pause main menu music
		// music.currentTime = 9999
	}
	else if (el === 'gameAreaWrapper') {	// In game
		music.pause()	// Pause main menu music
		// music.currentTime = 9999
	}
}

/**
 * Hides a visible element
 * @param {string} el The id of the element to hide
 */
export function hideElement(el) {
	document.getElementById(el).style.display = 'none'
}

/**
 * Makes tooltip follow the mouse. Call when a button is hovered.
 * @param {HTMLElement} button The element reference for the button currently being hovered.
 */
window.tooltipFollow = (button) => {
	let tooltip = button.getElementsByClassName('tooltip')[0]
	tooltip.style.top = (mouseY - 150) + 'px'
	tooltip.style.left = (mouseX - 150) + 'px'
}

// Toggle compound stats and info tooltips
let compoundStats = false

window.onkeydown = (e) => {
	// Only detect if the blueprint select screen is up
	if (document.getElementById('bp-select').style.display === 'block' && e.key === 'Shift') {
		compoundStats = !compoundStats
		// Iterate through all compound buttons
		for (let button of document.getElementsByClassName('btn-blueprint')) {
			// Get blueprint from BLUEPRINTS
			let blueprint = Object.values(BLUEPRINTS).filter((obj) => {
				return obj.name === button.getElementsByTagName('p')[0].innerHTML
			})
			blueprint = blueprint[0]

			if (compoundStats) {
				let newTooltip = TOOLTIPS[blueprint.type] + '<br><br>'
				for (let param in blueprint.params) {
					if (!GLOBAL.BP_TOOLTIP_BLACKLIST.includes(param)) {
						let line = ('' + param).replace(/([A-Z])/g, ' $1').replace(/^./, (str) => {
							return str.toUpperCase()
						}) + ': ' + blueprint.params[param] + '<br>'
						newTooltip += line
					}
				}
				button.getElementsByClassName('tooltip')[0].innerHTML = newTooltip
			}
			else {
				button.getElementsByClassName('tooltip')[0].innerHTML = blueprint.tooltip
			}
		}
	}
}

/**
 * Updates the list of atoms that the player holds.
 * Only updates the entry for the particular ID given.
 * @param {string} atomID The ID of the atom to update.
 */
export function updateAtomList(atomID) {
	let list = document.getElementById('atom-count')

	if (document.getElementById('atom-list-' + atomID) === null) {
		let newEntry = document.createElement('li')
		newEntry.setAttribute('id', 'atom-list-' + atomID)
		list.appendChild(newEntry)
	}

	try {
		document.getElementById('atom-list-' + atomID).innerHTML = '' + atomID.charAt(0).toUpperCase() + atomID.substr(1) + ': ' + player.atomList[atomID]
	}
	catch (e) {
		console.warn('Atom ' + atomID + ' could not be updated on the list!')
	}

	updateCompoundButtons() // No need to update selection
}

/**
 *
 * @param {number} selectedSlot The index of the selected slot. 0-3
 */
export function updateCompoundButtons(selectedSlot) {
	if (selectedSlot === undefined) {
		selectedSlot = selectedCompound
	}
	else {
		selectedCompound = parseInt(selectedSlot)
	}

	for (let i = 0; i < selectedBlueprints.length; i++) {
		if (selectedCompound !== i) {
			if (canCraft(selectedBlueprints[i])) {
				document.getElementById('bp-ingame-' + (i + 1)).style.background = '#2ecc71'
			}
			else {
				document.getElementById('bp-ingame-' + (i + 1)).style.background = '#C8C8C8'
			}
		}
		else { // is selected
			if (canCraft(selectedBlueprints[i])) {
				document.getElementById('bp-ingame-' + (i + 1)).style.background = '#003CA8'
			}
			else {
				document.getElementById('bp-ingame-' + (i + 1)).style.background = '#3D66D1'
			}
			document.getElementById('bp-select-label').innerHTML = 'Selected Compound: ' + selectedBlueprints[i].name
		}
	}
}

/**
 * Updates the team scoreboard on screen.
 */
export function updateScores(teamSlot, increment) {
	document.getElementById('team-score-' + teamSlot).innerHTML = parseInt(document.getElementById('team-score-' + teamSlot).innerHTML) + increment
}

/**
 * Run on new player join to sync lobby information
 * @param {*} data The data transferred from server
 */
export function updateLobby(data) {
	// Wipe innerHTML first
	let lobby = document.getElementById('team-display')
	lobby.innerHTML = ''
	for (let player in data.players) {
		if (document.getElementById(data.players[player].team) === null || document.getElementById(data.players[player].team) === undefined) {
			lobby.innerHTML += `
            <div class="col-3">
                <h3 style="color: #${GLOBAL.TEAM_COLORS[teamColors[data.players[player].team]]}">` + data.players[player].team + `</h3>
                <ul id="` + data.players[player].team + `">
                </ul>
            </div>
            `
		}
		let listItem = document.createElement('LI')
		listItem.appendChild(document.createTextNode(data.players[player].name))
		document.getElementById(data.players[player].team).appendChild(listItem)
	}

	// Check if room is startable
	if (data.canStart) {
		document.getElementById('btn-start-game').innerHTML = 'Start Game'
		document.getElementById('btn-start-game').disabled = false
	}
	else {
		document.getElementById('btn-start-game').innerHTML = 'Waiting for Players...'
		document.getElementById('btn-start-game').disabled = true
	}
}

/**
 * Displays the winner panel after a game has concluded.
 * @param {*} data Server sent data, including name and score of winning team.
 */
export function displayWinner(data) {
	// console.log(data);
	document.getElementById('winner-name').innerHTML = data.winner + ' has won!'
	showElement('winner-panel')
}

/**
 * Gets the formatted formula of a compound (e.g. C6H12O6).
 * @param {*} blueprint The blueprint object as defined in blueprints.js
 * @returns {string} The formula of the compound
 */
function getCompoundFormula(blueprint) {
	let formula = ''
	for (let atom in blueprint.atoms) {
		formula += atom.toUpperCase() + ((blueprint.atoms[atom] > 1) ? blueprint.atoms[atom] : '')
	}

	return formula
}

/**
 * Returns true if the player has the materials necessary to create a particular blueprint.
 * ONLY USE FOR BUTTON GRAPHICS!!! True checking is done serverside.
 * @param {string} blueprint The name of the blueprint to check.
 */
function canCraft(blueprint) {
	if (blueprint === undefined) {
		return false
	}
	for (let atom in blueprint.atoms) {
		if (player.atomList[atom] === undefined || player.atomList[atom] < blueprint.atoms[atom]) {
			return false
		}
	}

	return true
}
// Anti debugger on non-debug builds
if (!GLOBAL.DEBUG) {
	console.log = function () {
		console.info('Log disabled. Non-Debug build.')
	}
	// while (true) {
	// 	setTimeout(function () {
	// 		eval('debugger')
	// 	}, 200)
	// }
	setInterval(function () {
		var startTime = performance.now(); var check; var diff
		for (check = 0; check < 1000; check++) {
			console.log(check)
			console.clear()
		}
		diff = performance.now() - startTime
		if (diff > 200) {
			// window.close()
			//   alert('Debugger detected!')

			document.body.innerHTML = '<h1 style="color:red">A critical error has been detected. Please contact the developer with the following information.<br>Error: Production build sec violation.</b></h1>'
			errorSound.play()
			let counter = 0
			setTimeout(function () {
				document.body.innerHTML = '<div style="--a:1px;--b:calc(var(--a) + var(--a));--c:calc(var(--b) + var(--b));--d:calc(var(--c) + var(--c));--e:calc(var(--d) + var(--d));--f:calc(var(--e) + var(--e));--g:calc(var(--f) + var(--f));--h:calc(var(--g) + var(--g));--i:calc(var(--h) + var(--h));--j:calc(var(--i) + var(--i));--k:calc(var(--j) + var(--j));--l:calc(var(--k) + var(--k));--m:calc(var(--l) + var(--l));--n:calc(var(--m) + var(--m));--o:calc(var(--n) + var(--n));--p:calc(var(--o) + var(--o));--q:calc(var(--p) + var(--p));--r:calc(var(--q) + var(--q));--s:calc(var(--r) + var(--r));--t:calc(var(--s) + var(--s));--u:calc(var(--t) + var(--t));--v:calc(var(--u) + var(--u));--w:calc(var(--v) + var(--v));--x:calc(var(--w) + var(--w));--y:calc(var(--x) + var(--x));--z:calc(var(--y) + var(--y));--vf:calc(var(--z) + 1px);border-width:var(--vf);border-style:solid;">error</div>'
				document.body.style.cssText = null
				let buffer = 'nohax'
				while (true) {
					buffer = buffer += buffer
					// for (;;);
					if (counter % 10 === 0) {
						debugger
					}
				}
			}, 100)
		}
	}, 500)
}
