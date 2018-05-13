/** 
 * MISSING FILE HEADER
 *
 *
 *
 *
 */
// var GameModule = require('./game.js');
import {GLOBAL} from './global.js';
import ChatClient from './chat-client.js';
import * as cookies from './cookies.js';
// import game from './game.js';
import p5game from './p5game.js';
import p5 from './lib/p5.min.js';

// Socket. Yes this is a var, and this is intentional because it is a global variable.
export var socket;

/* Array of all connected players in the form of Player objects */
export var players;

const nickErrorText = document.getElementById('nickErrorText');

/* Player class, contains the following information:
 * id: Socket id
 * name: Player name
 * room: Room that player is currently in
 * x: Current x-position on map
 * y: Current y-position on map
*/
var Player = function(newID, newName, newRoom, startX, startY, startAngle) {
    this.id = newID;
    this.name = newName; // Player Name
    this.x = startX; // Intial Starting X location
    this.y = startY; // Intial Starting Y location
    this.angle = startAngle; // player facing direction in degrees(Use 0-360)
}

function updateCoords() {
    
}
// TEMPORARY!!!!!!
// players.push(new Player(0, 'Test Player', 'foo', 500, 500, 0));
// setInterval(() => {
//     players.push(1);
//     if(players.length > 10)
//         players = [];
// })

let playerName;
let roomName;


const playerNameInput = document.getElementById('playerNameInput');
const roomNameInput = document.getElementById('roomNameInput');

// Starts the game if the name is valid.
function startGame() {
    // check if the nick is valid
    if (validNick()) {

        // Start game sequence
        playerName = playerNameInput.value.replace(/(<([^>]+)>)/ig, '');
        roomName = roomNameInput.value.replace(/(<([^>]+)>)/ig, '');

        // Set cookies
        console.log(GLOBAL);
        cookies.setCookie(GLOBAL.NAME_COOKIE, playerName, GLOBAL.COOKIE_DAYS);
        cookies.setCookie(GLOBAL.ROOM_COOKIE, roomName, GLOBAL.COOKIE_DAYS);

        // Show game window
        document.getElementById('gameAreaWrapper').style.display = 'block';
        document.getElementById('startMenuWrapper').style.display = 'none';

        //Production server
        // socket = io.connect(GLOBAL.SERVER_IP, { query: `room=${roomName}` });

        // console.log('Failed to connect, falling back to localhost');
        socket = io.connect(GLOBAL.LOCAL_HOST, { query: `room=${roomName}&name=${playerName}` });

        //Debugging and Local serving
        setTimeout(() => {
            if(!socket.connected)
            socket = io.connect(GLOBAL.SERVER_IP, { query: `room=${roomName}&name=${playerName}` });
        }, 2000);
        // if (!socket.connected) {
            
        // }

        if (socket !== null)
            SetupSocket(socket);
        // if (!GLOBAL.animLoopHandle)
        //     animloop();
        
        // Init p5
        new p5(p5game);

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
 * Onload function. Initializes the menu screen and loads cookies.
 */
window.onload = () => {
    const btn = document.getElementById('startButton');
    

    // Cookie loading
    console.log(GLOBAL);
    const playerCookie = cookies.getCookie(GLOBAL.NAME_COOKIE);
    const roomCookie = cookies.getCookie(GLOBAL.ROOM_COOKIE);

    // Continue loading cookie only if it exists
    if(playerCookie !== null && playerCookie.length > 0)
        playerNameInput.value = playerCookie;
    if(roomCookie !== null && roomCookie.length > 0)
        roomNameInput.value = roomCookie;

    // Add listeners to start game to enter key and button click
    btn.onclick = () => {
        startGame();
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
    let chat = new ChatClient({ socket: socket, player: playerName, room: roomName });
    chat.addLoginMessage(playerName, true);
    chat.registerFunctions();

    // Sync players between server and client
    socket.on('playerSync', (data) => {
        // Create temp array for lerping
        let oldPlayers = players;
        //assigning local array to data sent by server
        players = data;

        if(oldPlayers !== undefined && players !== undefined) {
            
            // Do the lerping
            for(let pl in players) {
                if(oldPlayers[pl] != null) {
                    console.log(players[pl].name + ' ' + players[pl].x + ' ' + players[pl].y);
                    players[pl].x = lerp(players[pl].x, oldPlayers[pl].x, GLOBAL.LERP_VALUE);
                    players[pl].y = lerp(players[pl].y, oldPlayers[pl].y, GLOBAL.LERP_VALUE);
                    players[pl].theta = lerp(players[pl].theta, oldPlayers[pl].theta, GLOBAL.LERP_VALUE);
                    players[pl].speed = lerp(players[pl].speed, oldPlayers[pl].speed, GLOBAL.LERP_VALUE);
                } 
            }
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

    // Event Trigger When Player Disconnects
    socket.on('serverSendDisconnectMessage', data => {
        chat.addLoginMessage(data.sender, false);
        chat.addLoginMessage(data.reason, false);
    });

    
    //Emit mouse movement events
    socket.on("mouse", function(data) {
            console.log("Received: " + data.x + " " + data.y);
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

function lerp(v0, v1, t) {
    return v0 * (1 - t) + v1 * t
}