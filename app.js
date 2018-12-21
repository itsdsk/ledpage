const express = require('express');
const app = express();
const expressWs = require('express-ws')(app);
const helper = require("./media.js");

const Dat = require('dat-node');

// get items
var media = helper.scanMedia();

// serve index.html
app.use('/', express.static('./'));

// load
app.ws('/', function (ws, req) {
  ws.on('message', function (msg) {
    media.forEach(element => {
      //console.log(element);
      ws.send(helper.mediaObjectToHtml(element));
    });
    console.log(msg);
  });
});

app.listen(3000, () => console.log("listening on 3000"));

Dat('./media/item1', function (err, dat) {
  if (err) throw err;
  dat.importFiles();
  dat.joinNetwork();
  console.log("dat link: dat://"+dat.key.toString('hex'));
});

var Y = require('yjs')
Y.debug.log = console.log.bind(console)
const log = Y.debug('y-websockets-server')
var minimist = require('minimist')
require('y-memory')(Y)
require('y-websockets-server')(Y)
var options = minimist(process.argv.slice(2), {
  string: ['port', 'debug', 'db'],
  default: {
    port: process.env.PORT || '1234',
    debug: false,
    db: 'memory'
  }
})
var port = Number.parseInt(options.port, 10)
var io = require('socket.io')(port)
console.log('Running y-websockets-server on port ' + port)

global.yInstances = {}

function getInstanceOfY (room) {
  if (global.yInstances[room] == null) {
    global.yInstances[room] = Y({
      db: {
        name: options.db,
        dir: 'y-leveldb-databases',
        namespace: room
      },
      connector: {
        name: 'websockets-server',
        room: room,
        io: io,
        debug: !!options.debug
      },
      share: {}
    })
  }
  return global.yInstances[room]
}

io.on('connection', function (socket) {
  var rooms = []
  socket.on('joinRoom', function (room) {
    console.log('User "%s" joins room "%s"', socket.id, room)
    socket.join(room)
    getInstanceOfY(room).then(function (y) {
      global.y = y // TODO: remove !!!
      //console.log(global.y)
      if (rooms.indexOf(room) === -1) {
        y.connector.userJoined(socket.id, 'slave')
        rooms.push(room)
      }
    })
  })
  socket.on('yjsEvent', function (msg) {
    if (msg.room != null) {
      getInstanceOfY(msg.room).then(function (y) {
        //console.log('user event ' + JSON.stringify(msg));
        //console.log(JSON.stringify(global.y))
        y.connector.receiveMessage(socket.id, msg)
      })
    }
  })
  socket.on('disconnect', function () {
    for (var i = 0; i < rooms.length; i++) {
      let room = rooms[i]
      getInstanceOfY(room).then(function (y) {
        var i = rooms.indexOf(room)
        if (i >= 0) {
          y.connector.userLeft(socket.id)
          rooms.splice(i, 1)
        }
      })
    }
  })
  socket.on('leaveRoom', function (room) {
    getInstanceOfY(room).then(function (y) {
      var i = rooms.indexOf(room)
      if (i >= 0) {
        y.connector.userLeft(socket.id)
        rooms.splice(i, 1)
      }
    })
  })
})
