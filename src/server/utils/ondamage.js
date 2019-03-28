import { GLOBAL } from '../../client/js/global'
import { getField, setField, incrementField } from '../server'
import { getTeamNumber } from './serverutils'
import { tmpdir } from 'os'
import { spawnAtom } from './atoms'

/**
 * ondamage.js
 * Contains functions:
 *  - damage() Runs when a player gets damaged. Updates scores and checks if a player has been killed.
 *  - splash() Runs when a collision needs to cause splash damage. Creates explosion effect and deals extra damage.
 */

/**
 * Changes the health of the player by the amount given.
 * @param {*} data The data sent by the client. Contains:
 *  - damage (number)
 *  - player (id string of player that was hit)
 *  - id (id string of compound)
 *  - sentBy (id string of player that sent compound)
 * @param {string} room This room.
 * @param {*} socket This socket.
 * Must include the player id and amount to damage.
 * Amount may be negative (for health boost).
 */
export function damage (data, room, socket) {
	let thisRoom = getField(['rooms', room])
	let thisPlayer = thisRoom.players[data.player]

	if (thisPlayer !== undefined) {
		// thisPlayer.health -= data.damage;
		if (data.damage > thisPlayer.shield) {
			setField(thisPlayer.health - data.damage + thisPlayer.shield, ['rooms', room, 'players', data.player, 'health'])
			// Send damage indicator data
			socket.emit('serverSendDamageIndicator', {
				damage: data.damage - thisPlayer.shield,
				posX: thisPlayer.posX,
				posY: thisPlayer.posY
			})
		}
		else {
			socket.emit('serverSendDamageIndicator', {
				damage: 0,
				posX: thisPlayer.posX,
				posY: thisPlayer.posY
			})
		}

		// Add damage to database
		if (thisPlayer.damagedBy[data.sentBy] === undefined) {
			setField(0, ['rooms', room, 'players', data.player, 'damagedBy', data.sentBy])
		}
		// thisPlayer.damagedBy[data.sentBy] += data.damage;
		setField(thisPlayer.damagedBy[data.sentBy] + data.damage, ['rooms', room, 'players', data.player, 'damagedBy', data.sentBy])

		// Check if the player has died.
		if (thisPlayer.health <= 0) {
			// console.log(thisRoom.teams.indexOf(socket.handshake.query.team));

			// Releases atoms and deletes the entire atoms array in player
			for (let at in thisPlayer.atomList) {
				for (let i = 0; i < GLOBAL.MAX_DEATH_ATOMS && i < thisPlayer.atomList[at]; i++) {
					spawnAtom(thisPlayer.posX, thisPlayer.posY, at, room, false)
				}
			}
			for (let at in thisPlayer.atomList) {
				setField(0, ['rooms', room, 'players', thisPlayer, 'atomList', at])
			}

			// Set defense to 0
			setField(0, ['rooms', room, 'players', data.player, 'shield'])

			// Reset position to spawnpoint
			setField(GLOBAL.SPAWN_POINTS[getTeamNumber(room, thisPlayer.team)].x * GLOBAL.GRID_SPACING * 2, ['rooms', room, 'players', data.player, 'posX'])
			setField(GLOBAL.SPAWN_POINTS[getTeamNumber(room, thisPlayer.team)].y * GLOBAL.GRID_SPACING * 2, ['rooms', room, 'players', data.player, 'posY'])
			setField(GLOBAL.MAX_HEALTH, ['rooms', room, 'players', data.player, 'health'])
			setField(true, ['rooms', room, 'players', data.player, 'dead']) // This will be reset when it has been verified that the player has been placed at the proper spawnpoint

			// Send player death info to client
			if (socket.id === data.player) {
				let pl = getField(['rooms', room, 'players', data.player])
				socket.emit('serverSendPlayerDeath', { posX: pl.posX, posY: pl.posY, vx: pl.vx, vy: pl.vy })

				// Announce death. TODO make some cool messages
				socket.emit('serverAnnouncement', {
					message: pl.name + ' was obliterated by ' + getField(['rooms', room, 'players', data.sentBy, 'name']),
					sendingTeam: pl.team
				})
				socket.to(room).emit('serverAnnouncement', {
					message: pl.name + ' was obliterated by ' + getField(['rooms', room, 'players', data.sentBy, 'name']),
					sendingTeam: pl.team
				})

				// Check if the nucleus has died
				if (getField(['rooms', room, 'tiles', 'n' + getTeamNumber(room, pl.team), 'captured'])) {
					// Announce final death
					socket.emit('serverAnnouncement', {
						message: 'FINAL KILL!!!',
						sendingTeam: pl.team
					})
					socket.to(room).emit('serverAnnouncement', {
						message: 'FINAL KILL!!!',
						sendingTeam: pl.team
					})

					setField(true, ['rooms', room, 'players', data.player, 'spectating'])
				}
			}

			// Award points (TODO)_
			if (data.id !== undefined) {
				// Read damagedBy to award points, clear in the process
				let max = null
				let dataToSend
				for (let pl in thisPlayer.damagedBy) {
					dataToSend = {
						player: pl,
						teamSlot: getTeamNumber(room, thisRoom.compounds[data.id].sendingTeam),
						increment: GLOBAL.ASSIST_SCORE,
						kill: false
					}

					// Add to team score, checking if team score is initialized
					setField((thisRoom.teams[dataToSend.teamSlot].score === undefined) ? dataToSend.increment : thisRoom.teams[dataToSend.teamSlot].score + dataToSend.increment, ['rooms', room, 'teams', dataToSend.teamSlot, 'score'])

					socket.to(room).broadcast.emit('serverSendScoreUpdate', dataToSend)
					socket.emit('serverSendScoreUpdate', dataToSend)
					if (max === null || thisPlayer.damagedBy[pl] > thisPlayer.damagedBy[max]) {
						max = pl
					}
				}

				// Add to score of person who dealt the most damage
				dataToSend.player = max
				dataToSend.increment = GLOBAL.KILL_SCORE - GLOBAL.ASSIST_SCORE
				dataToSend.kill = true
				socket.to(room).broadcast.emit('serverSendScoreUpdate', dataToSend)
				socket.emit('serverSendScoreUpdate', dataToSend)

				// Add to team score
				incrementField(dataToSend.increment, ['rooms', room, 'teams', dataToSend.teamSlot, 'score'])

				// Clear damagedBy values
				for (let pl in thisPlayer.damagedBy) {
					setField(0, ['rooms', room, 'players', data.player, 'damagedBy', pl])
				}

				// Check if a team won
				let highScores = [] // Possible winning teams
				let maxScore = 0
				for (let tm of thisRoom.teams) {
					if (tm.score >= GLOBAL.WINNING_SCORE) {
						highScores.push(tm)
						if (maxScore < tm.score) {
							maxScore = tm.score
						}
					}
				}
				for (let winningTm of highScores) {
					if (winningTm.score === maxScore) {
						let dataToSend = {
							winner: winningTm
							// teamScore: thisRoom.teams[dataToSend.teamSlot].score
							// other data here TODO post ranking
						}
						socket.to(room).broadcast.emit('serverSendWinner', dataToSend)
						socket.emit('serverSendWinner', dataToSend)

						// Close room after delay (kick all players)
						setTimeout(() => {
							socket.emit('serverSendDisconnect', {})
							socket.to(room).broadcast.emit('serverSendDisconnect', {})
						}, GLOBAL.ROOM_DELETE_DELAY)
					}
				}
			}
		}
	}
	else {
		console.warn('Player of ID ' + data.player + ' couldn\'t be damaged because they don\'t exist!')
	}
}

export function damageTile (tileID, damageAmount, player, room, socket) {
	incrementField(-damageAmount, ['rooms', room, 'tiles', tileID, 'health'])

	// console.log('tile ' + tileID + ' is now at ' + getField(['rooms', room, 'tiles', tileID, 'health']))
	let hpData = {
		newHealth: getField(['rooms', room, 'tiles', tileID, 'health']),
		tileX: getField(['rooms', room, 'tiles', tileID, 'globalX']),
		tileY: getField(['rooms', room, 'tiles', tileID, 'globalY'])
	}
	socket.to(room).emit('serverSendTileHealth', hpData)
	socket.emit('serverSendTileHealth', hpData)

	// Check if tile is fully captured
	if (getField(['rooms', room, 'tiles', tileID, 'health']) <= 0) {
		for (let i = 0; i < 3; i++) {
			if (getField(['rooms', room, 'teams', i]).name === getField(['rooms', room, 'players', player, 'team'])) {
				// Notify clients of texture change
				let data = {
					teamNumber: i,
					tileX: getField(['rooms', room, 'tiles', tileID, 'globalX']),
					tileY: getField(['rooms', room, 'tiles', tileID, 'globalY'])
				}
				socket.to(room).emit('serverSendTileCapture', data)
				socket.emit('serverSendTileCapture', data)
				let tileCaptureMSG = {
					message: 'A ' + getField(['rooms', room, 'tiles', tileID, 'type']) + ' has been captured by ' + getField(['rooms', room, 'players', player, 'name']),
					sendingTeam: getField(['rooms', room, 'players', player, 'team'])
				}
				socket.to(room).emit('serverAnnouncement', tileCaptureMSG)
				socket.emit('serverAnnouncement', tileCaptureMSG)

				// Set capture status
				setField(true, ['rooms', room, 'tiles', tileID, 'captured'])
				setField(getField(['rooms', room, 'players', player, 'team']), ['rooms', room, 'tiles', tileID, 'owner'])

				// Distribute points
				incrementField(GLOBAL.CAPTURE_SCORE, ['rooms', room, 'teams', i, 'score'])

				// Reset health
				setField(GLOBAL[('MAX_' + getField(['rooms', room, 'tiles', tileID, 'type']) + '_HEALTH').toUpperCase()], ['rooms', room, 'tiles', tileID, 'health'])
				let hpData = {
					newHealth: getField(['rooms', room, 'tiles', tileID, 'health']),
					tileX: getField(['rooms', room, 'tiles', tileID, 'globalX']),
					tileY: getField(['rooms', room, 'tiles', tileID, 'globalY'])
				}
				socket.to(room).emit('serverSendTileHealth', hpData)
				socket.emit('serverSendTileHealth', hpData)
				return true
			}
		}
	}
}

/**
 * TODO
 */
export function splash () {

}
