import { incrementField, getField, setField } from '../server'
import { GLOBAL } from '../../client/js/global'

/**
 * Manages experience levels, levelling up, and level tiers.
 * TODO LOTS to do here!!!!!
 */

/**
 * Adds experience to a given player.
 * @param {string} event The name of the event as specified in GLOBAL.EXPERIENCE_VALUES
 * @param {*} socket The socket instance
 * @param {string} room The ID of the room
 * @param {string} player ID of the player
 */
export function addExperience (event, socket, room, player) {
	// Add a specific amount to the players experience
	// Get the index of the Event and then pass it into the values array to get the actual value
	incrementField(GLOBAL.EXPERIENCE_VALUES[event], ['rooms', room, 'players', player, 'experience'])
	//  thisPlayer.experience += GLOBAL.EXPERIENCE_VALUES[data.event];

	// Determine the player's level based on experience
	let oldLevel = getField(['rooms', room, 'players', player, 'level'])
	for (let level of GLOBAL.EXPERIENCE_LEVELS) {
		if (getField(['rooms', room, 'players', player, 'level']) >= level) { setField(GLOBAL.EXPERIENCE_LEVELS.indexOf(level) + 1, ['rooms', room, 'players', player, 'level']) }
	}

	// Check to see if the player leveled up
	if (getField(['rooms', room, 'players', player, 'level']) > oldLevel) {
		socket.emit('levelUp', { newLevel: thisPlayer.level })
	}
}
