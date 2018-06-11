/** 
 * App.js is responsible for connecting the renderer (game.js) to the server (server.js).
 * Uses socket.io to set up listeners in the setupSocket() function.
 */
import {GLOBAL} from './global.js';
import ChatClient from './chat-client.js';
import * as cookies from './cookies.js';
import {init, createPlayer, isSetup } from './pixigame.js';
import { Player } from './player.js';
import { createPowerup } from './powerup.js';

// Socket. Yes this is a var, and this is intentional because it is a global variable.
export var socket;

/* Array of all connected players in the form of Player objects */
export var players = {};

// Array of all powerups that have not been picked up, in the form of Powerup objects\
export var powerups = [];

const nickErrorText = document.getElementById('nickErrorText');
const playerNameInput = document.getElementById('playerNameInput');
const roomNameInput = document.getElementById('roomNameInput');

let playerName;
let roomName;

// Starts the game if the name is valid.
function startGame() {
    // check if the nick is valid
    if (validNick()) {

        // Start game sequence
        playerName = playerNameInput.value.replace(/(<([^>]+)>)/ig, '');
        roomName = roomNameInput.value.replace(/(<([^>]+)>)/ig, '');

        // Set cookies
        cookies.setCookie(GLOBAL.NAME_COOKIE, playerName, GLOBAL.COOKIE_DAYS);
        cookies.setCookie(GLOBAL.ROOM_COOKIE, roomName, GLOBAL.COOKIE_DAYS);

        // Show game window
        showElement('gameAreaWrapper');
        hideElement('startMenuWrapper');

        // Show loading screen
        showElement('loading');

        //Debugging and Local serving
        socket = io.connect(GLOBAL.LOCAL_HOST, {
            query: `room=${roomName}&name=${playerName}`,
            reconnectionAttempts: 3
        });
        
        //Production server
        setTimeout(() => {
            if(!socket.connected) {
                console.log('connecting to main server');
                socket.disconnect();
                socket = io.connect(GLOBAL.SERVER_IP, { query: `room=${roomName}&name=${playerName}` });
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
    const regex = /^\w*$/;
    return regex.exec(playerNameInput.value) !== null && regex.exec(roomNameInput.value) !== null;
}

/** 
 * Onload function. Initializes the menu screen and loads cookies.
 */
window.onload = () => {
    // Cookie loading
    const playerCookie = cookies.getCookie(GLOBAL.NAME_COOKIE);
    const roomCookie = cookies.getCookie(GLOBAL.ROOM_COOKIE);

    // Continue loading cookie only if it exists
    if(playerCookie !== null && playerCookie.length > 0)
        playerNameInput.value = playerCookie;
    if(roomCookie !== null && roomCookie.length > 0)
        roomNameInput.value = roomCookie;

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
 */
function SetupSocket(socket) {
    //Debug
    console.log('Socket:', socket);
    
    //Instantiate Chat System
    let chat = new ChatClient({ player: playerName, room: roomName });
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
        // Create temp array for lerping
        let oldPlayers = players;
        //assigning local array to data sent by server

        // Reconstruct player objects based on transferred data
        for (let player in data) {
            let pl = data[player];

            // Valid player
            if(pl !== null) {
                // Player already exists in database
                if (players[player] !== undefined && players[player] !== null)
                    players[player].setData()
                // Does not exist - need to create new player
                else if(isSetup)
                    players[player] = createPlayer(pl);
            }
            // Delete if it is a player that has disconnected
            else {
                delete players[player];
            }
        }

        if (oldPlayers !== undefined && players !== undefined) {
            // Lerp predictions with actual for other players
            for (let pl in players) {
                if (players[pl] !== null && players[pl] !== undefined && oldPlayers[pl] !== undefined && pl !== socket.id) {
                    players[pl].posX = lerp(players[pl].posX, oldPlayers[pl].posX, GLOBAL.LERP_VALUE);
                    players[pl].posY = lerp(players[pl].posY, oldPlayers[pl].posY, GLOBAL.LERP_VALUE);
                    players[pl].vx = lerp(players[pl].vx, oldPlayers[pl].vx, GLOBAL.LERP_VALUE);
                    players[pl].vy = lerp(players[pl].vy, oldPlayers[pl].vy, GLOBAL.LERP_VALUE);
                }
            }
        }
        
    });

    // Sync powerups that have not been picked up
    socket.on('serverSendPowerupChange', (data) => {
        //A powerup was removed (TODO create new powerups?)
            powerups.splice(data.index, 1);
    });

    // Sync powerups on first connect
    socket.on('serverSendPowerupArray', (data) => {
        // First time sync - copy over entire array data
        console.log('Generating powerups...');
        for (let powerup of data.powerups) {
            powerups.push(createPowerup(powerup.typeID, powerups.length));
        }
    })

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

    // Event Trigger When Player Disconnects
    socket.on('serverSendDisconnectMessage', data => {
        chat.addLoginMessage(data.sender, false);
        chat.addLoginMessage(data.reason, false);
    });

    //Emit join message
    socket.emit('playerJoin', { sender: chat.player });
}

// Linear Interpolation function. Adapted from p5.lerp
function lerp(v0, v1, t) {
    return v0 * (1 - t) + v1 * t
}

/**
 * Transitions from in-game displays to the main menu.
 * @param {string} msg The message to be displayed in the menu after disconnect. 
 */
function quitGame(msg) {

    // Disconnect from server
    socket.disconnect();

    // Wipe players list
    players = {};
    // Wipe powerups list
    powerups = [];

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

/**
 * Returns the distance between two objects.
 * Both objects must have a 'x' and 'y' field.
 * @param {*} obj1 First object 
 * @param {*} obj2 Second object
 */
export function distanceBetween(obj1, obj2) {
    return Math.sqrt(Math.pow(obj1.x - obj2.x, 2) + Math.pow(obj1.y - obj2.y, 2));
}