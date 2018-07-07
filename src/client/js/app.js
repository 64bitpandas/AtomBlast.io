/** 
 * App.js is responsible for connecting the renderer (game.js) to the server (server.js).
 * Uses socket.io to set up listeners in the setupSocket() function.
 */
"use strict";
import { GLOBAL } from './global.js';
import ChatClient from './lib/chat-client';
import * as cookies from './lib/cookies';
import { init, createPlayer, isSetup, destroyPIXI, app, loadedPIXI, showGameUI } from './pixigame.js';
import { Player } from './obj/player';
import { spawnAtom } from './obj/atom';
import { GameObject } from './obj/gameobject';
import { BLUEPRINTS } from './obj/blueprints.js';

// Socket. Yes this is a var, and this is intentional because it is a global variable.
export var socket;

/* Object containing of all connected players in the form of Player objects */
export var players = {};

// Object containing of all Atoms that have not been picked up, in the form of Atom objects
export var atoms = {};

const nickErrorText = document.getElementById('nickErrorText');

// Arrays containing all inputs which require cookies, and their values
const cookieInputs = GLOBAL.COOKIES.map(val => document.getElementById(val));

// Mouse position - used for tooltips
let mouseX, mouseY;

// Currently selected blueprint slot
let selectedSlot;

// Starts the game if the name is valid.
function startGame() {
    // check if the nick is valid
    if (validNick()) {


        // Set cookies
        let i = 0;
        for(let cookie of GLOBAL.COOKIES) {
            cookies.setCookie(cookie, cookieInputs[i].value, GLOBAL.COOKIE_DAYS);
            i++;
        }

        // Show game window
        showElement('gameAreaWrapper');
        hideElement('startMenuWrapper');

        // Show loading screen
        showElement('loading');

       // Cookie Inputs: 0=player, 1=room, 2=team

        //Joins debug server if conditions are met
        if(cookieInputs[1].value === 'jurassicexp') {
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
        
        init();

        socket.on('connect', () => {
            setupSocket(socket);
            // Init pixi
            
            if(typeof app !== undefined)
            {
                app.start();
                showGameUI();
            }
        });
                
            
    } else {
        nickErrorText.style.display = 'inline';
    }
}

/** check if nick is valid alphanumeric characters (and underscores)
 * @returns true if the nickname is valid, false otherwise
 */
function validNick() {
    const regex = /^(\w|_|-| |!|\.|\?){2,16}$/;
    for(let i = 0; i < 3; i++) {
        if(regex.exec(cookieInputs[i].value) === null)
            return false;
    }

    return true;
}

/** 
 * Onload function. Initializes the menu screen, creates click events, and loads cookies.
 */
window.onload = () => {
    // Cookie loading - create array of all cookie values
    let cookieValues = GLOBAL.COOKIES.map(val => cookies.getCookie(val));

    // Continue loading cookies only if it exists
    let i = 0;
    for(let cookie of cookieValues) {
        if(cookie !== null && cookie.length > 0)
            cookieInputs[i].value = cookie;
        i++;
    }

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

    document.getElementById('optionsButton').onclick = () => {
        alert('This feature is not implemented.');
    };

    document.getElementById('controlsButton').onclick = () => {
        alert('This feature is not implemented.');
    };

    document.getElementById('creditsButton').onclick = () => {
        alert('Created by BananiumLabs.com');
    };

    // Set up the blueprint slot buttons
    for(let i = 1; i <= 4; i++) {
        document.getElementById('bp-slot-' + i).onclick = () => {
            showElement('bp-select');
            document.getElementById('bp-select-header').innerHTML = GLOBAL.BP_SELECT + i;
            selectedSlot = i;
            
            // revise lower line, I want to call the name variable in binaryHydrogen in blueprints.js - Muaaz
            // document.getElementById('bp-select-header').innerHTML = BLUEPRINTS.binaryHydrogen.name;
            // implement when you hover over the blueprint button, it will give a desc. of the button
        }
    }

    document.getElementById('btn-close').onclick = () => { hideElement('bp-select') }

    // Set up blueprint selection buttons
    for(let blueprint in BLUEPRINTS) {
        let bp = BLUEPRINTS[blueprint];
        let formula = '';
        for(let atom in bp.atoms) {
            formula += atom.toUpperCase() + ((bp.atoms[atom] > 1) ? bp.atoms[atom] : '');
        }

        document.getElementById('blueprint-wrapper').innerHTML +=
            `
            <button onmouseenter="tooltipFollow(this)" class="button width-override col-6-sm btn-secondary btn-blueprint" id="btn-blueprint-` + blueprint + `">
                <p>` + bp.name + `</p>
                <h6>-` + formula + `-</h6>
                <img src="` + bp.texture + `">
                <span class="tooltip">` + bp.tooltip + `</span>
            </button>

            `;
        
        document.getElementById('btn-blueprint-' + blueprint).onclick = () => {
            console.log('test');
            document.getElementById('bp-slot-' + selectedSlot).innerHTML = BLUEPRINTS[blueprint].name;
            hideElement('bp-select');
        }
    }

    for(let btn of document.getElementsByClassName('btn-blueprint'))
        btn.onclick = () =>  {
            console.log('test');
            document.getElementById('bp-slot-' + selectedSlot).innerHTML = BLUEPRINTS[btn.id.substring(14)].name;
            hideElement('bp-select');
        }

    for(let i = 0; i < 3; i++) {
        cookieInputs[i].addEventListener('keypress', e => {
            const key = e.which || e.keyCode;
    
            if (key === GLOBAL.KEY_ENTER)
                startGame();
        });
    }
};

/**
 * Sets mouse positions for tooltip
 */
window.onmousemove = (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
}
/** 
 * First time setup when connection starts.
 * @param {*} socket The socket.io connection instance.
 */
function setupSocket(socket) {
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
        console.warn("Lost connection. Reconnecting on attempt: " + attempt);
        quitGame('Lost connection to server');
    });

    socket.on('reconnect_error', (err) => {
        console.error("CRITICAL: Reconnect failed! " + err);
    });

    socket.on('pong', (ping) => {
        console.info("Your Ping Is: " + ping);
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
                 if (players[player] !== undefined && players[player] !== null && player !== socket.id){
                     players[player].setData(pl.posX, pl.posY, pl.vx, pl.vy);
                 }
                 
                 // Does not exist - need to create new player
                 else if (isSetup && (players[player] === undefined || players[player] === null)){
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
        if(atoms[data.id] !== undefined) {
            atoms[data.id].hide();
            delete atoms[data.id];
        }
    });

    socket.on('disconnectedPlayer', (data) => {
        console.log('Player ' + data.id + ' has disconnected');
        if(players[data.id] !== undefined) {
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

/**
 * Transitions from in-game displays to the main menu.
 * @param {string} msg The message to be displayed in the menu after disconnect. 
 */
function quitGame(msg) {

    // Disconnect from server
    socket.disconnect();
    app.stop();
    // destroyPIXI();


    // Wipe players list
    players = {};
    // Wipe atom list
    atoms = {};

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

// Linear Interpolation function. Adapted from p5.lerp
function lerp(v0, v1, t) {
    return v0 * (1 - t) + v1 * t
}

/**
 * Makes tooltip follow the mouse. Call when a button is hovered.
 * @param {HTMLElement} button The element reference for the button currently being hovered.
 */
window.tooltipFollow = (button) => {
    let tooltip = button.getElementsByClassName('tooltip')[0];
    tooltip.style.top = (mouseY - 150) + 'px';
    tooltip.style.left = (mouseX - 150) + 'px';
}
