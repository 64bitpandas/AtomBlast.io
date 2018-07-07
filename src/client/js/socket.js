import { GLOBAL } from "./global";
import { cookieInputs, quitGame } from "./app";
import ChatClient from "./lib/chat-client";
import { init, app, createPlayer, isSetup, showGameUI } from "./pixigame";
import { spawnAtom } from "./obj/atom";

/**
 * Socket.js contains all of the clientside networking interface.
 * It contains all variables which are synced between client and server.
 */

// Socket.io instance
export var socket;

/* Object containing of all connected players in the form of Player objects */
export var players = {};

// Object containing of all Atoms that have not been picked up, in the form of Atom objects
export var atoms = {};

/**
 * Attempts to connect to the server.
 */
export function beginConnection() {
    //Joins debug server if conditions are met
    if (cookieInputs[1].value === 'jurassicexp') {
        console.log('Dev Backdoor Initiated! Connecting to devserver');
        //Debugging and Local serving
        socket = io.connect(GLOBAL.LOCAL_HOST, {
            query: `room=${cookieInputs[1].value}&name=${cookieInputs[0].value}&team=${cookieInputs[2].value}`,
            reconnectionAttempts: 3
        });
    }
    else {
        // Production server
        console.log('connecting to main server');
        socket = io.connect(GLOBAL.SERVER_IP, {
            query: `room=${cookieInputs[1].value}&name=${cookieInputs[0].value}&team=${cookieInputs[2].value}`,
            reconnectionAttempts: 3
        });
    }

    socket.on('connect', () => {
        setupSocket();
        // Init pixi
        init();
        if (typeof app !== undefined) {
            app.start();
        }
    });
}

/**
 * Run on disconnect to reset all server-based variables and connections
 */
export function disconnect() {
    app.stop();
    socket.disconnect();

    // Wipe players list
    players = {};
    // Wipe atom list
    atoms = {};
}

/** 
 * First time setup when connection starts. Run on connect event to ensure that the socket is connected first.
 */
function setupSocket() {
    //Debug
    console.log('Socket:', socket);

    //Instantiate Chat System
    let chat = new ChatClient({ player: cookieInputs[0].value, room: cookieInputs[1].value, team: cookieInputs[2].value });
    chat.addLoginMessage(cookieInputs[0].value, true);
    chat.registerFunctions();


    // On Connection Failure
    socket.on('reconnect_failed', () => {
        alert("You have lost connection to the server!");
    });

    socket.on('reconnecting', (attempt) => {
        console.log("Lost connection. Reconnecting on attempt: " + attempt);
        quitGame('Lost connection to server');
    });

    socket.on('reconnect_error', (err) => {
        console.log("CRITICAL: Reconnect failed! " + err);
    });

    socket.on('pong', (ping) => {
        console.log("Your Ping Is: " + ping);
    });

    // Sync players between server and client
    // Sync players between server and client
    socket.on('playerSync', (data) => {
        // Create temp array for lerping
        let oldPlayers = players;
        //assigning local array to data sent by server

        // Reconstruct player objects based on transferred data
        for (let player in data) {
            let pl = data[player];

            // Valid player
            if (pl !== null) {
                // Player already exists in database
                if (players[player] !== undefined && players[player] !== null && player !== socket.id) {
                    players[player].setData(pl.posX, pl.posY, pl.vx, pl.vy);
                }

                // Does not exist - need to create new player
                else if (isSetup && (players[player] === undefined || players[player] === null)) {
                    console.log("Create a player");
                    players[player] = createPlayer(pl);
                }
            }
        }

        if (oldPlayers !== undefined && players !== undefined) {
            // Lerp predictions with actual for other players
            for (let player in players) {
                let pl = players[player],
                    oldPl = oldPlayers[player];
                if (pl !== null && pl !== undefined && oldPl !== undefined && player !== socket.id) {
                    pl.posX = lerp(pl.posX, oldPl.posX, GLOBAL.LERP_VALUE);
                    pl.posY = lerp(pl.posY, oldPl.posY, GLOBAL.LERP_VALUE);
                    pl.vx = lerp(pl.vx, oldPl.vx, GLOBAL.LERP_VALUE);
                    pl.vy = lerp(pl.vy, oldPl.vy, GLOBAL.LERP_VALUE);
                }
            }
        }
    });

    socket.on('atomSync', (data) => { //THIS IS NOT AN ARRAY ANYMORE
        //assigning local array to data sent by server

        // Reconstruct atom objects based on transferred data
        for (let atom in data) {
            // Valid atom
            if (data[atom] !== null) {
                // atom already exists in database
                let tempAtom = data[atom];
                if (atoms[atom] !== undefined && atoms[atom] !== null)
                    atoms[atom].setData(tempAtom.posX, tempAtom.posY, tempAtom.vx, tempAtom.vy);
                // Does not exist - need to create new atom
                else if (isSetup) {
                    atoms[atom] = spawnAtom(tempAtom.typeID, tempAtom.id, tempAtom.posX, tempAtom.posY, tempAtom.vx, tempAtom.vy);
                }
            }
            // Delete if it is a player that has disconnected or out of range
            else {
                delete atoms[atom];
            }
        }
    });

    // Sync atoms that have not been picked up
    socket.on('serverSendAtomRemoval', (data) => {
        //An Atom was removed
        if (atoms[data.id] !== undefined) {
            atoms[data.id].hide();
            delete atoms[data.id];
        }
    });

    socket.on('disconnectedPlayer', (data) => {
        console.log('Player ' + data.id + ' has disconnected');
        if (players[data.id] !== undefined) {
            players[data.id].hide();
            delete players[data.id];
        }
    });

    //Chat system receiver
    socket.on('serverMSG', data => {
        chat.addSystemLine(data);
    });

    socket.on('serverSendPlayerChat', data => {
        chat.addChatLine(data.sender, data.message, false);
    });

    socket.on('serverSendLoginMessage', data => {
        chat.addLoginMessage(data.sender, false);
    });

    //Emit join message,
    socket.emit('playerJoin', { sender: chat.player, team: chat.team });
}

// Linear Interpolation function. Adapted from p5.lerp
function lerp(v0, v1, t) {
    return v0 * (1 - t) + v1 * t
}