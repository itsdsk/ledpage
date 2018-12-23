const Handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

db.serialize(function () {
    // create tables
    db.run("CREATE TABLE disks (directory TEXT PRIMARY KEY, title TEXT, description TEXT, image BLOB)");
    db.run("CREATE TABLE channels (name TEXT PRIMARY KEY)");
    db.run("CREATE TABLE connections (disk_directory TEXT NOT NULL, channel_name TEXT NOT NULL," +
        "FOREIGN KEY(disk_directory) REFERENCES disks(directory)," +
        "FOREIGN KEY(channel_name) REFERENCES channels(name)," +
        "UNIQUE(disk_directory, channel_name))");

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
        var media = new Array();
        // look in each folder in content directory
        fs.readdir(mediaDir, function (err, files) {
            files.forEach(file => {
                //console.log(file);
                var itemPath = path.join(mediaDir, file);
                console.log(itemPath);
                fs.stat(itemPath, function (err, stats) {
                    if (err) console.log("err: " + err);
                    if (stats.isDirectory()) {
                        console.log('file: ' + file);
                        var metad = require(path.join(itemPath, 'demo.json'));
                        if (metad) {
                            console.log("this:L " + JSON.stringify(metad));
                            var insertQuery = "INSERT INTO disks (directory, title, description) VALUES (?, ?, ?)";
                            db.run(insertQuery, [file, metad.demo.title, metad.demo.description], function () {
                                console.log("here");
                                // parse image into json
                                var imagePath = path.join(itemPath, metad.demo.image);
                                fs.readFile(imagePath, function (err, buf) {
                                    if (err) throw err;
                                    //meta.img_src = "data:image/jpeg;base64," + buf.toString('base64');
                                    var decodedImage = "data:image/jpeg;base64," + buf.toString('base64');
                                    var addImgQuery = "UPDATE disks SET image = ? WHERE directory = ?";
                                    db.run(addImgQuery, [decodedImage, file]);
                                    //var sql = "INSERT INTO disks (directory, title) VALUES (?, ?)";
                                    //db.run(sql, [mediaPath, meta.demo.title]);
                                    //media.push(meta);
                                });

                            });
                        }
                    }
                });
            });
        });
        // fs.readdirSync(mediaPathRoot).filter(function (mediaPath) {
        //     if (fs.statSync(path.join(mediaPathRoot, mediaPath)).isDirectory()) {
        //         // load json
        //         var meta = require(path.join(__dirname, mediaPathRoot, mediaPath, 'demo.json'));
        //         meta.directory = mediaPath;
        //         // load files
        //         meta.files = new Array();
        //         (meta.demo.files).forEach(filename => {
        //             fs.readFile(path.join(__dirname, mediaPathRoot, mediaPath, filename), 'utf8', function (err, buf) {
        //                 if (err) throw err;
        //                 var fileData = {
        //                     name: filename,
        //                     text: buf
        //                 };
        //                 meta.files.push(fileData);
        //                 //console.log(meta);
        //                 //media.push(meta);
        //             });
        //         });
        //         // parse image into json
        //         fs.readFile('./media/item1/thumb.jpg', function (err, buf) {
        //             if (err) throw err;
        //             meta.img_src = "data:image/jpeg;base64," + buf.toString('base64');
        //             var sql = "INSERT INTO disks (directory, title) VALUES (?, ?)";
        //             db.run(sql, [mediaPath, meta.demo.title]);
        //                 //media.push(meta);
        //         });
        //         // add item to array
        //         // var sql = "INSERT INTO disks (directory, title) VALUES (?, ?)";
        //         // db.run(sql, [mediaPath, meta.demo.title, meta.img_src]);
        //         //db.run("INSERT INTO disks (directory,title,image) VALUES ('" + mediaPath + "','" + meta.demo.title + "','" + meta.imc_src + "')");
        //         media.push(meta);
        //     }
        // });
        // log entries
        db.each("SELECT * FROM disks", function (err, row) {
            console.log("DISK: " + row.directory + " " + row.title + " " + row.description + " " + row.image);
        });
        db.each("SELECT * FROM channels", function (err, row) {
            console.log("CHANNEL: " + row.name);
        });
        // db.each("SELECT * FROM disks_channels", function (err, row) {
        //     console.log("DISK_CHANNEL: " + row.disk_directory + " " + row.channel_name);
        // });
        return media;
    },
    listDatabase: function () {
        // log entries
        db.each("SELECT * FROM disks", function (err, row) {
            console.log("DISK: " + row.directory + " " + row.title + " " + row.description + " " + row.image);
        });
        db.each("SELECT * FROM channels", function (err, row) {
            console.log("CHANNEL: " + row.name);
        });

    },
    mediaObjectToHtml: function (item) {
        return template(item);
    },
    updateFile: function (localItem, mediaUpdate) {
        // get object with matching filename
        var mediaItemFile = localItem.files.find(object => {
            return object.name === mediaUpdate.filename;
        });
        // save updated text in memory
        mediaItemFile.text = mediaUpdate.text;
        // save updated text to file on disk
        var filePath = path.join(__dirname, mediaPathRoot, localItem.directory, mediaUpdate.filename);
        fs.writeFile(filePath, mediaUpdate.text, function (err) {
            if (err) console.log(err);
            console.log('saved ' + filePath);
        });
    },
    playLocalMedia: function (name) {
        var filePath = path.join(__dirname, mediaPathRoot, name);
        console.log('playing local media: ' + filePath);
        // TODO: reimplement IPC to send filepath to renderer
    },
    serveOne: function (io, key) {
        var element;
        var sql = "SELECT directory, title, image FROM disks WHERE directory = ?";
        db.get(sql, [key], (err, row) => {
            console.log("row: " + JSON.stringify(row));
            element = template(row);
            console.log("template: " + element);
            io.emit('load', element);
            //return element;
            //console.log("worked from " + key + " on: " + row.title);
        });
    }
};

// // dummy data
// db.run("INSERT INTO disks (directory,name) VALUES ('dir1','name1')");
// db.run("INSERT INTO disks (directory,name) VALUES ('dir2','name2')");
// db.run("INSERT INTO disks (directory,name) VALUES ('dir3','name3')");
// db.run("INSERT INTO disks (directory,name) VALUES ('dir4','name4')");
// db.run("INSERT INTO channels (name) VALUES ('channel1')");
// db.run("INSERT INTO channels (name) VALUES ('channel2')");

// db.run("INSERT INTO disks_channels (disk_directory, channel_name) VALUES ('dir1','channel1')");
// db.run("INSERT INTO disks_channels (disk_directory, channel_name) VALUES ('dir2','channel1')");
// db.run("INSERT INTO disks_channels (disk_directory, channel_name) VALUES ('dir3','channel1')");
// db.run("INSERT INTO disks_channels (disk_directory, channel_name) VALUES ('dir1','channel2')");
// db.run("INSERT INTO disks_channels (disk_directory, channel_name) VALUES ('dir2','channel2')");

// // log entries
// db.each("SELECT * FROM disks", function (err, row) {
//     console.log("DISK: " + row.directory + " " + row.name);
// });
// db.each("SELECT * FROM channels", function (err, row) {
//     console.log("CHANNEL: " + row.name);
// });
// db.each("SELECT * FROM disks_channels", function (err, row) {
//     console.log("DISK_CHANNEL: " + row.disk_directory + " " + row.channel_name);
// });

// // test log
// db.each("SELECT disks.* FROM disks INNER JOIN connections " +
//     "ON disks.directory = connections.disk_directory " +
//     "AND connections.channel_name = 'channel2'",
//     function (err, row) {
//         console.log("TEST: " + JSON.stringify(row));
//     });