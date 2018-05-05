/** 
 * MISSING FILE HEADER
 *
 *
 *
 *
 */
// var GameModule = require('./game.js');
import * as global from './global.js';
import ChatClient from './chat-client.js';
import * as cookies from './cookies.js';
import game from './game.js';
import p5 from './lib/p5.min.js';

let playerName;
let roomName;
let socket;

const playerNameInput = document.getElementById('playerNameInput');
const roomNameInput = document.getElementById('roomNameInput');

//Get screen dimensions
let screenWidth = window.innerWidth;
let screenHeight = window.innerHeight;

// Starts the game if the name is valid.
function startGame() {
    // check if the nick is valid
    if (validNick()) {

        // Start game sequence
        playerName = playerNameInput.value.replace(/(<([^>]+)>)/ig, '');
        roomName = roomNameInput.value.replace(/(<([^>]+)>)/ig, '');

        // Set cookies
        cookies.setCookie(global.NAME_COOKIE, playerName, global.COOKIE_DAYS);
        cookies.setCookie(global.ROOM_COOKIE, roomName, global.COOKIE_DAYS);

        // Show game window
        document.getElementById('gameAreaWrapper').style.display = 'block';
        document.getElementById('startMenuWrapper').style.display = 'none';

        //Production server
        // socket = io.connect(global.SERVER_IP, { query: `room=${roomName}` });

        //Debugging and Local serving
        // if (!socket.connected) {
            console.log('Failed to connect, falling back to localhost');
            socket = io.connect(global.LOCAL_HOST, { query: `room=${roomName}` });
        // }

        if (socket !== null)
            SetupSocket(socket);
        if (!global.animLoopHandle)
            animloop();
        
        // Init p5
        new p5(game);

    } else {
        nickErrorText.style.display = 'inline';
    }
    
}

// check if nick is valid alphanumeric characters (and underscores)
function validNick() {
    const regex = /^\w*$/;
    // console.log('Regex Test', regex.exec(playerNameInput.value));
    
    return regex.exec(playerNameInput.value) !== null && regex.exec(roomNameInput.value) !== null;
}

/** 
 * MISSING COMMENT
 */
window.onload = () => {
    const btn = document.getElementById('startButton');
    const nickErrorText = document.querySelector('#startMenu .input-error');

    // Cookie loading
    const playerCookie = cookies.getCookie(global.NAME_COOKIE);
    const roomCookie = cookies.getCookie(global.ROOM_COOKIE);

    // Missing Comment
    if(playerCookie !== null && playerCookie.length > 0)
        playerNameInput.value = playerCookie;
    if(roomCookie !== null && roomCookie.length > 0)
        roomNameInput.value = roomCookie;

    btn.onclick = () => {
        startGame();
    };

    playerNameInput.addEventListener('keypress', e => {
        const key = e.which || e.keyCode;

        if (key === global.KEY_ENTER)
           startGame();
    });
};

/** 
 * MISSING COMMENT
 */
function SetupSocket(socket) {
    //Debug
    console.log('Socket:', socket);

    //Instantiate Chat System
    let chat = new ChatClient({ socket, player: playerName, room: roomName });
    chat.addLoginMessage(playerName, true);
    chat.registerFunctions();

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

    
    //Emit mouse movement events
    socket.on("mouse", 
        function(data) {
            console.log("Received: " + data.x + " " + data.y);
            fill(0,0,255);
            noStroke();
            ellipse(data.x,data.y,20,20);
        });
    //Emit join message
    socket.emit('playerJoin', { sender: chat.player });
}

function mouseDragged() {
    // Draw some white circles
    fill(255);
    noStroke();
    ellipse(mouseX, mouseY, 20, 20);
    // Send the mouse coordinates
    sendmouse(mouseX, mouseY);
}

// Function for sending to the socket
function sendmouse(xpos, ypos) {
    // We are sending!
    console.log("sendmouse: " + xpos + " " + ypos);

    // Make a little object with  and y
    var data = {
        x: xpos,
        y: ypos
    };

    // Send that object to the socket
    socket.emit('mouse', data);
}

/** 
 * MISSING COMMENT
 */
window.requestAnimFrame = ((() => window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    (callback => {
        window.setTimeout(callback, 1000 / 60);
    })))();

/** 
 * MISSING COMMENT
 */
function animloop() {
    requestAnimFrame(animloop);
}

/** 
 * MISSING COMMENT
 */
window.addEventListener('resize', () => {
    screenWidth = window.innerWidth;
    screenHeight = window.innerHeight;
}, true);
