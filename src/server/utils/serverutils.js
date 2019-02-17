import { getField } from '../server'
import { GLOBAL } from '../../client/js/global'

/**
 * Misc. standalone utilities for the server.
 */

/**
* Returns a random number between between 10000000 and 99999999, inclusive.
* TODO Make every ID guaranteed unique
* @returns random id between 10000000 and 99999999
*/
export function generateID () {
	return Math.floor(Math.random() * 90000000) + 10000000
}

/**
 * Returns the index of the given team within the team array of the given room.
 * @param {string} room The room name to check
 * @param {string} teamName The team name to return the number of
 */
export function getTeamNumber (room, teamName) {
	for (let i = 0; i < getField(['rooms', room, 'teams']).length; i++) {
		if (getField(['rooms', room, 'teams'])[i].name === teamName) {
			return i
		}
	}

	return -1 // Team not found
}

/**
 * Returns the team colors object (see client socket.js for more information on the format)
 * @param {string} room The room name to check
 */
export function getTeamColors (room) {
	let teamObj = getField(['rooms', room, 'teams'])
	let result = {}
	for (let i = 0; i < 4; i++) {
		if (teamObj[i]) {
			result[teamObj[i].name] = i
		}
	}
	return result
}

/**
 * Returns the serverside ID of the tile at this location.
 * If the tile is not capturable, then returns false.
 * @param {*} globalLocation Contains globalX and globalY. Location on the map
 * @param {string} room The room name to check
 */
export function getTileID (globalLocation, room) {
	for (let tileID in getField(['rooms', room, 'tiles'])) {
		let tile = getField(['rooms', room, 'tiles', tileID])
		if (tile.globalX === globalLocation.globalX && tile.globalY === globalLocation.globalY) {
			return tileID
		}
	}

	return false
}
