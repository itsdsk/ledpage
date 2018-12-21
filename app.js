const app = require('express')();
const helper = require("./media.js");

var http = require('http').Server(app);
var io = require('socket.io')(http);

const Dat = require('dat-node');

// get items
var media = helper.scanMedia();

// serve index.html
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
  console.log('a user connected');
  socket.on('load', function (msg) {
    console.log('load');
    media.forEach(element => {
      //console.log(element);
      io.emit('load', helper.mediaObjectToHtml(element));
    });
  });
  socket.on('sync', function (msg) {
    // get object representing demo
    var mediaItem = media.find(object => {
      return object.demo.id === msg.id;
    });
    // save in memory
    var mediaItemFile = mediaItem.files.find(object => {
      return object.name === msg.filename;
    });
    mediaItemFile.text = msg.text;
    // send on disk
    helper.updateFile(mediaItem.directory, msg.filename, msg.text);
  });
});

http.listen(3000, function () {
  console.log('listening on *:3000');
});

Dat('./media/item1', function (err, dat) {
  if (err) throw err;
  dat.importFiles();
  dat.joinNetwork();
  console.log("dat link: dat://" + dat.key.toString('hex'));
});