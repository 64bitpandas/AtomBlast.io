const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

var config = require('./config.json');

app.use(express.static(`${__dirname}/../client`));

io.on('connection', socket => {

  socket.join(socket.handshake.query.room, () => {
    console.log(`Socket ${socket.id} joined room ${socket.handshake.query.room}`);
  });

  socket.on('playerChat', data => {
    // console.log('sender: ' + data.sender);
    const _sender = data.sender.replace(/(<([^>]+)>)/ig, '');
    const _message = data.message.replace(/(<([^>]+)>)/ig, '');

    console.log(`[CHAT] [${(new Date()).getHours()}:${(new Date()).getMinutes()}] ${_sender}: ${_message}`);

    socket.broadcast.emit('serverSendPlayerChat', { sender: _sender, message: _message.substring(0, 35) });
  });

  socket.on('playerJoin', data => {
    // console.log('sender: ' + data.sender);
    const _sender = data.sender.replace(/(<([^>]+)>)/ig, '');
    socket.broadcast.emit('serverSendLoginMessage', { sender: _sender });
  });
});

const serverPort = process.env.PORT || config.port;
http.listen(serverPort, () => {
  console.log(`Starting http server on port: ${serverPort}`);
});

console.log('Server has started');