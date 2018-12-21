const app = require('express')();
const helper = require("./media.js");

var http = require('http').Server(app);
var io = require('socket.io')(http);

const Dat = require('dat-node');

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
    console.log('load');
    content.forEach(element => {
      //console.log(element);
      io.emit('load', helper.mediaObjectToHtml(element));
    });
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

Dat('./media/item1', function (err, dat) {
  if (err) throw err;
  dat.importFiles();
  dat.joinNetwork();
  console.log("dat link: dat://" + dat.key.toString('hex'));
});

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

db.serialize(function () {
  db.run("CREATE TABLE disks (directory TEXT PRIMARY KEY, name TEXT)");
  db.run("INSERT INTO disks (directory,name) VALUES ('dir1','name1')");

  db.run("CREATE TABLE channels (name TEXT PRIMARY KEY)");
  db.run("INSERT INTO channels (name) VALUES ('channel1')");

  db.run("CREATE TABLE disks_channels (disk_directory TEXT, channel_name TEXT," +
    "FOREIGN KEY(disk_directory) REFERENCES disks(directory)," +
    "FOREIGN KEY(channel_name) REFERENCES channels(name))");
  db.run("INSERT INTO disks_channels (disk_directory, channel_name) VALUES ('dir1','channel1')");
  db.run("INSERT INTO disks_channels (disk_directory, channel_name) VALUES ('dir5','channel1')"); // bogus

  // log entries
  db.each("SELECT * FROM disks", function (err, row) {
    console.log("DISK: " + row.directory + " " + row.name);
  });
  db.each("SELECT * FROM channels", function (err, row) {
    console.log("CHANNEL: " + row.name);
  });
  db.each("SELECT * FROM disks_channels", function (err, row) {
    console.log("DISK_CHANNEL: " + row.disk_directory + " " + row.channel_name);
  });
});