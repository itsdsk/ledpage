const app = require('express')();
const media = require("./media.js");

var http = require('http').Server(app);
var io = require('socket.io')(http);

http.listen(process.env.PORT || 3000, function () {
  //console.log('listening on *:3000');
});

// scan content
media.generateDb();

// serve static files
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/public/index.html');
});
app.get('/style.css', function (req, res) {
  res.sendFile(__dirname + '/public/style.css');
});
app.get('/script.js', function (req, res) {
  res.sendFile(__dirname + '/public/script.js');
});

// client websocket routes
io.on('connection', function (socket) {
  // request feed
  socket.on('load', function (msg) {
    media.loadFeed(function (elements) {
      io.emit('load', elements);
    });
  });
  // request editor
  socket.on('loadeditor', function (msg) {
    media.loadEditor(msg, function (elements) {
      io.emit('loadeditor', elements);
    });
  });
  // request channel
  socket.on('loadchannel', function (msg) {
    media.loadChannel(msg, function (elements) {
      io.emit('load', elements);
    });
  });
  // request output graphic
  socket.on('loadoutput', function () {
    media.loadOutput(function (elements) {
      io.emit('loadoutput', elements);
    });
  });
  // update config
  socket.on('updateconfig', function (msg) {
    media.updateConfig(msg);
  });
  // save config file
  socket.on('saveconfig', function () {
    media.saveConfig();
  });
  // play demo
  socket.on('play', function (msg) {
    media.playLocalMedia(msg);
  });
  socket.on('playURL', function (msg) {
    media.playRemoteMedia(msg);
  });
  // create disk
  socket.on('createdisk', function (msg) {
    media.createDisk(msg);
  });
  // update file
  socket.on('updatefile', function (msg) {
    media.updateFile(msg);
  });
  // save version (DAT)
  socket.on('saveversion', function (msg) {
    media.saveVersion(msg);
  });
  // create channel
  socket.on('createchannel', function (msg) {
    if (msg.length > 0)
      media.createChannel(msg);
  });
  // delete connection
  socket.on('deleteconnection', function (msg) {
    media.deleteConnection(msg);
  });
  // create connection
  socket.on('createconnection', function (msg) {
    media.createConnection(msg);
  });
});