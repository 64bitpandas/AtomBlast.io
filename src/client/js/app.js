// var GameModule = require('./game.js');
// import {global} from './global.js';
// import {ChatClient} from './chat-client.js';
let global = require('./global.js');
let ChatClient = require('./chat-client.js');
let CookieUtil = require('./cookies.js');
let cookies = new CookieUtil();

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
        socket = io.connect(global.SERVER_IP, { query: `room=${roomName}` });

        //Debugging and Local serving
        if (!socket.connected) {
            console.log('Failed to connect, falling back to localhost');
            socket = io.connect(global.LOCAL_HOST, { query: `room=${roomName}` });
        }

        if (socket !== null)
            SetupSocket(socket);
        if (!global.animLoopHandle)
            animloop();

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

window.onload = () => {
    const btn = document.getElementById('startButton');
    const nickErrorText = document.querySelector('#startMenu .input-error');

    // Cookie loading
    const playerCookie = cookies.getCookie(global.NAME_COOKIE);
    const roomCookie = cookies.getCookie(global.ROOM_COOKIE);

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

    //Emit join message
    socket.emit('playerJoin', { sender: chat.player });
}

window.requestAnimFrame = ((() => window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    (callback => {
        window.setTimeout(callback, 1000 / 60);
    })))();

function animloop() {
    requestAnimFrame(animloop);
}


window.addEventListener('resize', () => {
    screenWidth = window.innerWidth;
    screenHeight = window.innerHeight;
}, true);
