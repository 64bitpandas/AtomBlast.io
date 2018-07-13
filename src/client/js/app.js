/** 
 * App.js is responsible for connecting the UI with the game functionality.
 * Most of the functionality is used for the main menu and connecting/disconnecting behavior.
 */
"use strict";
import { GLOBAL } from './global.js';
import * as cookies from './lib/cookies';
import { Player } from './obj/player';
import { spawnAtom } from './obj/atom';
import { GameObject } from './obj/gameobject';
import { BLUEPRINTS } from './obj/blueprints.js';
import { beginConnection, disconnect } from './socket.js';
import { player, canCraft, deductCraftMaterial, inGame, startGame } from './pixigame.js';
import swal from 'sweetalert';

// Array containing all inputs which require cookies, and their values
export const cookieInputs = GLOBAL.COOKIES.map(val => document.getElementById(val));

// Array containing the four chosen blueprints
export var selectedBlueprints = new Array(GLOBAL.BP_MAX);

const nickErrorText = document.getElementById('nickErrorText');

// Mouse position - used for tooltips
let mouseX, mouseY;

// Currently selected blueprint slot
let selectedSlot;

// Starts the game if the name is valid.
function joinGame() {

    if (!allBlueprintsSelected())
        swal("Blueprint(s) not selected", "Make sure all your blueprint slots are filled before joining a game!", "error");
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
            console.log("Blueprint Selected: " + selectedBlueprints);                        
                document.getElementById('bp-ingame-' + i).innerHTML = selectedBlueprints[i-1].name;                                                                      
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
 * Onload function. Initializes the menu screen, creates click events, and loads cookies.
 */
window.onload = () => {
    // Cookie loading - create array of all cookie values
    let cookieValues = GLOBAL.COOKIES.map(val => cookies.getCookie(val));

    // Continue loading cookies only if it exists
    let i = 0;
    for(let cookie of cookieValues) {
        if(cookie !== null && cookie.length > 0) {
            if(cookieInputs[i].tagName === 'INPUT' || cookieInputs[i].tagName === 'SELECT')
                cookieInputs[i].value = cookie;
            else if(cookieInputs[i].tagName === 'BUTTON')
                cookieInputs[i].innerHTML = BLUEPRINTS[cookie].name;
        }
        i++;
    }

    // Add listeners to start game to enter key and button click
    document.getElementById('startButton').onclick = () => {
        joinGame();
    };

    document.getElementById('quitButton').onclick = () => {
        quitGame('You have left the game.', false);
    };

    document.getElementById('resumeButton').onclick = () => {
        hideElement('menubox');
    };

    document.getElementById('optionsButton').onclick = () => {
        swal('', 'This feature is not implemented.', 'info');
    };

    document.getElementById('controlsButton').onclick = () => {
        swal('', 'This feature is not implemented.', 'info');
    };

    document.getElementById('creditsButton').onclick = () => {
        swal('', 'Created by BananiumLabs.com', 'info');
    };

    document.getElementById('btn-start-game').onclick = () => {
        console.log('starting game');
        startGame(true);
    }

    for(let i = 0; i < selectedBlueprints.length; i++) {
        document.getElementById('bp-ingame-' + (i + 1)).onclick = () => {
            if (canCraft(selectedBlueprints[i])) {
                swal('MET: ', JSON.stringify(selectedBlueprints[i]) + ' have been invoked', 'success');
                deductCraftMaterial(selectedBlueprints[i]); 
            }
            else {
                swal('REQ NOT MET: ', JSON.stringify(selectedBlueprints[i]) + ' have been invoked', 'warning');
            }
        };
    }

    // Set up the blueprint slot buttons
    for(let i = 1; i <= GLOBAL.BP_MAX; i++) {
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
        
        // document.getElementById('btn-blueprint-' + blueprint).onclick = () => {
        //     console.log(blueprint + ' selected in slot ' + selectedSlot);
        //     document.getElementById('bp-slot-' + selectedSlot).innerHTML = BLUEPRINTS[blueprint].name;
        //     hideElement('bp-select');
        //     cookies.setCookie(GLOBAL.COOKIES[selectedSlot + 2], BLUEPRINTS[blueprint].name, COOKIE_DAYS);
        // }
    }

    // Blueprint Slots
    for(let btn of document.getElementsByClassName('btn-blueprint'))
        btn.onclick = () =>  {
            let blueprint = btn.id.substring(14); // Name of the blueprint, the first 14 characters are 'btn-blueprint-'
            console.log(blueprint + ' selected in slot ' + selectedSlot);
            document.getElementById('bp-slot-' + selectedSlot).innerHTML = BLUEPRINTS[blueprint].name;
            hideElement('bp-select');
            cookies.setCookie(GLOBAL.COOKIES[selectedSlot + GLOBAL.INPUT_COUNT - 1], blueprint, GLOBAL.COOKIE_DAYS);
        }

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
 * Transitions from in-game displays to the main menu.
 * @param {string} msg The message to be displayed in the menu after disconnect. 
 */
export function quitGame(msg, isError) {

    // Disconnect from server
    disconnect();

    // menu
    hideElement('gameAreaWrapper');
    hideElement('hud');
    hideElement('menubox');
    showElement('startMenuWrapper');
    hideElement('lobby');
    swal("Disconnected from Game", msg, (isError) ? 'error' : 'info');
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
}

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

    document.getElementById('atom-list-' + atomID).innerHTML = '' + atomID.charAt(0).toUpperCase() + atomID.substr(1) + ': ' + player.atoms[atomID];

    updateCompoundButtons();
}


export function updateCompoundButtons() {
    for(let i = 0; i < selectedBlueprints.length; i++){
        if(canCraft(selectedBlueprints[i])){
            document.getElementById('bp-ingame-' + (i + 1)).style.background ='#2ecc71';
        }
        else{
            document.getElementById('bp-ingame-' + (i + 1)).style.background = '#C8C8C8';
        }
    }
}

/**
 * Run on new player join to sync lobby information
 * @param {*} data The data transferred from server
 */
export function updateLobby(data) {

// Wipe innerHTML first
    let lobby = document.getElementById("team-display");
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