const app = require('express')();
const helper = require("./media.js");

var http = require('http').Server(app);
var io = require('socket.io')(http);

// get items
var content = helper.scanMedia();

// serve index.html
app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
  //console.log('a user connected');

  // request items
  socket.on('load', function (msg) {
    helper.listDatabase();
    //console.log('load');
    var data = helper.serveOne(io, 'item1');
    console.log("sending: " + data);
    //io.emit('load', data);
    // content.forEach(element => {
    //   //console.log(element);
    //   io.emit('load', helper.mediaObjectToHtml(element));
    // });
  });

  // play demo
  socket.on('play', function (msg) {
    helper.playLocalMedia(msg);
  });

  // update file
  socket.on('sync', function (msg) {
    // get object representing demo
    var mediaItem = content.find(object => {
      return object.demo.id === msg.id;
    });
    // send to helper
    helper.updateFile(mediaItem, msg);
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