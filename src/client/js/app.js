/** 
 * App.js is responsible for connecting the UI with the game functionality.
 * Most of the functionality is used for the main menu and connecting/disconnecting behavior.
 */
import { GLOBAL } from './global.js';
import * as cookies from './lib/cookies';
import { Player } from './obj/player';
import { spawnAtom } from './obj/atom';
import { GameObject } from './obj/gameobject';
import { BLUEPRINTS } from './obj/blueprints.js';
import { beginConnection, disconnect } from './socket.js';

// Arrays containing all inputs which require cookies, and their values
export const cookieInputs = GLOBAL.COOKIES.map(val => document.getElementById(val));

const nickErrorText = document.getElementById('nickErrorText');

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
 * Transitions from in-game displays to the main menu.
 * @param {string} msg The message to be displayed in the menu after disconnect. 
 */
export function quitGame(msg) {

    // Disconnect from server
    disconnect();

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
