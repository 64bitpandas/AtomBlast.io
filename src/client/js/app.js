// var GameModule = require('./game.js');
// import {global} from './global.js';
// import {ChatClient} from './chat-client.js';
let global = require('./global.js');
let ChatClient = require('./chat-client.js');

let playerName;
let roomName;
let socket;

const playerNameInput = document.getElementById('playerNameInput');
const roomNameInput = document.getElementById('roomNameInput');

//Get screen dimensions
let screenWidth = window.innerWidth;
let screenHeight = window.innerHeight;

function startGame() {
    playerName = playerNameInput.value.replace(/(<([^>]+)>)/ig, '');
    roomName = roomNameInput.value.replace(/(<([^>]+)>)/ig, '');
    document.getElementById('gameAreaWrapper').style.display = 'block';
    document.getElementById('startMenuWrapper').style.display = 'none';

    //Production
    socket = io.connect(global.SERVER_IP, { query: `room=${roomName}` });

    //Debugging and Local serving
    if (socket.id === undefined) {
        console.log('Failed to connect, falling back to localhost');
        socket = io.connect(global.LOCAL_HOST, { query: `room=${roomName}` });
    }

    if (socket !== null)
        SetupSocket(socket);
    if (!global.animLoopHandle)
        animloop();
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

    btn.onclick = () => {

        // check if the nick is valid
        if (validNick()) {
            startGame();
        } else {
            nickErrorText.style.display = 'inline';
        }
    };

    playerNameInput.addEventListener('keypress', e => {
        const key = e.which || e.keyCode;

        if (key === global.KEY_ENTER) {
            if (validNick()) {
                startGame();
            } else {
                nickErrorText.style.display = 'inline';
            }
        }
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
