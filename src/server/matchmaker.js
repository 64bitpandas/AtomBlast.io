import { GLOBAL } from '../client/js/global';
import { getField, setField } from './server';
import { generateID } from './serverutils';

/**
 * Matchmaking system for public matches. Runs after initial socket.io server connection, but before connecting to a server.
 */
export function roomMatchmaker(socket, room, team) {

    let validJoin = false; // This join attempt was valid.

    // Make sure the room you are trying to join is valid
    console.log(getField(['rooms', room]));
    if (room !== GLOBAL.NO_ROOM_IDENTIFIER && getField(['rooms', room]) !== undefined && !getField(['rooms', room]).joinable && getField(['rooms', room]) !== undefined) // Room full
        socket.emit('connectionError', { msg: 'The room ' + room + ' has started or is full!' });

    if (team !== undefined && team.room !== undefined) {
        // Make sure everything is compatible
        if (getField('rooms', team.room) !== undefined && getField('rooms', team.room).type !== roomType) // Wrong room type
            socket.emit('connectionError', { msg: 'Your team is playing in a ' + getField('rooms', team.room).type + ' room, but you are trying to join a ' + roomType + ' room!' });
        else if (!team.joinable) // Team full
            socket.emit('connectionError', { msg: 'Your team is already in game or full!' });
        else {// is joinable
            validJoin = true;
            room = team.room;

            // Equivalent to teams[socket.handshake.query.team].players.push(socket.id);
            setField(socket.id, ['teams', socket.handshake.query.team, 'players', getField(['teams', socket.handshake.query.team, 'players']).length ]);

            if ((roomType === '2v2v2v2' && team.players.length === 2) || team.players.length === 4)
                setField(false, ['teams', socket.handshake.query.team, 'joinable']);
        }
    }
    // Team not found 
    else {
        // Try joining a room
        for (let roomName in getField(['rooms'])) {
            if (roomName.indexOf(roomType) > -1)
                if ((roomType === '4v4' && getField(['rooms', roomName, 'teams']).length < 2) || getField(['rooms', roomName, 'teams']).length < 4) {
                    room = roomName;
                }
        }

        // No matching rooms - must create a new room
        if (room === GLOBAL.NO_ROOM_IDENTIFIER)
            room = 'NA_' + roomType + '_' + generateID();

        // Make team
        setField({
            room: room,
            players: [socket.id],
            joinable: true
        }, ['teams', socket.handshake.query.team]);
    }

    // Join custom room
    if (validJoin)
        socket.join(room, () => {
            console.log('[Server] '.bold.blue + `Player ${socket.handshake.query.name} (${socket.id}) joined room ${room} in team ${socket.handshake.query.team}`.yellow);
        });
}