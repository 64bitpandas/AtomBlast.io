/** 
 * App.js is responsible for connecting the UI with the game functionality.
 * Most of the functionality is used for the main menu and connecting/disconnecting behavior.
 */
'use strict';
import { GLOBAL } from './global.js';
import * as cookies from './lib/cookies.js';
import { Player } from './obj/player.js';
import { GameObject } from './obj/gameobject.js';
import { BLUEPRINTS } from './obj/blueprints.js';
import { beginConnection, disconnect } from './socket.js';
import { player, deductCraftMaterial, setIngame, getIngame, startGame, mouseUpHandler, mouseDownHandler } from './pixigame.js';
import swal from 'sweetalert';

// Array containing all inputs which require cookies, and their values
export const cookieInputs = GLOBAL.COOKIES.map(val => document.getElementById(val));

// Array containing the four chosen blueprints
export var selectedBlueprints = new Array(GLOBAL.BP_MAX);

const nickErrorText = document.getElementById('nickErrorText');

// Mouse position - used for tooltips
export let mouseX, mouseY;

// Currently selected blueprint slot
export let selectedCompound = 0;

let selectedSlot;

// Starts the game if the name is valid.
function joinGame() {

    if (!allBlueprintsSelected())
        swal('Blueprint(s) not selected', 'Make sure all your blueprint slots are filled before joining a game!', 'error');
    // check if the nick is valid
    else if (validNick()) {

        // Set cookies for inputs
        for(let i = 0; i < GLOBAL.INPUT_COUNT; i++) {
            cookies.setCookie(GLOBAL.COOKIES[i], cookieInputs[i].value, GLOBAL.COOKIE_DAYS);
        }

        // Use cookies to set the ingame blueprint slot values
        for(let i = 1; i <= GLOBAL.BP_MAX; i++) {
            selectedBlueprints[i-1] = BLUEPRINTS[cookies.getCookie(GLOBAL.COOKIES[i - 1 + GLOBAL.INPUT_COUNT])];

            // Check whether blueprint is selected!                     
            document.getElementById('bp-ingame-' + i).innerHTML = selectedBlueprints[i-1].name + ' (' + getCompoundFormula(selectedBlueprints[i-1]) + ')';                                                                      
        }

        // Show game window
        showElement('gameAreaWrapper');
        hideElement('startMenuWrapper');

        // Show loading screen
        showElement('loading');

        // Cookie Inputs: 0=player, 1=room, 2=team

        // Connect to server
        beginConnection();
            
    } else {
        nickErrorText.style.display = 'inline';
    }
}

/** check if nick is valid alphanumeric characters (and underscores)
 * @returns true if the nickname is valid, false otherwise
 */
function validNick() {
    const regex = /^(\w|_|-| |!|\.|\?){2,16}$/;
    for(let i = 0; i < GLOBAL.INPUT_COUNT; i++) {
        if(regex.exec(cookieInputs[i].value) === null && !(i === 1 && cookieInputs[7].value !== 'private'))
            return false;
    }

    return true;
}

/**
 * Returns true if all four blueprint slots are filled.
 */
function allBlueprintsSelected() {
    for(let i = GLOBAL.INPUT_COUNT - 1; i < GLOBAL.INPUT_COUNT + GLOBAL.BP_MAX; i++) {
        if(cookieInputs[i].innerHTML.substring(0, 1) === '-')
            return false;
    }
    return true;
}
/**
 * Its a method for testing stuff
 */
function testHandler() {
    swal('SUCCESS','The test event is invoked!','info');
}

/** 
 * Onload function. Initializes the menu screen, creates click events, and loads cookies.
 */
window.onload = () => {
    
    // Patch logo for firefox
    if(typeof InstallTrigger !== 'undefined')
        document.getElementById('logo').innerHTML = `<img src="assets/logo.svg" id="logo-firefox">`; // eslint-disable-line

    // Cookie loading - create array of all cookie values
    let cookieValues = GLOBAL.COOKIES.map(val => cookies.getCookie(val));

    // Continue loading cookies only if it exists
    let i = 0;
    for(let cookie of cookieValues) {
        if(cookie !== null && cookie.length > 0) {
            if(cookieInputs[i].tagName === 'INPUT' || cookieInputs[i].tagName === 'SELECT')
                cookieInputs[i].value = cookie;
            else if(cookieInputs[i].tagName === 'BUTTON' && BLUEPRINTS[cookie] !== undefined)
                cookieInputs[i].innerHTML = BLUEPRINTS[cookie].name;
        }
        i++;
    }

    // Add listeners to start game to enter key and button click

    document.addEventListener('pointerdown', mouseUpHandler);
    document.addEventListener('pointerup', mouseDownHandler)

    bindHandler('startButton', function () {
        joinGame();
    });

    bindHandler('quitButton', function () {
        quitGame('You have left the game.', false);
    });

    bindHandler('exitButton', function () {
        quitGame('The game has ended.', false);
        hideElement('winner-panel');
    });

    bindHandler('resumeButton', function () {
        hideElement('menubox');
    });

    bindHandler('optionsButton', function () {
        swal('', 'This feature is not implemented.', 'info');
    });

    bindHandler('controlsButton', function () {
        swal('', 'This feature is not implemented.', 'info');
    });

    bindHandler('creditsButton', function () {
        swal('', 'Created by BananiumLabs.com', 'info');
    });

    bindHandler('btn-start-game', function () {
        console.log('starting game');
        startGame(true);
    });

    bindHandler('newsBox', function() {
        swal('','hello world','info');
    });

    // document.getElementById('gameView', onClick, false);

    for(let i = 0; i < selectedBlueprints.length; i++) {
        bindHandler('bp-ingame-' + (i + 1), function() {
            selectedCompound = i;
            updateCompoundButtons();
        });
    }

    // Set up the blueprint slot buttons
    for(let i = 1; i <= GLOBAL.BP_MAX; i++) {
        document.getElementById('bp-slot-' + i).onclick = () => {
            showElement('bp-select');
            document.getElementById('bp-select-header').innerHTML = GLOBAL.BP_SELECT + i;
            selectedSlot = i;
        };
    }

    document.getElementById('btn-close').onclick = () => { hideElement('bp-select'); };

    // Set up blueprint selection buttons
    for(let blueprint in BLUEPRINTS) {
        let bp = BLUEPRINTS[blueprint];

        document.getElementById('blueprint-wrapper').innerHTML +=
            `
            <button onmouseenter="tooltipFollow(this)" class="button width-override col-6 col-12-sm btn-secondary btn-blueprint" id="btn-blueprint-` + blueprint + `">
                <p>` + bp.name + `</p>
                <h6>-` + getCompoundFormula(bp) + `-</h6>
                <img src="` + bp.texture + `">
                <span class="tooltip">` + bp.tooltip + `</span>
            </button>

            `;
    }
    // Blueprint Slots
    for(let btn of document.getElementsByClassName('btn-blueprint'))
        btn.onclick = () =>  {
            let blueprint = btn.id.substring(14); // Name of the blueprint, the first 14 characters are 'btn-blueprint-'
            console.log(blueprint + ' selected in slot ' + selectedSlot);
            document.getElementById('bp-slot-' + selectedSlot).innerHTML = BLUEPRINTS[blueprint].name;
            hideElement('bp-select');
            cookies.setCookie(GLOBAL.COOKIES[selectedSlot + GLOBAL.INPUT_COUNT - 1], blueprint, GLOBAL.COOKIE_DAYS);
        };

    // Add enter listeners for all inputs
    for(let i = 0; i < GLOBAL.INPUT_COUNT; i++) {
        cookieInputs[i].addEventListener('keypress', e => {
            const key = e.which || e.keyCode;
    
            if (key === GLOBAL.KEY_ENTER)
                joinGame();
        });
    }

    // Behavior when room type is changed
    if (cookieInputs[7].value !== 'private')
        hideElement('room');
    else
        showElement('room');

    cookieInputs[7].onchange = () => {
        if(cookieInputs[7].value === 'private')
            showElement('room');
        else
            hideElement('room');

        cookies.setCookie(GLOBAL.COOKIES[7], cookieInputs[7].value, GLOBAL.COOKIE_DAYS);
    };

    // Server changed
    cookieInputs[8].onchange = () => {
        cookies.setCookie(GLOBAL.COOKIES[8], cookieInputs[8].value, GLOBAL.COOKIE_DAYS);
    };
};

/**
 * Sets mouse positions for tooltip
 */
window.onmousemove = (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;
};

// function setupEventHandlers() {  
//     document.addEventListener('mousedown', this._onMouseDown.bind(this));    
//     document.addEventListener('mousemove', this._onMouseMove.bind(this));  
//     document.addEventListener('mouseup', this._onMouseUp.bind(this));    
//     document.addEventListener('wheel', this._onWheel.bind(this));    
//     document.addEventListener('touchstart', this._onTouchStart.bind(this));    
//     document.addEventListener('touchmove', this._onTouchMove.bind(this));    
//     document.addEventListener('touchend', this._onTouchEnd.bind(this));    
//     document.addEventListener('touchcancel', this._onTouchCancel.bind(this));    
//     document.addEventListener('pointerdown', this._onPointerDown.bind(this));
// };

/**
 * Transitions from in-game displays to the main menu.
 * @param {string} msg The message to be displayed in the menu after disconnect. 
 * @param {boolean} isError True if the game quit was due to an error; false otherwise.
 */
export function quitGame(msg, isError) {

    // Disconnect from server
    disconnect();

    // Set status of ingame
    setIngame(false);

    // menu
    hideElement('gameAreaWrapper');
    hideElement('hud');
    hideElement('menubox');
    showElement('startMenuWrapper');
    hideElement('lobby');
    swal('Disconnected from Game', msg, (isError) ? 'error' : 'info');
}

/**
 * Binds handlerMethod to onclick event for element id.
 * @param {string} id 
 * @param {function} handlerMethod 
 */
export function bindHandler(id, handlerMethod) {
    document.getElementById(id).onclick = handlerMethod;
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
 * Makes tooltip follow the mouse. Call when a button is hovered.
 * @param {HTMLElement} button The element reference for the button currently being hovered.
 */
window.tooltipFollow = (button) => {
    let tooltip = button.getElementsByClassName('tooltip')[0];
    tooltip.style.top = (mouseY - 150) + 'px';
    tooltip.style.left = (mouseX - 150) + 'px';
};

/**
 * Updates the list of atoms that the player holds.
 * Only updates the entry for the particular ID given.
 * @param {string} atomID The ID of the atom to update.
 */
export function updateAtomList(atomID) {
    let list = document.getElementById('atom-count');

    if(document.getElementById('atom-list-' + atomID) === null) {
        let newEntry = document.createElement('li');
        newEntry.setAttribute('id', 'atom-list-' + atomID);
        list.appendChild(newEntry);
    }

    document.getElementById('atom-list-' + atomID).innerHTML = '' + atomID.charAt(0).toUpperCase() + atomID.substr(1) + ': ' + player.atomList[atomID];

    updateCompoundButtons(); //No need to update selection
}

/**
 * 
 * @param {number} selectedSlot The index of the selected slot. 0-3
 */
export function updateCompoundButtons(selectedSlot) {
    if(selectedSlot === undefined)
        selectedSlot = selectedCompound;
    else
        selectedCompound = selectedSlot;

    for(let i = 0; i < selectedBlueprints.length; i++) {
        if (selectedSlot != i) {
            if(canCraft(selectedBlueprints[i])){
                document.getElementById('bp-ingame-' + (i + 1)).style.background ='#2ecc71';
            }
            else{
                document.getElementById('bp-ingame-' + (i + 1)).style.background = '#C8C8C8';
            }
        }
        else { //is selected
            if (canCraft(selectedBlueprints[i])) {
                document.getElementById('bp-ingame-' + (i + 1)).style.background = '#003CA8';
            }
            else {
                document.getElementById('bp-ingame-' + (i + 1)).style.background = '#3D66D1';
            }
            document.getElementById('bp-select-label').innerHTML = 'Selected Compound: ' + selectedBlueprints[i].name;
        }
    }
}

/**
 * Updates the team scoreboard on screen.
 */
export function updateScores(teamSlot, increment) {
    document.getElementById('team-score-' + teamSlot).innerHTML = parseInt(document.getElementById('team-score-' + teamSlot).innerHTML) + increment;
}

/**
 * Run on new player join to sync lobby information
 * @param {*} data The data transferred from server
 */
export function updateLobby(data) {

// Wipe innerHTML first
    let lobby = document.getElementById('team-display');
    lobby.innerHTML = '';
    for(let player in data) {
        if (document.getElementById(data[player].team) === null || document.getElementById(data[player].team) === undefined) {
            lobby.innerHTML += `
            <div class="col-3">
                <h3>` + data[player].team + `</h3>
                <ul id="` + data[player].team + `">
                </ul>
            </div>
            `;
        }
        let listItem = document.createElement('LI');
        listItem.appendChild(document.createTextNode(data[player].name));
        document.getElementById(data[player].team).appendChild(listItem);
    }
}

/**
 * Displays the winner panel after a game has concluded.
 * @param {*} data Server sent data, including name and score of winning team.
 */
export function displayWinner(data) {
    // console.log(data);
    document.getElementById('winner-name').innerHTML = data.winner.name + ' has won!';
    showElement('winner-panel');
}

/**
 * Gets the formatted formula of a compound (e.g. C6H12O6).
 * @param {*} blueprint The blueprint object as defined in blueprints.js
 * @returns {string} The formula of the compound
 */
function getCompoundFormula(blueprint) {
    let formula = '';
    for (let atom in blueprint.atoms) {
        formula += atom.toUpperCase() + ((blueprint.atoms[atom] > 1) ? blueprint.atoms[atom] : '');
    }

    return formula;
}

/**
 * Returns true if the player has the materials necessary to create a particular blueprint.
 * ONLY USE FOR BUTTON GRAPHICS!!! True checking is done serverside.
 * @param {string} blueprint The name of the blueprint to check.
 */
function canCraft(blueprint) {
    if (blueprint === undefined)
        return false;
    for (let atom in blueprint.atoms) {
        if (player.atomList[atom] === undefined || player.atomList[atom] < blueprint.atoms[atom])
            return false;
    }

    return true;
}