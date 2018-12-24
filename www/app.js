const app = require('express')();
const helper = require("./media.js");

var http = require('http').Server(app);
var io = require('socket.io')(http);

// get items
var content = helper.scanMedia();

// serve index.html
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/public/index.html');
});
app.get('/style.css', function (req, res) {
  res.sendFile(__dirname + '/public/style.css');
});
app.get('/script.js', function (req, res) {
  res.sendFile(__dirname + '/public/script.js');
});

io.on('connection', function (socket) {

  // request items
  socket.on('load', function (msg) {
    //helper.listDatabase();
    helper.serveOne(io, "disk_aefvhn");
    helper.serveOne(io, 'item1');
    helper.serveOne(io, 'item2');
  });

  // play demo
  socket.on('play', function (msg) {
    helper.playLocalMedia(msg);
  });
  // create disk
  socket.on('createdisk', function () {
    helper.createDisk('channel2');
  });
  // update file
  socket.on('updatefile', function (msg) {
    helper.updateFile(msg);
  });
  // create channel
  socket.on('createchannel', function (msg) {
    if (msg.length > 0)
      helper.createChannel(msg);
  });
  // delete connection
  socket.on('deleteconnection', function (msg) {
    helper.deleteConnection(msg);
  });
  // create connection
  socket.on('createconnection', function (msg) {
    helper.createConnection(msg);
  });
});

http.listen(3000, function () {
  //console.log('listening on *:3000');
});

// Dat test
//const Dat = require('dat-node');
// Dat('./media/item1', function (err, dat) {
//   if (err) throw err;
//   dat.importFiles();
//   dat.joinNetwork();
//   console.log("dat link: dat://" + dat.key.toString('hex'));
// });