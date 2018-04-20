
var GameModule = require('./game.js');
var global = require('./global.js');
var ChatClient = require('./chat-client.js');

var playerName;
var roomName;
var playerNameInput = document.getElementById('playerNameInput');
var roomNameInput = document.getElementById('roomNameInput');
var socket;

var screenWidth = window.innerWidth;
var screenHeight = window.innerHeight;

var c = document.getElementById('cvs');
var canvas = c.getContext('2d');
c.width = global.screenWidth; c.height = global.screenHeight;

var game =  new GameModule();
var chat;

function startGame() {
    playerName = playerNameInput.value.replace(/(<([^>]+)>)/ig, '');
    roomName = roomNameInput.value.replace(/(<([^>]+)>)/ig, '');
    document.getElementById('gameAreaWrapper').style.display = 'block';
    document.getElementById('startMenuWrapper').style.display = 'none';

    socket = io.connect(global.SERVER_IP + ":" + global.SERVER_PORT, {query: 'room=' + roomName});
    
    console.log("Socket ID: " + socket.id);
    
    if(socket !== null)
        SetupSocket(socket);
    if(!global.animLoopHandle)
        animloop();
};

// check if nick is valid alphanumeric characters (and underscores)
function validNick() {
    var regex = /^\w*$/;
    console.log('Regex Test', regex.exec(playerNameInput.value));
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
    game.handleNetwork(socket);

    this.chat = new ChatClient({ socket: socket, player: playerName, room: roomName });
    this.chat.addLoginMessage(playerName, true);
    this.chat.registerFunctions();
    let _chat = this.chat;

    //Chat system receiver
    socket.on('serverMSG', function (data) {
        _chat.addSystemLine(data);
    });

    socket.on('serverSendPlayerChat', function (data) {
        _chat.addChatLine(data.sender, data.message, false);
    });

    socket.on('serverSendLoginMessage', function (data) {
        _chat.addLoginMessage(data.sender, false);
    });

    //Emit join message
   
    console.log(this.chat);
    socket.emit('playerJoin', {sender: this.chat.player});
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
    gameLoop();
}

function gameLoop() {
  game.handleLogic();
  game.handleGraphics(canvas, roomName);
}

window.addEventListener('resize', function() {
    screenWidth = window.innerWidth;
    screenHeight = window.innerHeight;
    c.width = screenWidth;
    c.height = screenHeight;
}, true);
