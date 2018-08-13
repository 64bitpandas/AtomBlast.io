import { GLOBAL } from '../client/js/global';
import { getField, setField } from './server';
import { getTeamNumber } from './serverutils';

/**
 * Changes the health of the player by the amount given.
 * @param {*} data The data sent by the client.
 * @param {string} room This room.
 * @param {*} socket This socket.
 * Must include the player id and amount to damage.
 * Amount may be negative (for health boost).
 */
export function damage(data, room, socket) {

    let thisRoom = getField(['rooms', room]);
    let thisPlayer = thisRoom.players[data.player];

    if (thisPlayer !== undefined) {

        // thisPlayer.health -= data.damage;
        setField(thisPlayer.health - data.damage, ['rooms', room, 'players', data.player, 'health']);

        // Add damage to database
        if (thisPlayer.damagedBy[data.sentBy] === undefined)
            setField(0, ['rooms', room, 'players', data.player, 'damagedBy', data.sentBy]);
        // thisPlayer.damagedBy[data.sentBy] += data.damage;
        setField(thisPlayer.damagedBy[data.sentBy] + data.damage, ['rooms', room, 'players', data.player, 'damagedBy', data.sentBy]);

        if (thisPlayer.health <= 0) {
            // console.log(thisRoom.teams.indexOf(socket.handshake.query.team));
            socket.emit('serverSendPlayerDeath', { teamNumber: getTeamNumber(room, socket.handshake.query.team) });
            setField(GLOBAL.MAX_HEALTH, ['rooms', room, 'players', data.player, 'health']);

            // Read damagedBy to award points, clear in the process
            let max = null;
            let dataToSend;
            for (let pl in thisPlayer.damagedBy) {
                dataToSend = {
                    player: pl,
                    teamSlot: getTeamNumber(room, thisRoom.compounds[data.id].sendingTeam),
                    increment: GLOBAL.ASSIST_SCORE,
                    kill: false
                };

                // Add to team score, checking if team score is initialized
                setField((thisRoom.teams[dataToSend.teamSlot].score === undefined) ? dataToSend.increment : thisRoom.teams[dataToSend.teamSlot].score + dataToSend.increment, ['rooms', room, 'teams', dataToSend.teamSlot, 'score']);


                socket.to(room).broadcast.emit('serverSendScoreUpdate', dataToSend);
                socket.emit('serverSendScoreUpdate', dataToSend);
                if (max === null || thisPlayer.damagedBy[pl] > thisPlayer.damagedBy[max])
                    max = pl;
            }

            // Add to score of person who dealt the most damage
            dataToSend.player = max;
            dataToSend.increment = GLOBAL.KILL_SCORE - GLOBAL.ASSIST_SCORE;
            dataToSend.kill = true;
            socket.to(room).broadcast.emit('serverSendScoreUpdate', dataToSend);
            socket.emit('serverSendScoreUpdate', dataToSend);

            // Add to team score
            setField(thisRoom.teams[dataToSend.teamSlot].score + dataToSend.increment, ['rooms', room, 'teams', dataToSend.teamSlot, 'score']);

            // Clear damagedBy values
            for (let pl in thisPlayer.damagedBy)
                setField(0, ['rooms', room, 'players', data.player, 'damagedBy', pl]);

            // Check if a team won
            for (let tm of thisRoom.teams) {
                if (tm.score >= GLOBAL.WINNING_SCORE) {

                    let dataToSend = {
                        winner: tm
                        // teamScore: thisRoom.teams[dataToSend.teamSlot].score             
                        //other data here TODO post ranking
                    };
                    socket.to(room).broadcast.emit('serverSendWinner', dataToSend);
                    socket.emit('serverSendWinner', dataToSend);

                    // Close room after delay (kick all players)
                    setTimeout(() => {
                        socket.emit('serverSendDisconnect', {});
                        socket.to(room).broadcast.emit('serverSendDisconnect', {});
                    }, GLOBAL.ROOM_DELETE_DELAY);
                }
            }
        }
    }
    else
        console.warn('Player of ID ' + data.id + ' couldn\'t be damaged because they don\'t exist!');
}