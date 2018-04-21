var global = require('./global.js');

class ChatClient {

    constructor(params) {
        // this.canvas = params.canvas;
        this.socket = params.socket;
        // this.mobile = params.mobile;
        this.player = params.player;
        var self = this;
        this.commands = {};
        var input = document.getElementById('chatInput');
        input.addEventListener('keypress', this.sendChat.bind(this));
        input.addEventListener('keyup', function(key) {
            input = document.getElementById('chatInput');
            key = key.which || key.keyCode;
            if (key === global.KEY_ESC) {
                input.value = '';
                // self.canvas.cv.focus();
            }
        });
    }

    // TODO: Break out many of these GameControls into separate classes.

    registerFunctions() {
        var self = this;

        this.registerCommand('help', 'Information about the chat commands.', function () {
            self.printHelp();
        });

        // this.registerCommand('login', 'Login as an admin.', function (args) {
        //     self.socket.emit('pass', args);
        // });

        // this.registerCommand('kick', 'Kick a player, for admins only.', function (args) {
        //     self.socket.emit('kick', args);
        // });
        global.chatClient = this;
    }

    // Chat box implementation for the users.
    addChatLine(name, message, me) {
        if (this.mobile) {
            return;
        }
        var newline = document.createElement('li');

        // Colours the chat input correctly.
        newline.className = (me) ? 'me' : 'friend';
        newline.innerHTML = '<b>' + ((name.length < 1) ? global.PLACEHOLDER_NAME : name) + '</b>: ' + message;

        this.appendMessage(newline);
    }

    // Message to notify players when a new player joins
    addLoginMessage(name, me) {
        if (this.mobile) {
            return;
        }
        var newline = document.createElement('li');

        console.log(name + ' joined');
        // Colours the chat input correctly.
        newline.className = 'join';
        newline.innerHTML = '<b>' + ((me) ? '</b>You have' : (name.length < 1) ? global.PLACEHOLDER_NAME : name + '</b> has') + ' joined the room!';

        this.appendMessage(newline);
    }

    // Chat box implementation for the system.
    addSystemLine(message) {
        if (this.mobile) {
            return;
        }
        var newline = document.createElement('li');

        // Colours the chat input correctly.
        newline.className = 'system';
        newline.innerHTML = message;

        // Append messages to the logs.
        this.appendMessage(newline);
    }

    // Places the message DOM node into the chat box.
    appendMessage(node) {
        if (this.mobile) {
            return;
        }
        var chatList = document.getElementById('chatList');
        if (chatList.childNodes.length > 10) {
            chatList.removeChild(chatList.childNodes[0]);
        }
        chatList.appendChild(node);
    }

    // Sends a message or executes a command on the click of enter.
    sendChat(key) {
        var commands = this.commands,
            input = document.getElementById('chatInput');

        key = key.which || key.keyCode;

        if (key === global.KEY_ENTER) {
            var text = input.value.replace(/(<([^>]+)>)/ig,'');
            if (text !== '') {

                // Chat command.
                if (text.indexOf('-') === 0) {
                    var args = text.substring(1).split(' ');
                    if (commands[args[0]]) {
                        commands[args[0]].callback(args.slice(1));
                    } else {
                        this.addSystemLine('Unrecognized Command: ' + text + ', type -help for more info.');
                    }

                // Allows for regular messages to be sent to the server.
                } else {
                    console.log(this.socket);
                    //Debug lines for messages - Remove on production
                    // console.log("This Player: " + this.player);
                    // console.log("This message: " + text);
                    this.socket.emit('playerChat', { sender: this.player, message: text });
                    this.addChatLine(this.player, text, true);
                }

                // Resets input.
                input.value = '';
                // this.canvas.cv.focus();
            }
        }
    }

    // Allows for addition of commands.
    registerCommand(name, description, callback) {
        this.commands[name] = {
            description: description,
            callback: callback
        };
    }

    // Allows help to print the list of all the commands and their descriptions.
    printHelp() {
        var commands = this.commands;
        for (var cmd in commands) {
            if (commands.hasOwnProperty(cmd)) {
                this.addSystemLine('-' + cmd + ': ' + commands[cmd].description);
            }
        }
    }
}

module.exports = ChatClient;