// var GameModule = require('./game.js');
var global = require('./global.js');
var ChatClient = require('./chat-client.js');

var playerName;
var roomName;
var playerNameInput = document.getElementById('playerNameInput');
var roomNameInput = document.getElementById('roomNameInput');
var socket;

//Get screen dimensions
var screenWidth = window.innerWidth;
var screenHeight = window.innerHeight;

function startGame() {
    playerName = playerNameInput.value.replace(/(<([^>]+)>)/ig, '');
    roomName = roomNameInput.value.replace(/(<([^>]+)>)/ig, '');
    document.getElementById('gameAreaWrapper').style.display = 'block';
    document.getElementById('startMenuWrapper').style.display = 'none';

    //Production
    socket = io.connect(global.SERVER_IP, {query: 'room=' + roomName});

    //Debugging and Local serving
    if(socket.id === undefined) {
        console.log('Failed to connect, falling back to localhost');
        socket = io.connect(global.LOCAL_HOST, {query: 'room=' + roomName});
    }
    
    if(socket !== null)
        SetupSocket(socket);
    if(!global.animLoopHandle)
        animloop();
};

// check if nick is valid alphanumeric characters (and underscores)
function validNick() {
    var regex = /^\w*$/;
    // console.log('Regex Test', regex.exec(playerNameInput.value));
    return regex.exec(playerNameInput.value) !== null && regex.exec(roomNameInput.value) !== null;
}

window.onload = function() {
    'use strict';

    var btn = document.getElementById('startButton'),
        nickErrorText = document.querySelector('#startMenu .input-error');

    btn.onclick = function () {

        // check if the nick is valid
        if (validNick()) {
            startGame();
        } else {
            nickErrorText.style.display = 'inline';
        }
    };

    playerNameInput.addEventListener('keypress', function (e) {
        var key = e.which || e.keyCode;

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
    console.log('Socket:',socket);

    //Instantiate Chat System
    let chat = new ChatClient({ socket: socket, player: playerName, room: roomName });
    chat.addLoginMessage(playerName, true);
    chat.registerFunctions();

    //Chat system receiver
    socket.on('serverMSG', function (data) {
        chat.addSystemLine(data);
    });

    socket.on('serverSendPlayerChat', function (data) {
        chat.addChatLine(data.sender, data.message, false);
    });

    socket.on('serverSendLoginMessage', function (data) {
        chat.addLoginMessage(data.sender, false);
    });

    //Emit join message
    socket.emit('playerJoin', { sender: chat.player });
}

window.requestAnimFrame = (function(){
    return  window.requestAnimationFrame       ||
            window.webkitRequestAnimationFrame ||
            window.mozRequestAnimationFrame    ||
            function( callback ){
                window.setTimeout(callback, 1000 / 60);
            };
})();

function animloop(){
    requestAnimFrame(animloop);
}


window.addEventListener('resize', function() {
    screenWidth = window.innerWidth;
    screenHeight = window.innerHeight;
}, true);
