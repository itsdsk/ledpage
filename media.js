const Handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');
const Dat = require('dat-node');
var sockets = require('./sockets.js');

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

var datHttpServer;

db.serialize(function () {
    // create tables for primitive types (media and channel)
    db.run(`CREATE TABLE media (
        directory TEXT PRIMARY KEY, title TEXT, description TEXT,
        image BLOB, blur_amt INT DEFAULT 50, modified TEXT,
        playcount INT DEFAULT 0,
        dat_key CHARACTER(64), dat_versions UNSIGNED SMALL INT
    )`);
    db.run(`CREATE TABLE channels (
        name TEXT PRIMARY KEY
    )`);
    // create tables for relational types (files and connections)
    db.run(`CREATE TABLE files (
        media_directory TEXT NOT NULL, filename TEXT NOT NULL, data TEXT NOT NULL,
        FOREIGN KEY(media_directory) REFERENCES media(directory),
        UNIQUE(media_directory, filename)
    )`);
    db.run(`CREATE TABLE connections (
        media_directory TEXT NOT NULL, channel_name TEXT NOT NULL,
        FOREIGN KEY(media_directory) REFERENCES media(directory),
        FOREIGN KEY(channel_name) REFERENCES channels(name),
        UNIQUE(media_directory, channel_name)
    )`);
});

// directory of media requiring screenshot
var mediaRequiringScreenshot;
var screenshotPath = path.join(__dirname, 'public', 'screenshot.ppm');

//
var backendSocket = new sockets.DomainClient("backend");
backendSocket.event.on('data', function (data) {
    console.log("backend socket got data in media: " + data.toString());
    // setTimeout(function () {
    //     //console.log("responding to broadcast");
    //     //backendSocket.write("responsetobroadcast");
    // }, 1500);
});

setInterval(function () {
    module.exports.setBlur({
        size: (1 + Math.floor(Math.random() * 20))
    });
    //backendSocket.write(`{"window":{"size":${1 + Math.floor(random() * 47)}}}`);
}, 180000);

// prevent duplicate exit messages
var currentURL = "";
var SHUTDOWN = false;
var rendererSocket = new sockets.DomainClient("renderer");
rendererSocket.event.on('data', function (data) {
    console.log("media in data from renderer: " + data.toString());
    if (data.toString() === '__disconnect') {
        cleanup();
    } else {
        var rendererMsg = JSON.parse(data.toString());
        // update currentURL when halfway through transition
        setTimeout(function (URL) {
            currentURL = URL;
        }, config.settings.fadeDuration / 2, rendererMsg.URL);
        // message backend to switch
        if (rendererMsg.loaded) {
            if (rendererMsg.whichWindow == 'A') {
                // send side of screen media is playing on to backend
                backendSocket.write(`{"window":{"half":0,"fade":${config.settings.fadeDuration}}}`);
            } else if (rendererMsg.whichWindow == 'B') {
                // send side of screen media is playing on to backend
                backendSocket.write(`{"window":{"half":1,"fade":${config.settings.fadeDuration}}}`);
            }
            // take screenshot
            if (mediaRequiringScreenshot && mediaRequiringScreenshot.length > 0) {
                //
                if (rendererMsg.URL.startsWith('file:///')) {
                    //
                    var doSaveScreenshot = true;
                    if (doSaveScreenshot) {
                        saveScreenshot(rendererMsg.whichWindow);
                    }
                }
            }
        }
    }
});

function cleanup() {
    if (!SHUTDOWN) {
        SHUTDOWN = true;
        console.log('\n', "Terminating.", '\n');
        if (rendererSocket.connected) {
            rendererSocket.socket.end();
        }
        if (backendSocket.connected) {
            backendSocket.socket.end();
        }
        process.exit(0);
    }
}
process.on('SIGINT', cleanup);

function saveScreenshot(side) {
    // check directory of media
    if (mediaRequiringScreenshot && mediaRequiringScreenshot.length > 0) {
        // send command to backend to save screenshot
        backendSocket.write(JSON.stringify({
            "command": "screenshot"
        }));
        console.log('sent screenshot command to backend');
        // watch screenshot file for changes // TODO: make work if file does not exist yet
        const watcher = fs.watch(screenshotPath, (eventType, filename) => {
            // stop watching once file has been changed
            watcher.close();
            // wait 1 second for backend to finish changing file
            setTimeout(function () {
                // get demo.json and add image to it
                var metaPath = path.join(mediaDir, mediaRequiringScreenshot, 'demo.json');
                var meta = require(metaPath);
                meta.demo.image = "thumb.jpg";
                //
                var targetJpegPath = path.join(mediaDir, mediaRequiringScreenshot, meta.demo.image);
                // convert and crop half of image
                var convertCommand = `convert ${screenshotPath} -gravity ${(side == 'A' ? 'West' : 'East')} -crop 50x100% +repage ${targetJpegPath}`;
                // convert to jpeg
                runCommand(convertCommand, function (stdout) {
                    // add thumbnail to database
                    fs.readFile(targetJpegPath, function (err, buf) {
                        if (err) throw err;
                        var decodedImage = "data:image/jpeg;base64," + buf.toString('base64');
                        var addImgQuery = "UPDATE media SET image = ? WHERE directory = ?";
                        db.run(addImgQuery, [decodedImage, mediaRequiringScreenshot], function (err) {
                            // save demo.json
                            fs.writeFile(metaPath, JSON.stringify(meta, null, 4), function (err) {
                                if (err) console.log(err);
                                // reset
                                mediaRequiringScreenshot = null;
                            });
                        });
                    });
                });
            }, 1000);
        });
    }
}

// add basic iteration/for-loop helper
Handlebars.registerHelper('iterate', function (n, block) {
    var accum = '';
    for (var i = n; i > 0; --i)
        accum += block.fn(i);
    return accum;
});
// compile media
var feedMediaItemCompiler;
fs.readFile(path.join(__dirname, "templates", "disk.hbs"), function (err, data) {
    if (err) throw err;
    feedMediaItemCompiler = Handlebars.compile(data.toString());
});
var channelCompiler;
fs.readFile(path.join(__dirname, "templates", "channel.hbs"), function (err, data) {
    if (err) throw err;
    channelCompiler = Handlebars.compile(data.toString());
});
var channelBlockCompiler;
fs.readFile(path.join(__dirname, "templates", "channel_block.hbs"), function (err, data) {
    if (err) throw err;
    channelBlockCompiler = Handlebars.compile(data.toString());
});
var outputGraphicCompiler;
fs.readFile(path.join(__dirname, "templates", "output_graphic.hbs"), function (err, data) {
    if (err) throw err;
    outputGraphicCompiler = Handlebars.compile(data.toString());
});
var outputFormCompiler;
fs.readFile(path.join(__dirname, "templates", "output_form.hbs"), function (err, data) {
    if (err) throw err;
    outputFormCompiler = Handlebars.compile(data.toString());
});
var mediaEditorCompiler;
fs.readFile(path.join(__dirname, "templates", "disk_editor.hbs"), function (err, data) {
    if (err) throw err;
    mediaEditorCompiler = Handlebars.compile(data.toString());
});

var mediaDir = path.join(__dirname, 'public', 'media');
var config; // device config
module.exports = {
    // build local database in memory
    generateDb: function () {
        // read media directory
        fs.readdir(mediaDir, function (err, files) {
            files.forEach(file => {
                var itemPath = path.join(mediaDir, file);
                fs.stat(itemPath, function (err, stats) {
                    if (err) console.log("err: " + err);
                    // check if subpath is a directory
                    if (stats.isDirectory()) {
                        // check folder is not hidden
                        if (itemPath.includes('/.') == false) {
                            // load media metadata
                            var meta = require(path.join(itemPath, 'demo.json'));
                            if (meta) {
                                // add to database
                                parseMediaItemDirectory(file, meta);
                            }
                        }
                    }
                });
            });
        });
        // get config JSON
        var configPath = path.join(__dirname, 'public', 'config.json');
        try {
            config = require(configPath);
        } catch (ex) {
            console.log("Error getting config: " + ex);
            var pathToDefault = path.join(__dirname, 'public', '.default_config.json');
            fs.copyFile(pathToDefault, configPath, (err) => {
                if (err) console.log(err)
                else {
                    console.log("Copied default config to " + configPath);
                    config = require(configPath);
                }
            });
        }
    },
    nowPlaying: function (callback) {
        callback(currentURL);
    },
    reloadPage: function () {
        if (currentURL.includes('file:///')) {
            // get directory name
            var splitURL = currentURL.split('/');
            var directoryname = splitURL[splitURL.length - (splitURL[splitURL.length - 1].includes('.') ? 2 : 1)];
            // send message to play local media
            module.exports.playLocalMedia({
                directory: directoryname
            });
        } else {
            // send full URL to play remote media
            module.exports.playRemoteMedia(currentURL);
        }
        mediaRequiringScreenshot = null;
    },
    createMedia: function (channelName, callback) {
        // stop autoplay
        module.exports.stopAutoplay();
        // path of new media
        var randomName = "item_" + Math.random().toString(36).substring(2, 8);
        var newDirectory = path.join(mediaDir, randomName);
        console.log("USER INPUT::creating media: " + newDirectory);
        // make directory
        fs.mkdir(newDirectory, function (err) {
            if (err) console.log(err)
            else {
                var pathToDefault = path.join(mediaDir, '.default');
                // get default metadata
                var meta = require(path.join(pathToDefault, 'demo.json'));
                // add channel if unique
                if (meta.demo.channels.indexOf(channelName) === -1)
                    meta.demo.channels.push(channelName);
                // save metadata to disk
                fs.writeFile(path.join(newDirectory, 'demo.json'), JSON.stringify(meta, null, 4), function (err) {
                    if (err) console.log(err);
                    // copy default files
                    fs.copyFile(path.join(pathToDefault, 'index.html'), path.join(newDirectory, 'index.html'), (err) => {
                        if (err) console.log(err);
                        fs.copyFile(path.join(pathToDefault, 'style.css'), path.join(newDirectory, 'style.css'), (err) => {
                            if (err) console.log(err);
                            fs.copyFile(path.join(pathToDefault, 'sketch.js'), path.join(newDirectory, 'sketch.js'), (err) => {
                                if (err) console.log(err);
                                fs.copyFile(path.join(pathToDefault, 'thumb.jpg'), path.join(newDirectory, 'thumb.jpg'), (err) => {
                                    if (err) console.log(err);
                                    // add to database
                                    parseMediaItemDirectory(randomName, meta, callback(randomName));
                                });
                            });
                        });
                    });
                });
            }
        });
    },
    renameMedia: function (msg, callback) {
        // stop autoplay
        module.exports.stopAutoplay();
        // get demo.json
        var metaPath = path.join(mediaDir, msg.directory, 'demo.json');
        var meta = require(metaPath);
        console.log("USER INPUT::renaming media " + msg.directory + " from " + meta.demo.title + " to " + msg.newName);
        // add new title to demo.json
        meta.demo.title = msg.newName;
        // update name in database
        var updateTitleQuery = "UPDATE media SET title = ? WHERE directory = ?";
        db.run(updateTitleQuery, [msg.newName, msg.directory], function (err) {
            // save demo.json
            fs.writeFile(metaPath, JSON.stringify(meta, null, 4), function (err) {
                if (err) console.log(err);
                callback();
            });
        });
    },
    listDatabase: function () {
        // log entries
        db.each("SELECT * FROM media", function (err, row) {
            console.log("MEDIA: " + row.directory + " " + row.title + " " + row.description);
        });
        db.each("SELECT rowid AS id, media_directory, filename FROM files", function (err, row) {
            console.log("FILE: " + row.media_directory + " " + row.filename + " " + row.id);
        });
        db.each("SELECT * FROM channels", function (err, row) {
            console.log("CHANNEL: " + row.name);
        });
        db.each("SELECT * FROM connections", function (err, row) {
            console.log("CONNECTION: " + row.media_directory + " " + row.channel_name);
        });
        db.each("SELECT * FROM outputs", function (err, row) {
            console.log("OUTPUT: " + JSON.stringify(row));
        });
        db.each("SELECT * FROM leds", function (err, row) {
            console.log("LED: " + JSON.stringify(row));
        });
    },
    createChannel: function (msg) {
        // stop autoplay
        module.exports.stopAutoplay();
        console.log("USER INPUT::creating channel: " + msg);
        var createQuery = "INSERT INTO channels (name) VALUES (?)";
        db.run(createQuery, [msg]);
    },
    createFile: function (msg, callback) {
        // stop autoplay
        module.exports.stopAutoplay();
        //
        var filepath = path.join(mediaDir, msg, 'new_file.txt');
        console.log("USER INPUT::creating file " + filepath);
        // create file on disk
        fs.writeFile(filepath, "", function (err) {
            if (err) console.log(err);
            // add file to JSON
            var metaPath = path.join(mediaDir, msg, 'demo.json');
            var meta = require(metaPath);
            meta.demo.files.push('new_file.txt');
            fs.writeFile(metaPath, JSON.stringify(meta, null, 4), function (err) {
                if (err) console.log(err);
                // add file to database
                var addFileQuery = "INSERT INTO files (media_directory, filename, data) VALUES (?, ?, ?)";
                db.run(addFileQuery, [msg, 'new_file.txt', ""], function () {
                    callback();
                });
            });
        });
    },
    renameFile: function (msg, callback) {
        // stop autoplay
        module.exports.stopAutoplay();
        // get path of file on disk
        var oldPath = path.join(mediaDir, msg.directory, msg.oldName);
        var newPath = path.join(mediaDir, msg.directory, msg.newName);
        console.log("USER INPUT::renaming file " + msg.oldName + " - " + newPath);
        // rename file on disk
        fs.rename(oldPath, newPath, function (err) {
            if (err) console.log(err);
            // update JSON
            var metaPath = path.join(mediaDir, msg.directory, 'demo.json');
            var meta = require(metaPath);
            var index = meta.demo.files.indexOf(msg.oldName); // get index of channel in array
            if (index > -1) {
                // delete if exists
                meta.demo.files[index] = msg.newName;
            }
            fs.writeFile(metaPath, JSON.stringify(meta, null, 4), function (err) {
                if (err) console.log(err);
                // update name in database
                var updateQuery = "UPDATE files SET filename = ? WHERE rowid = ?";
                db.run(updateQuery, [msg.newName, msg.fileID], function () {
                    callback();
                });
            });
        });
    },
    updateFile: function (msg) {
        // stop autoplay
        module.exports.stopAutoplay();
        // update file in database
        var updateQuery = "UPDATE files SET data = ? WHERE rowid = ?";
        db.run(updateQuery, [msg.text, msg.fileID]);
        // get path of file on disk
        var filepath = path.join(mediaDir, msg.directory, msg.filename);
        console.log("USER INPUT::updating file " + filepath);
        // update file on disk
        fs.writeFile(filepath, msg.text, function (err) {
            if (err) console.log(err);
            // refresh display
            module.exports.playLocalMedia({
                directory: msg.directory
            });
        });
    },
    removeFile: function (msg, callback) {
        // stop autoplay
        module.exports.stopAutoplay();
        // remove file in database
        var removeQuery = "DELETE FROM files WHERE rowid = ?";
        db.run(removeQuery, [msg.fileID]);
        // get path of file on disk
        var filepath = path.join(mediaDir, msg.directory, msg.filename);
        console.log("USER INPUT::removing file " + filepath);
        // remove file on disk
        fs.unlink(filepath, function (err) {
            if (err) console.log(err);
            // update demo.json
            var metaPath = path.join(mediaDir, msg.directory, 'demo.json');
            var meta = require(metaPath);
            var index = meta.demo.files.indexOf(msg.filename); // get index of channel in array
            if (index > -1) {
                // delete if exists
                meta.demo.files.splice(index, 1);
            }
            // save json to disk
            fs.writeFile(metaPath, JSON.stringify(meta, null, 4), function (err) {
                if (err) console.log(err);
                if (rendererSocket.connected) {
                    // send file path to renderer to refresh display
                    var updatedDir = 'file://' + path.join(mediaDir, msg.directory);
                    rendererSocket.write(JSON.stringify({
                        command: 'loadURL',
                        path: updatedDir
                    }));
                    console.log('refreshing ' + updatedDir);
                }
                callback();
            });
        });
    },
    saveVersion: function (msg) {
        // stop autoplay
        module.exports.stopAutoplay();
        // save version of media to Dat
        Dat(path.join(mediaDir, msg), function (err, dat) {
            if (err) throw err;
            if (dat.writable) {
                dat.importFiles();
                dat.joinNetwork();
                console.log("USER INPUT::Saved revision " + dat.archive.version + " of " + msg + " in dat://" + dat.key.toString('hex'));
                // get datetime
                var timestamp = new Date().toISOString();
                timestamp = timestamp.substring(0, timestamp.lastIndexOf('.')); // trim ms out of datetime string
                // update key+version in database
                var addDatQuery = "UPDATE media SET dat_key = ?, dat_versions = ?, modified = ? WHERE directory = ?";
                db.run(addDatQuery, [dat.key.toString('hex'), dat.archive.version, timestamp, msg]);
                // update dat key and datetime in JSON
                var metaPath = path.join(mediaDir, msg, 'demo.json');
                var meta = require(metaPath);
                meta.demo = Object.assign(meta.demo, {
                    datKey: dat.key.toString('hex'),
                    modified: timestamp
                });
                fs.writeFile(metaPath, JSON.stringify(meta, null, 4), function (err) {
                    if (err) console.log(err);
                });
            } else {
                console.log("USER INPUT ERROR::Could not save version because dat is not writable (must be owner to import files)");
            }
        });
        // TEST TO CHECKOUT AND DOWNLOAD OLD VERSION
        // Dat('/home/testmediaitem/', {
        //     key: '0c2f952a505a2bffc913a79e0fdc2cccf2654a31ff555dc6248a407036c69cd5'
        // }, function (err, dat) {
        //     if(err) throw err;
        //     dat.joinNetwork();
        //     dat.archive.on('content', function() {
        //         dat.archive.checkout(4).download('/', function (err) {
        //             if(err)console.log("err: " + err);
        //             dat.archive.readFile('/index.html', {cached: true}, function (err, content) {
        //                 if(err)console.log("err2: " + err);
        //                 console.log("content: " + content);
        //             });
        //         });
        //     });
        // });
    },
    deleteConnection: function (msg, callback) {
        // stop autoplay
        module.exports.stopAutoplay();
        console.log("USER INPUT::deleting connection: " + msg);
        // delete connection in database
        var sql = "DELETE FROM connections WHERE media_directory = ? AND channel_name = ?";
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
            callback(msg[0]);
        });
    },
    createConnection: function (msg, callback) {
        // stop autoplay
        module.exports.stopAutoplay();
        console.log("USER INPUT::creating connection: " + msg);
        // create connection in database
        var sql = "INSERT INTO connections (media_directory, channel_name) VALUES (?, ?)";
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
            callback(msg[0]);
        });
    },
    playLocalMedia: function (dirAndVersion) {
        var filePath = path.join(mediaDir, dirAndVersion.directory);
        if (dirAndVersion.version) {
            // serve Dat to see old version
            Dat(filePath, function (err, dat) {
                if (err) throw err;
                if (datHttpServer)
                    datHttpServer.close();
                datHttpServer = dat.serveHttp({
                    port: 8731
                });
                if (rendererSocket.connected) {
                    // send media path to renderer
                    var rendererURL = 'localhost:8731/?version=' + dirAndVersion.version.toString();
                    rendererSocket.write(JSON.stringify({
                        command: 'loadURL',
                        path: rendererURL
                    }));
                    // // send blur amt to backend
                    // // select media item
                    // var selectQuery = "SELECT blur_amt FROM media WHERE directory = ?";
                    // db.get(selectQuery, [dirAndVersion.directory], (err, itemrow) => {
                    //     // send size to app
                    //     backendSocket.write(`{"window":{"size":${itemrow.blur_amt}}}`);
                    // });
                }
            });
        } else {
            if (rendererSocket.connected) {
                // update playcount in database
                db.run(`UPDATE media SET playcount = playcount + 1 WHERE directory = ?`, [dirAndVersion.directory], (err) => {
                    if (err) console.log(`error updating playcount in database: ${err}`);
                    // get playcount
                    db.get(`SELECT playcount FROM media WHERE directory = ?`, [dirAndVersion.directory], (err, row) => {
                        if (err) console.log(`Error getting media info from db: ${err}`);
                        // get demo.json
                        var metaPath = path.join(mediaDir, dirAndVersion.directory, 'demo.json');
                        var meta = require(metaPath);
                        // update playcount
                        meta.demo.playcount = +row.playcount;
                        // save demo.json
                        fs.writeFile(metaPath, JSON.stringify(meta, null, 4), function (err) {
                            if (err) console.log(err);
                        });
                    });
                });
                // send media file path to renderer
                rendererSocket.write(JSON.stringify({
                    command: 'loadURL',
                    path: ('file://' + filePath + "/index.html")
                }));
                // // send blur amt to backend
                // // select media item
                // var selectQuery = "SELECT blur_amt FROM media WHERE directory = ?";
                // db.get(selectQuery, [dirAndVersion.directory], (err, itemrow) => {
                //     // send size to app
                //     backendSocket.write(`{"window":{"size":${itemrow.blur_amt}}}`);
                // });

                // store media directory to take new screenshot and add it as new thumbnail
                mediaRequiringScreenshot = dirAndVersion.directory;
            }
        }
        console.log('USER INPUT::playing local media: ' + filePath + " version: " + (dirAndVersion.version ? dirAndVersion.version : 'latest'));
    },
    setBlur: function (msg) {
        //
        console.log(`set blur msg: ${JSON.stringify(msg)}`);
        // update backend
        if (backendSocket.socket !== null) {
            backendSocket.write(`{"window":{"size":${msg.size}}}`);
        }
        // // update in database
        // if (msg.directory) {
        //     // get demo.json
        //     var metaPath = path.join(mediaDir, msg.directory, 'demo.json');
        //     var meta = require(metaPath);
        //     // set new blur
        //     meta.demo.blur_amt = msg.size;
        //     console.log("USER INPUT::updating media blur");
        //     // update name in database
        //     var updateBlurQuery = "UPDATE media SET blur_amt = ? WHERE directory = ?";
        //     db.run(updateBlurQuery, [msg.size, msg.directory], function (err) {
        //         // save demo.json
        //         fs.writeFile(metaPath, JSON.stringify(meta, null, 4), function (err) {
        //             if (err) console.log(err);
        //         });
        //     });
        // }
    },
    setCrossfadeTime: function (msg) {
        config.settings.fadeDuration = msg;
        console.log(`setting crossfade time: ${config.settings.fadeDuration}`);
    },
    stopAutoplay: function () {
        // stop autoplay
        clearTimeout(autoplayTimerID);
        autoplayTimerID = null;
        // reset index
        autoplayPos = 0;
    },
    startAutoplay: function (msg) {
        console.log(`USER INPUT::starting autoplay (${(msg && msg.length > 0 ? msg.toString() : 'all')})`);
        // clear list of media
        autoplayList = [];
        // declare SQL query and params
        var selectMediaItemsQuery;
        var queryParams = [];
        // check type of autoplay (shuffle all or shuffle channel)
        if (msg && msg.length > 0) {
            // select all media items in specified channel
            selectMediaItemsQuery = "SELECT media.directory FROM media INNER JOIN connections " +
                "ON media.directory = connections.media_directory " +
                "AND connections.channel_name = ?";
            // add channel name as query parameter
            queryParams.push(msg);
        } else {
            // select all media items
            selectMediaItemsQuery = "SELECT directory FROM media";
        }
        // get list of media to autoplay
        db.all(selectMediaItemsQuery, queryParams, (error, rows) => {
            if (error) console.log(`error getting all media: ${error}`);
            console.log(`${rows.length} items in autoplay list`);
            // add directories to autoplay list
            rows.forEach(function (row) {
                autoplayList.push(row.directory);
            });
            // stop autoplay
            module.exports.stopAutoplay();
            // start autoplay
            autoplayTimerID = setTimeout(autoplayNext, 0);
        });
    },
    setAutoplayTimeRange: function (msg) {
        console.log(`USER INPUT::setting autoplay time range: ${JSON.stringify(msg)}`);
        if (msg.autoplayMinRange) {
            config.settings.autoplayDuration.min = msg.autoplayMinRange;
        }
        if (msg.autoplayMaxRange) {
            config.settings.autoplayDuration.max = msg.autoplayMaxRange;
        }
    },
    playRemoteMedia: function (name) {
        // TODO: check if URL is valid?
        if (rendererSocket.connected) {
            // send media file path to renderer
            rendererSocket.write(JSON.stringify({
                command: 'loadURL',
                path: name
            }));
            // do not take screenshot
            mediaRequiringScreenshot = null;
        }
        console.log('USER INPUT::playing remote media: ' + name);
    },
    loadFeed: function (callback) {
        // get list of distinct media items in connections
        var selectQuery = "SELECT * FROM connections GROUP BY media_directory";
        db.all(selectQuery, function (err, rows) {
            // group into channels
            var grouped = {};
            for (var i = 0; i < rows.length; i++) {
                if (grouped[rows[i].channel_name] == undefined) {
                    grouped[rows[i].channel_name] = [];
                }
                grouped[rows[i].channel_name].push(rows[i]);
            }
            // for each channel
            for (var key in grouped) {
                // skip loop of property is from prototype
                if (!grouped.hasOwnProperty(key)) continue;
                // 
                var obj = grouped[key];
                let media_directories = obj.map(a => a.media_directory);
                serveChannelAndItems(key, media_directories, function (element) {
                    console.log("USER INPUT::loading feed");
                    callback(element);
                });
            }
        });
    },
    loadAll: function (params, callback) {
        // count number of media items
        db.get(`SELECT count(*) AS count FROM media`, (err, info) => {
            console.log(`USER INPUT::loading all`);
            // get list of media sorted by date modified
            var selectQuery = `SELECT directory FROM media `;
            // order
            switch (params.sort) {
                case 'new':
                    info.new = true;
                    selectQuery += `ORDER BY modified ASC`;
                    break;
                case 'top':
                    info.top = true;
                    selectQuery += `ORDER BY playcount ASC`;
                    break;
                default:
                    info.new = true;
                    selectQuery += `ORDER BY modified ASC`;
            }
            // get template
            var element = channelCompiler(info);
            // get sorted media from database
            db.all(selectQuery, (err, rows) => {
                // get array of directories from result
                var directories = Array.from(rows, x => x.directory);
                // get channel names and size
                db.all("SELECT connections.channel_name, count(media.directory) AS count FROM connections INNER JOIN media " +
                    "ON media.directory = connections.media_directory " +
                    "GROUP BY connections.channel_name ORDER BY count(media.directory) ASC",
                    function (err, chan_rows) {
                        // generate HTML for channels
                        serveChannelBlockArray(chan_rows, function (channelElements) {
                            element += channelElements;
                            // generate HTML for media and return all
                            serveMediaArray(directories, function (mediaElements) {
                                callback(element + mediaElements);
                            });
                        });
                    });
            });
        });
    },
    loadEditor: function (directory, callback) {
        templateMediaItem(directory, mediaEditorCompiler, function (elements) {
            console.log("USER INPUT::loading editor: " + directory);
            callback(elements);
        });
    },
    loadChannel: function (params, callback) {
        var channel_name = params.name;
        var elements = "";
        // get channel element at start
        templateChannel(channel_name, params.sort, true, function (channel_element) {
            elements = channel_element;
            // get all media in specified channel
            var selectQuery = "SELECT media.directory FROM media INNER JOIN connections " +
                "ON media.directory = connections.media_directory " +
                "AND connections.channel_name = ? ";
            switch (params.sort) {
                case 'new':
                    selectQuery += `ORDER BY modified ASC`;
                    break;
                case 'top':
                    selectQuery += `ORDER BY playcount ASC`;
                    break;
                default:
                    selectQuery += `ORDER BY modified ASC`;
            }
            db.all(selectQuery, [channel_name], function (err, rows) {
                // get media PKs as array of strings
                let media_directories = rows.map(a => a.directory);
                // 
                serveMediaArray(media_directories, function (media_elements) {
                    elements += media_elements;
                    console.log("USER INPUT::loading feed for channel: " + channel_name);
                    callback(elements);
                });
            });
        });
    },
    loadOutput: function (callback) {
        var element = outputFormCompiler(config) + outputGraphicCompiler(config);
        console.log("USER INPUT::loading output");
        callback(element);
    },
    updateConfig: function (msg) {
        console.log("USER INPUT::updating output configuration");
        // update window
        if (msg.window) {
            config.window = Object.assign(config.window, msg.window);
        }
        // update output
        if (msg.outputs) {
            // find correct output
            msg.outputs.forEach(function (msgoutput) {
                var output = config.outputs.find(x => x.index === msgoutput.index);
                // update output properties
                if (msgoutput.properties) {
                    output.properties = Object.assign(output.properties, msgoutput.properties);
                }
                // update output leds
                if (msgoutput.leds) {
                    // find correct led
                    msgoutput.leds.forEach(function (msgled) {
                        var led = output.leds.find(x => x.index === msgled.index);
                        // update led properties
                        led = Object.assign(led, msgled);
                    });
                }
            });
        }
    },
    uploadConfig: function (msg, callback) {
        console.log("USER INPUT::uploading output configuration");
        config = msg;
        callback();
    },
    saveConfig: function () {
        var configPath = path.join(__dirname, 'public', 'config.json');
        console.log("USER INPUT::saving output config to " + configPath);
        fs.writeFile(configPath, JSON.stringify(config, null, 4), function (err) {
            if (err) console.log(err);
        });
    },
    getLogs: function (callback) {
        console.log("USER INPUT::getting service logs");
        runCommand('journalctl -u disk-backend-daemon.service -b --no-pager --lines=128', function (backendLogs) {
            runCommand('journalctl -u disk-renderer-daemon.service  -b --no-pager --lines=128', function (rendererLogs) {
                runCommand('journalctl -u disk-ui-daemon.service  -b --no-pager --lines=128', function (uiLogs) {
                    callback("backend: \n" + backendLogs + "renderer: \n" + rendererLogs + "ui: \n" + uiLogs);
                });
            });
        });
    },
    restartService: function (msg) {
        console.log("USER INPUT::restarting service " + msg);
        runCommand('systemctl restart ' + msg);
    },
    systemPower: function (msg) {
        console.log("USER INPUT::system " + msg);
        if (msg == "shutdown")
            runCommand('shutdown now');
        else if (msg == "reboot")
            runCommand('reboot');
    }
};

function serveChannelAndItems(channel_name, media_directories, callback) {
    var element = "";
    templateChannel(channel_name, 'new', false, function (channel_element) {
        element += channel_element;
        serveMediaArray(media_directories, function (media_elements) {
            element += media_elements;
            callback(element);
        });
    });
}

function serveMediaArray(titles, callback) {
    var object = "";

    function repeat(title) {
        templateMediaItem(title, feedMediaItemCompiler, function (element) {
            object += element;
            if (titles.length) {
                repeat(titles.pop());
            } else {
                callback(object);
            }
        });
    }
    repeat(titles.pop());
}

function serveChannelBlockArray(channels, callback) {
    var object = "";

    function repeat(channel) {
        templateChannelBlock(channel, function (element) {
            object += element;
            if (channels.length) {
                repeat(channels.pop());
            } else {
                callback(object);
            }
        });
    }
    repeat(channels.pop());
}

function templateChannelBlock(data, callback) {
    var element = channelBlockCompiler(data);
    callback(element);
}

function templateChannel(channel_name, sort, create_flag, callback) {
    // count number of items in channel
    var countQuery = "SELECT channel_name, count(*) AS count FROM connections WHERE channel_name = ?";
    db.get(countQuery, [channel_name], (err, count) => {
        count.create = create_flag;
        count[sort] = true;
        var element = channelCompiler(count);
        callback(element);
    });
}

function templateMediaItem(media_directory, templateCompiler, callback) {
    // fetch entry requested in [key] arg from media table
    var sql = "SELECT directory, title, description, image, blur_amt, modified, dat_key, dat_versions FROM media WHERE directory = ?";
    db.get(sql, [media_directory], (err, itemrow) => {
        itemrow.files = new Array();
        // fetch corresponding entries in files table
        db.all("SELECT rowid AS id, media_directory, filename, data FROM files WHERE media_directory = ?", [media_directory], function (err, filerows) {
            filerows.forEach(function (filerow) {
                // add each file to object
                itemrow.files.push(filerow);
            });
            // add arrays to hold channels
            itemrow.connectedChannels = new Array();
            itemrow.unconnectedChannels = new Array();
            // get channels
            var getChannelsQuery = "SELECT channels.name, connections.media_directory FROM channels LEFT JOIN connections " +
                "ON channels.name = connections.channel_name " +
                "AND connections.media_directory = ?";
            db.all(getChannelsQuery, [media_directory], function (err, chanrows) {
                // loop through channels
                chanrows.forEach(function (chanrow) {
                    // check if channel is connected
                    if (chanrow.media_directory) {
                        itemrow.connectedChannels.push(chanrow);
                    } else {
                        itemrow.unconnectedChannels.push(chanrow);
                    }
                });
                // compile media object into HTML and send to client websocket
                var element = templateCompiler(itemrow);
                callback(element);
            });
        });
    });
}

function parseMediaItemDirectory(directory, meta, callback) {
    // add metadata to media table in database
    var insertQuery = "INSERT INTO media (directory, title, description, modified) VALUES (?, ?, ?, ?)";
    db.run(insertQuery, [directory, meta.demo.title, meta.demo.description, meta.demo.modified], function () {
        var itemPath = path.join(mediaDir, directory);
        // add image to media database TODO: check if files exist
        if (meta.demo.image && meta.demo.image.length > 0) {
            var imagePath = path.join(itemPath, meta.demo.image);
            fs.readFile(imagePath, function (err, buf) {
                if (err) throw err;
                var decodedImage = "data:image/jpeg;base64," + buf.toString('base64');
                var addImgQuery = "UPDATE media SET image = ? WHERE directory = ?";
                db.run(addImgQuery, [decodedImage, directory]);
            });
        }
        // add playcount
        if (meta.demo.playcount) {
            db.run(`UPDATE media SET playcount = ? WHERE directory = ?`, [meta.demo.playcount, directory]);
        }
        // // add blur amount to database
        // if (meta.demo.blur_amt) {
        //     var addBlurQuery = "UPDATE media SET blur_amt = ? WHERE directory = ?";
        //     db.run(addBlurQuery, [meta.demo.blur_amt, directory]);
        // }
        // add files to database
        var addFileQuery = "INSERT INTO files (media_directory, filename, data) VALUES (?, ?, ?)";
        meta.demo.files.forEach(filename => {
            var filepath = path.join(itemPath, filename);
            fs.readFile(filepath, 'utf8', function (err, buf) {
                if (err) throw err;
                db.run(addFileQuery, [directory, filename, buf]);
            });
        });
        // add channels to database
        var addChannelQuery = "INSERT INTO channels (name) VALUES (?)";
        var addConnectQuery = "INSERT INTO connections (media_directory, channel_name) VALUES (?, ?)";
        meta.demo.channels.forEach(channelName => {
            // add name to channels table
            db.run(addChannelQuery, [channelName], function () {
                // add pair to connections table
                db.run(addConnectQuery, [directory, channelName], callback);
            });
        });
        // add DAT info to database
        if (meta.demo.datKey) {
            // get version number from Dat
            Dat(itemPath, {
                key: meta.demo.datKey,
                sparse: true
            }, function (err, dat) {
                if (err) throw err;
                dat.joinNetwork();
                // update Dat fields in database
                var addDatQuery = "UPDATE media SET dat_key = ?, dat_versions = ? WHERE directory = ?";
                db.run(addDatQuery, [meta.demo.datKey, dat.archive.version, directory]);
            });
        }
    });

}

function runCommand(command, callback) {
    // run terminal command
    var exec = require('child_process').exec;
    exec(command, function (err, stdout, stderr) {
        if (err) {
            if (callback) callback(stderr);
        } else {
            if (callback) callback(stdout);
        }
    });
}

var autoplayTimerID; // ID used to stop autoplay
var autoplayList = []; // list of items to autoplay
var autoplayPos = 0; // index in autoplay list

function autoplayNext() {
    // check there are items in playlist
    if (autoplayList && autoplayList.length > 0) {
        // check randomness and bounds
        if (autoplayPos == 0) {
            // shuffle list at start
            autoplayList.sort(function () {
                return 0.5 - Math.random()
            });
        } else if (autoplayPos >= autoplayList.length) {
            // reset counter at end
            autoplayPos = 0;
        }
        // play item
        module.exports.playLocalMedia({
            directory: autoplayList[autoplayPos]
        });
        // choose random timespan in min-max range to wait before playing next
        // TODO: add crossfadetime to delay time (and add props to config.json)
        var delayTime = Math.random() * Math.abs(config.settings.autoplayDuration.max - config.settings.autoplayDuration.min);
        delayTime += Math.min(config.settings.autoplayDuration.max, config.settings.autoplayDuration.min); // add min of range
        // increment autoplay position
        autoplayPos = (autoplayPos + 1) % autoplayList.length;
        // start timer to autoplay next
        autoplayTimerID = setTimeout(autoplayNext, delayTime);
    } else {
        // error autoplaying
        console.log(`error autoplaying - list is empty`);
    }
}