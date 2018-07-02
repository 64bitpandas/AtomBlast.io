/** 
 * App.js is responsible for connecting the renderer (game.js) to the server (server.js).
 * Uses socket.io to set up listeners in the setupSocket() function.
 */
import { GLOBAL } from './global.js';
import ChatClient from './lib/chat-client';
import * as cookies from './lib/cookies';
import { init, createPlayer, isSetup, deletePixi, app } from './pixigame.js';
import { Player } from './obj/player';
import { createPowerup } from './obj/powerup';
import { GameObject } from './obj/gameobject';

// Socket. Yes this is a var, and this is intentional because it is a global variable.
export var socket;

/* Object containing of all connected players in the form of Player objects */
export var players = {};

// Object containing of all powerups that have not been picked up, in the form of Powerup objects\
export var powerups = {};

const nickErrorText = document.getElementById('nickErrorText');
const playerNameInput = document.getElementById('playerNameInput');
const roomNameInput = document.getElementById('roomNameInput');
const teamNameInput = document.getElementById('teamNameInput');

let playerName;
let roomName;
let teamName;

// Starts the game if the name is valid.
function startGame() {
    // check if the nick is valid
    if (validNick()) {

        // Start game sequence
        playerName = playerNameInput.value.replace(/(<([^>]+)>)/ig, '');
        roomName = roomNameInput.value.replace(/(<([^>]+)>)/ig, '');
        teamName = teamNameInput.value.replace(/(<([^>]+)>)/ig, '');

        // Set cookies
        cookies.setCookie(GLOBAL.NAME_COOKIE, playerName, GLOBAL.COOKIE_DAYS);
        cookies.setCookie(GLOBAL.ROOM_COOKIE, roomName, GLOBAL.COOKIE_DAYS);
        cookies.setCookie(GLOBAL.TEAM_COOKIE, teamName, GLOBAL.COOKIE_DAYS);

        // Show game window
        showElement('gameAreaWrapper');
        hideElement('startMenuWrapper');

        // Show loading screen
        showElement('loading');

        //Debugging and Local serving
        socket = io.connect(GLOBAL.LOCAL_HOST, {
            query: `room=${roomName}&name=${playerName}&team=${teamName}`,
            reconnectionAttempts: 3
        });

        //Production server
        setTimeout(() => {
            if (!socket.connected) {
                console.log('connecting to main server');
                socket.disconnect();
                socket = io.connect(GLOBAL.SERVER_IP, { query: `room=${roomName}&name=${playerName}&team=${teamName}` });
            }
            if (socket !== null)
                SetupSocket(socket);
            // Init pixi
            init();

        }, 1000);
    } else {
        nickErrorText.style.display = 'inline';
    }
}

/** check if nick is valid alphanumeric characters (and underscores)
 * @returns true if the nickname is valid, false otherwise
 */
function validNick() {
    const regex = /^(\w|_|-| |!|\.|\?){2,16}$/;
    return regex.exec(playerNameInput.value) !== null && regex.exec(roomNameInput.value) !== null && regex.exec(teamNameInput.value);
}

/** 
 * Onload function. Initializes the menu screen and loads cookies.
 */
window.onload = () => {
    // Cookie loading
    const playerCookie = cookies.getCookie(GLOBAL.NAME_COOKIE);
    const roomCookie = cookies.getCookie(GLOBAL.ROOM_COOKIE);
    const teamCookie = cookies.getCookie(GLOBAL.TEAM_COOKIE);

    // Continue loading cookie only if it exists
    if (playerCookie !== null && playerCookie.length > 0)
        playerNameInput.value = playerCookie;
    if (roomCookie !== null && roomCookie.length > 0)
        roomNameInput.value = roomCookie;
    if (teamCookie !== null && teamCookie.length > 0)
        teamNameInput.value = teamCookie;

    // Add listeners to start game to enter key and button click
    document.getElementById('startButton').onclick = () => {
        startGame();
    };

    document.getElementById('quitButton').onclick = () => {
        quitGame('You have left the game.');
    };

    document.getElementById('resumeButton').onclick = () => {
        hideElement('menubox');
    };

    playerNameInput.addEventListener('keypress', e => {
        const key = e.which || e.keyCode;

        if (key === GLOBAL.KEY_ENTER)
            startGame();
    });
};

/** 
 * First time setup when connection starts.
 * @param {*} socket The socket.io connection instance.
 */
function SetupSocket(socket) {
    //Debug
    console.log('Socket:', socket);

    //Instantiate Chat System
    let chat = new ChatClient({ player: playerName, room: roomName, team: teamName });
    chat.addLoginMessage(playerName, true);
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
    socket.on('playerSync', (data) => {
        //assigning local array to data sent by server

        // Reconstruct player objects based on transferred data
        for (let player in data) {
            let pl = data[player];

            // Valid player
            if (pl !== null) {
                // Player already exists in database
                if (players[player] !== undefined && players[player] !== null)
                    players[player].setData(pl.posX, pl.posY, pl.vx, pl.vy);
                // Does not exist - need to create new player
                else if (isSetup)
                    players[player] = createPlayer(pl);
            }
            // Delete if it is a player that has disconnected or out of range
            else {
                delete players[player];
            }
        }
    });

    socket.on('powerupSync', (data) => { //THIS IS NOT AN ARRAY ANYMORE
        //assigning local array to data sent by server

        // Reconstruct powerup objects based on transferred data
        for (let powerup in data) {
            // Valid powerup
            if (data[powerup] !== null) {
                // Powerup already exists in database
                let tempPow = data[powerup];
                if (powerups[powerup] !== undefined && powerups[powerup] !== null)
                    powerups[powerup].setData(tempPow.posX, tempPow.posY, tempPow.vx, tempPow.vy);
                // Does not exist - need to create new powerup
                else if (isSetup) {
                    powerups[powerup] = createPowerup(tempPow.typeID, tempPow.id, tempPow.posX, tempPow.posY, tempPow.vx, tempPow.vy);
                }
            }
            // Delete if it is a player that has disconnected or out of range
            else {
                delete powerups[powerup];
            }
        }
    });

    // Sync powerups that have not been picked up
    socket.on('serverSendPowerupRemoval', (data) => {
        //A powerup was removed
        if (powerups[data.id] !== null)
            delete powerups[data.id];
    });

    // Sync powerups on first connect
    // socket.on('serverSendPowerupArray', (data) => {
    //     // First time sync - copy over entire array data
    //     console.log('Generating powerups...');
    //     for (let powerup of data.powerups) {
    //         powerups.push(createPowerup(powerup.typeID, powerup.id, powerup.posX, powerup.posY));
    //     }
    // })

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

/**
 * Transitions from in-game displays to the main menu.
 * @param {string} msg The message to be displayed in the menu after disconnect. 
 */
function quitGame(msg) {

    // Disconnect from server
    socket.disconnect();
    app.stop();

    // Wipe players list
    players = {};
    // Wipe powerups list
    powerups = {};

    // menu
    hideElement('gameAreaWrapper');
    hideElement('chatbox');
    hideElement('menubox');
    showElement('startMenuMessage');
    showElement('startMenuWrapper');
    document.getElementById('startMenuMessage').innerHTML = msg;
}

/**
 * Displays a hidden element
 * @param {string} el The id of the element to show
 */
export function showElement(el) {
    document.getElementById(el).style.display = 'block';
}

/**
 * Hides a visible element
 * @param {string} el The id of the element to hide
 */
export function hideElement(el) {
    document.getElementById(el).style.display = 'none';
}