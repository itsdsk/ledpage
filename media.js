const Handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

db.serialize(function () {
    // create tables
    db.run("CREATE TABLE disks (directory TEXT PRIMARY KEY, title TEXT, description TEXT, image BLOB)");
    db.run("CREATE TABLE files (disk_directory TEXT NOT NULL, filename TEXT NOT NULL, data TEXT NOT NULL," +
        "FOREIGN KEY(disk_directory) REFERENCES disks(directory)," +
        "UNIQUE(disk_directory, filename))");
    db.run("CREATE TABLE channels (name TEXT PRIMARY KEY)");
    db.run("CREATE TABLE connections (disk_directory TEXT NOT NULL, channel_name TEXT NOT NULL," +
        "FOREIGN KEY(disk_directory) REFERENCES disks(directory)," +
        "FOREIGN KEY(channel_name) REFERENCES channels(name)," +
        "UNIQUE(disk_directory, channel_name))");
    db.run("INSERT INTO channels (name) VALUES ('channel2')");
    db.run("INSERT INTO channels (name) VALUES ('channel3')");
});

// compile media
var template;
fs.readFile(__dirname + "/template.handlebars", function (err, data) {
    if (err) throw err;
    template = Handlebars.compile(data.toString());
});
var mediaPathRoot = './media';
var mediaDir = path.join(__dirname, mediaPathRoot);
module.exports = {
    // build local database in memory
    scanMedia: function () {
        // read media directory
        fs.readdir(mediaDir, function (err, files) {
            files.forEach(file => {
                var itemPath = path.join(mediaDir, file);
                fs.stat(itemPath, function (err, stats) {
                    if (err) console.log("err: " + err);
                    // check if subpath is a directory
                    if (stats.isDirectory()) {
                        // load media metadata
                        var meta = require(path.join(itemPath, 'demo.json'));
                        if (meta) {
                            // add metadata to disks table in database
                            var insertQuery = "INSERT INTO disks (directory, title, description) VALUES (?, ?, ?)";
                            db.run(insertQuery, [file, meta.demo.title, meta.demo.description], function () {
                                // add image to disks database
                                var imagePath = path.join(itemPath, meta.demo.image);
                                fs.readFile(imagePath, function (err, buf) {
                                    if (err) throw err;
                                    var decodedImage = "data:image/jpeg;base64," + buf.toString('base64');
                                    var addImgQuery = "UPDATE disks SET image = ? WHERE directory = ?";
                                    db.run(addImgQuery, [decodedImage, file]);
                                });
                                // add files to database
                                var addFileQuery = "INSERT INTO files (disk_directory, filename, data) VALUES (?, ?, ?)";
                                meta.demo.files.forEach(filename => {
                                    var filepath = path.join(itemPath, filename);
                                    fs.readFile(filepath, 'utf8', function (err, buf) {
                                        if (err) throw err;
                                        db.run(addFileQuery, [file, filename, buf]);
                                    });
                                });
                                // add channels to database
                                var addChannelQuery = "INSERT INTO channels (name) VALUES (?)";
                                var addConnectQuery = "INSERT INTO connections (disk_directory, channel_name) VALUES (?, ?)";
                                meta.demo.channels.forEach(channelName => {
                                    // add name to channels table
                                    db.run(addChannelQuery, [channelName], function () {
                                        // add pair to connections table
                                        db.run(addConnectQuery, [file, channelName]);
                                    });
                                });
                            });
                        }
                    }
                });
            });
        });
    },
    listDatabase: function () {
        // log entries
        db.each("SELECT * FROM disks", function (err, row) {
            console.log("DISK: " + row.directory + " " + row.title + " " + row.description);
        });
        db.each("SELECT rowid AS id, disk_directory, filename FROM files", function (err, row) {
            console.log("FILE: " + row.disk_directory + " " + row.filename + " " + row.id);
        });
        db.each("SELECT * FROM channels", function (err, row) {
            console.log("CHANNEL: " + row.name);
        });

    },
    mediaObjectToHtml: function (item) {
        return template(item);
    },
    updateFile: function (msg) {
        // update file in database
        var updateQuery = "UPDATE files SET data = ? WHERE rowid = ?";
        db.run(updateQuery, [msg.text, msg.fileID]);
        // get path of file on disk
        var filepath = path.join(mediaDir, msg.directory, msg.filename);
        // update file on disk
        fs.writeFile(filepath, msg.text, function (err) {
            if (err) console.log(err);
        });
    },
    deleteConnection: function (msg) {
        // delete connection in database
        var sql = "DELETE FROM connections WHERE disk_directory = ? AND channel_name = ?";
        db.run(sql, msg);
        // get path and load json
        var metaPath = path.join(mediaDir, msg[0], 'demo.json');
        var meta = require(metaPath);
        // get index of channel in array
        var index = meta.demo.channels.indexOf(msg[1]);
        if (index > -1) {
            // delete if exists
            meta.demo.channels.splice(index, 1);
        }
        // save json to disk
        fs.writeFile(metaPath, JSON.stringify(meta, null, 4), function (err) {
            if (err) console.log(err);
        });
    },
    createConnection: function (msg) {
        // create connection in database
        var sql = "INSERT INTO connections (disk_directory, channel_name) VALUES (?, ?)";
        db.run(sql, msg);
        // get path and load json
        var metaPath = path.join(mediaDir, msg[0], 'demo.json');
        var meta = require(metaPath);
        // get index of channel in array
        var index = meta.demo.channels.indexOf(msg[1]);
        if (index == -1) {
            // add if channel isnt connected
            meta.demo.channels.push(msg[1]);
        }
        // save json to disk
        fs.writeFile(metaPath, JSON.stringify(meta, null, 4), function (err) {
            if (err) console.log(err);
        });
    },
    playLocalMedia: function (name) {
        var filePath = path.join(mediaDir, name);
        console.log('playing local media: ' + filePath);
        // TODO: reimplement IPC to send filepath to renderer
    },
    serveOne: function (io, key) {
        // fetch entry requested in [key] arg from disks table
        var sql = "SELECT directory, title, description, image FROM disks WHERE directory = ?";
        db.get(sql, [key], (err, itemrow) => {
            itemrow.files = new Array();
            // fetch corresponding entries in files table
            db.all("SELECT rowid AS id, disk_directory, filename, data FROM files WHERE disk_directory = ?", [key], function (err, filerows) {
                filerows.forEach(function (filerow) {
                    // add each file to object
                    itemrow.files.push(filerow);
                });
                // add arrays to hold channels
                itemrow.connectedChannels = new Array();
                itemrow.unconnectedChannels = new Array();
                // get channels
                var getChannelsQuery = "SELECT channels.name, connections.disk_directory FROM channels LEFT JOIN connections " +
                    "ON channels.name = connections.channel_name " +
                    "AND connections.disk_directory = ?";
                db.all(getChannelsQuery, [key], function (err, chanrows) {
                    // loop through channels
                    chanrows.forEach(function (chanrow) {
                        // check if channel is connected
                        if (chanrow.disk_directory) {
                            itemrow.connectedChannels.push(chanrow);
                        } else {
                            itemrow.unconnectedChannels.push(chanrow);
                        }
                    });
                    // compile media object into HTML and send to client websocket
                    var element = template(itemrow);
                    io.emit('load', element);
                });
                // // fetch connected channels
                // itemrow.channels = new Array();
                // var getChannelsQuery = "SELECT channel_name FROM connections WHERE disk_directory = ?";
                // db.all(getChannelsQuery, [key], function (err, chanrows) {
                //     chanrows.forEach(function (chanrow) {
                //         // add each connected channel to object
                //         itemrow.channels.push(chanrow);
                //     });
                //     // compile media object into HTML and send to client websocket
                //     var element = template(itemrow);
                //     io.emit('load', element);
                // });
            });
        });
    }
};