const util = require('util');
const fs = require('fs');
const copyFilePromise = util.promisify(fs.copyFile);
const path = require('path');
const EventEmitter = require('events');
var sockets = require('./sockets.js');

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

db.serialize(function () {
    // create tables for primitive types (media and channel)
    db.run(`CREATE TABLE media (
        directory TEXT PRIMARY KEY, title TEXT, description TEXT,
        image BLOB, blur_amt INT DEFAULT 50, modified TEXT,
        source TEXT, playcount INT DEFAULT 0
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
        blur: (1 + Math.floor(Math.random() * 20))
    });
    //backendSocket.write(`{"window":{"size":${1 + Math.floor(random() * 47)}}}`);
}, 180000);

// prevent duplicate exit messages
var playback = {
    currentURL: false,
    playing: false,
    playingFadeIn: false,
    playingAutoNext: false,
    channel: false,
    transitioningTimerID: false,
    autoplayTimerID: false
}
// program exit flag
var SHUTDOWN = false;
// IPC definition, data events
var rendererSocket = new sockets.DomainClient("renderer");
rendererSocket.event.on('data', function (data) {
    console.log("media in data from renderer: " + data.toString());
    if (data.toString() === '__disconnect') {
        cleanup();
    } else {
        var rendererMsg = JSON.parse(data.toString());
        // message backend to switch
        if (rendererMsg.loaded) {
            // update currentURL when halfway through transition
            changePlaybackID = setTimeout(function (URL) {
                playback.currentURL = URL;
            }, config_settings.fade / 2, rendererMsg.URL);
            // object containing commands for backend
            var backendMsg = {};
            // tell backend where media is playing and how to transition
            backendMsg.window = {
                half: (rendererMsg.whichWindow == 'A' ? 0 : 1),
                fade: rendererMsg.fade || config_settings.fade
            }
            // check if screenshot is needed
            if (mediaRequiringScreenshot && mediaRequiringScreenshot.length > 0 && rendererMsg.URL.startsWith('file:///')) {
                // tell backend to take screenshot
                backendMsg.command = "screenshot";
                // start watching for screenshot to be saved
                saveScreenshot(rendererMsg.whichWindow);
            }
            // send message to backend
            backendSocket.write(JSON.stringify(backendMsg));
        } else if (rendererMsg.saved) {
            console.log(`adding newly saved URL to db: ${rendererMsg.directory}`);
            // parse metadata of new media
            var newMetadata = require(path.join(mediaDir, rendererMsg.directory, 'demo.json'));
            if (newMetadata) {
                // add to database
                parseMediaItemDirectory(rendererMsg.directory, newMetadata, () => {
                    // retrieve from database
                    module.exports.loadMediaItem(rendererMsg.directory, element => {
                        // send media item to client
                        module.exports.eventEmitter.emit('addmediaitem', element);
                    });
                });
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
        console.log('waiting for screenshot from backend');
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

var mediaDir = path.join(__dirname, 'public', 'media');
var config; // device config
var config_settings; // settings
module.exports = {
    // event emitter
    eventEmitter: new EventEmitter(),
    // build local database in memory
    generateDb: function () {
        // read media directory
        fs.readdir(mediaDir, function (err, files) {
            files.forEach( (file, index) => {
                var itemPath = path.join(mediaDir, file);
                fs.stat(itemPath, function (err, stats) {
                    if (err) console.log("err: " + err);
                    // check if subpath is a directory
                    if (stats.isDirectory()) {
                        // check folder is not hidden (unless media directory is unpopulated)
                        if (itemPath.includes('/.') == false || files.length == 1) {
                            // load media metadata
                            var meta = require(path.join(itemPath, 'demo.json'));
                            if (meta) {
                                // add to database
                                parseMediaItemDirectory(file, meta);
                            }
                        }
                    }
                });
                // start autoplay on last item
                if (index == files.length - 1) {
                    setTimeout(module.exports.startAutoplay, 500, config_settings.startupPlaylist);
                }
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
        // get settings JSON
        var settingsPath = path.join(__dirname, 'public', 'settings.json');
        try {
            config_settings = require(settingsPath);
        } catch (ex) {
            console.log("Error getting settings.json: " + ex);
            var pathToDefaultSettings = path.join(__dirname, 'public', '.default_settings.json');
            fs.copyFile(pathToDefaultSettings, settingsPath, (err) => {
                if (err) console.log(err)
                else {
                    console.log("Copied default settings to " + settingsPath);
                    config_settings = require(settingsPath);
                }
            });
        }
    },
    nowPlaying: function (callback) {
        // reformat key parts of playback status object
        var _status = {
            playing: playback.playing,
            playingFadeIn: playback.playingFadeIn,
            playingAutoNext: playback.playingAutoNext
        };
        // add playback channel
        if (playback.autoplayTimerID)
            _status.channel = playback.channel || 'allmedia';
        // return playback status
        callback(JSON.stringify(_status));
    },
    createMediaFromURL: function (msg) {
        console.log(`creating media from URL: ${msg}`);
        // send media file path to renderer
        rendererSocket.write(JSON.stringify({
            command: 'saveURL',
            URL: msg,
            mediaDir: mediaDir
        }));
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
    deleteMedia: function(msg, callback) {
        // get demo.json TODO: check msg length?
        var metaPath = path.join(mediaDir, msg, 'demo.json');
        var meta = require(metaPath);
        // stop autoplay
        module.exports.stopAutoplay();
        console.log("USER INPUT::deleting media " + meta.demo.title + " from " + meta.directory + ":\n");
        // delete media in database
        var deleteMediaQuery = "DELETE FROM media WHERE directory = ?";
        db.run(deleteMediaQuery, [msg], function (err) {
            if (err) console.log(`error deleting media ${msg.directory}/${msg} from db:`)
            // delete folder in filesystem // TODO: check path for security????
            var deleteCmd = `rm -rf ${path.join(mediaDir, msg)}`;
            console.log(`${deleteCmd}`);
            runCommand(deleteCmd, function (stdout) {
                console.log(`stdout:\n${stdout}`)
                callback();
            });
        });
    },
    createChannel: function (msg, callback) {
        // stop autoplay
        module.exports.stopAutoplay();
        console.log("USER INPUT::creating channel: " + msg);
        var createQuery = "INSERT INTO channels (name) VALUES (?)";
        db.run(createQuery, [msg], callback);
    },
    deleteConnection: function (msg) {
        // stop autoplay
        module.exports.stopAutoplay();
        console.log("USER INPUT::deleting connection: " + msg);
        // delete connection in database
        var sql = "DELETE FROM connections WHERE media_directory = ? AND channel_name = ?";
        db.run(sql, msg, (err) => {
            if (err) console.log(`error updating database: ${err}`);
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
        });
    },
    createConnection: function (msg, callback) {
        // stop autoplay
        module.exports.stopAutoplay();
        console.log("USER INPUT::creating connection: " + msg);
        // create connection in database
        var sql = "INSERT INTO connections (media_directory, channel_name) VALUES (?, ?)";
        db.run(sql, msg, (err) => {
            if (err) console.log(`error updating database: ${err}`);
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
                if (callback) callback();
            });
        });
    },
    playLocalMedia: function (dirAndVersion, thisFadeDuration = config_settings.fade) {
        var filePath = path.join(mediaDir, dirAndVersion.directory);
        if (dirAndVersion.version) {
            console.log(`warning: cannot play old versions of media (DAT is deprecated)`);
        }
        // update playcount in database
        db.run(`UPDATE media SET playcount = playcount + 1 WHERE directory = ?`, [dirAndVersion.directory], (err) => {
            if (err) console.log(`error updating playcount in database: ${err}`);
            // get playcount and check screenshot
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
                // check if screenshot is missing
                if (meta.demo.image && meta.demo.image.length > 0) {
                    // do not take screenshot
                    mediaRequiringScreenshot = null;
                } else {
                    // flag media directory to take screenshot of
                    mediaRequiringScreenshot = dirAndVersion.directory;
                }
            });
        });
        // send media file path to renderer
        rendererSocket.write(JSON.stringify({
            command: 'loadURL',
            path: ('file://' + filePath + "/index.html"),
            fade: thisFadeDuration
        }));
        // update playback status
        playback.playingFadeIn = {
            directory: dirAndVersion.directory,
            startTime: Date.now(),
            fadeDuration: thisFadeDuration
        };
        // add metadata from database to playback status
        db.get(`SELECT title, source FROM media WHERE directory = ?`, [dirAndVersion.directory], (err, itemrow) => {
            if (err) console.log(`playLocalMedia: Error getting media metadata from database for ${dirAndVersion.directory}`);
            playback.playingFadeIn.title = itemrow.title;
            playback.playingFadeIn.source = itemrow.source;
        });
        // update playback status when fade is over
        clearTimeout(playback.transitioningTimerID);
        playback.transitioningTimerID = null;
        playback.transitioningTimerID = setTimeout(function (playingDirectory) {
            //
            playback.playing = {
                directory: playingDirectory
            };
            // add metadata from database to playback status
            db.get(`SELECT title, source FROM media WHERE directory = ?`, [playingDirectory], (err, itemrow) => {
                if (err) console.log(`playLocalMedia end transition: Error getting media metadata from database for ${playingDirectory}`);
                playback.playing.title = itemrow.title;
                playback.playing.source = itemrow.source;
            });
            //
            playback.playingFadeIn = false;
            // send playbackstatus changed update to client
            module.exports.eventEmitter.emit('playbackstatus');
        }, thisFadeDuration, dirAndVersion.directory);

        // send playbackstatus changed update to client
        module.exports.eventEmitter.emit('playbackstatus');
        
        // // send blur amt to backend
        // // select media item
        // var selectQuery = "SELECT blur_amt FROM media WHERE directory = ?";
        // db.get(selectQuery, [dirAndVersion.directory], (err, itemrow) => {
        //     // send size to app
        //     backendSocket.write(`{"window":{"size":${itemrow.blur_amt}}}`);
        // });
        console.log('USER INPUT::playing local media: ' + filePath + " version: " + (dirAndVersion.version ? dirAndVersion.version : 'latest') + ', fade: ' + thisFadeDuration);
    },
    setBrightness: function (msg) {
        console.log(`set brightness msg: ${JSON.stringify(msg)}`);
        // update local config object
        config_settings.brightness = msg.brightness;
        // update backend
        backendSocket.write(`{"window":{"brightness":${msg.brightness}}}`);
    },
    setBlur: function (msg) {
        //
        console.log(`set blur msg: ${JSON.stringify(msg)}`);
        // update local config object
        config_settings.blur = msg.blur;
        // update backend
        backendSocket.write(`{"window":{"blur":${msg.blur}}}`);
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
    setDesaturation: function (msg) {
        console.log(`set desaturation msg: ${JSON.stringify(msg)}`);
        // update local config object
        config_settings.desaturation = msg.desaturation;
        // update backend
        backendSocket.write(`{"window":{"desaturation":${msg.desaturation}}}`);
    },
    setGamma: function (msg) {
        console.log(`set gamma msg: ${JSON.stringify(msg)}`);
        // update local config object
        config_settings.gamma = msg.gamma;
        // update backend
        backendSocket.write(`{"window":{"gamma":${msg.gamma}}}`);
    },
    setCrossfadeTime: function (msg) {
        console.log(`set crossfade msg: ${JSON.stringify(msg)}`);
        // update local config object
        config_settings.fade = msg.fade;
    },
    stopAutoplay: function () {
        // update playback status
        playback.channel = false;
        playback.playingAutoNext = false;
        // stop autoplay
        clearTimeout(playback.autoplayTimerID);
        playback.autoplayTimerID = null;
        // reset index
        autoplayPos = 0;
    },
    startAutoplay: function (msg) {
        console.log(`USER INPUT::starting autoplay (${(msg && msg.length > 0 ? msg.toString() : 'all')})`);
        // stop autoplay
        module.exports.stopAutoplay();
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
            // update playback status
            playback.channel = msg;
        } else {
            // select all media items
            selectMediaItemsQuery = "SELECT directory FROM media";
            // update playback status
            playback.channel = ""; // empty string == all media
        }
        // get list of media to autoplay
        db.all(selectMediaItemsQuery, queryParams, (error, rows) => {
            if (error) console.log(`error getting all media: ${error}`);
            console.log(`${rows.length} items in autoplay list`);
            // add directories to autoplay list
            rows.forEach(function (row) {
                autoplayList.push(row.directory);
            });
            // start autoplay
            playback.autoplayTimerID = setTimeout(autoplayNext, 0);
        });
    },
    setAutoplayTimeRange: function (msg) {
        console.log(`USER INPUT::setting autoplay time range: ${JSON.stringify(msg)}`);
        // update local config object
        if (msg.autoplayMinRange) {
            config_settings.autoplayDuration.min = msg.autoplayMinRange;
        }
        if (msg.autoplayMaxRange) {
            config_settings.autoplayDuration.max = msg.autoplayMaxRange;
        }
    },
    playRemoteMedia: function (name, thisFadeDuration = 1000) {
        // TODO: check if URL is valid?
        // send media file path to renderer
        rendererSocket.write(JSON.stringify({
            command: 'loadURL',
            path: name,
            fade: thisFadeDuration
        }));
        // do not take screenshot
        mediaRequiringScreenshot = null;
        // update playback status
        playback.playingFadeIn = {
            directory: name,
            startTime: Date.now(),
            fadeDuration: thisFadeDuration,
            title: `<Live URL>`,
            source: name
        };
        // update playback status when fade is over
        clearTimeout(playback.transitioningTimerID);
        playback.transitioningTimerID = null;
        playback.transitioningTimerID = setTimeout(function (playingURL) {
            //
            playback.playing = {
                directory: playingURL,
                title: `<Live URL>`,
                source: playingURL
            };
            // clear fading in
            playback.playingFadeIn = false;
            // send playbackstatus changed update to client
            module.exports.eventEmitter.emit('playbackstatus');
        }, thisFadeDuration, name);
        // send playbackstatus changed update to client
        module.exports.eventEmitter.emit('playbackstatus');
        console.log('USER INPUT::playing remote media: ' + name);
    },
    loadMediaFeed: function (params, callback) {
        // get media items from db with list of channels
        var mediaQuery = `SELECT media.title, media.directory, media.source, media.image, media.modified, media.playcount, json_group_array(connections.channel_name) AS channels
        FROM connections INNER JOIN media ON media.directory = connections.media_directory GROUP BY media.directory`;
        db.all(mediaQuery, (err, dbreturn) => {
            if (err) console.log(`err: ${err}`);
            // parse list of channels to json array from string
            for(var i = 0; i < dbreturn.length; i++) {
                dbreturn[i].channels = JSON.parse(dbreturn[i].channels);
                if (i == dbreturn.length - 1) {
                    callback(dbreturn);
                }
            }
        });
    },
    loadMediaItem: function (directory, callback) {
        // get single media item and list of channels from db
        var mediaQuery = `SELECT media.title, media.directory, media.source, media.image, media.modified, media.playcount, json_group_array(connections.channel_name) AS channels
        FROM connections INNER JOIN media ON media.directory = connections.media_directory WHERE media.directory = ?`;
        db.get(mediaQuery, [directory], (err, dbreturn) => {
            if (err) console.log(`err: ${err}`);
            // parse list of channels to json array from string
            dbreturn.channels = JSON.parse(dbreturn.channels);
            callback(dbreturn);
        });
    },
    loadChannelList: function (params, callback) {
        db.all(`SELECT channel_name, count(media_directory) AS count FROM connections GROUP BY channel_name`, (err, info) => {
            if (err) console.log(`err: ${err}`);
            db.get('SELECT count(*) AS count FROM media', (err, countall) => {
                if (err) console.log(`err: ${err}`);
                info = [countall, ...info];
                callback(info);
            });
        })
    },
    loadConfiguration: function (callback) {
        callback(config);
    },
    loadSettings: function (callback) {
        callback(config_settings);
    },
    uploadConfig: function (msg, callback) {
        console.log("USER INPUT::uploading output configuration");
        config = msg;
        callback();
    },
    saveConfig: function () {
        // save settings
        var settingsPath = path.join(__dirname, 'public', 'settings.json');
        console.log("USER INPUT::saving settings to " + settingsPath);
        fs.writeFile(settingsPath, JSON.stringify(config_settings, null, 4), function (err) {
            if (err) console.log(err);
        });
        // save output
        var configPath = path.join(__dirname, 'public', 'config.json');
        console.log("USER INPUT::saving output config to " + configPath);
        fs.writeFile(configPath, JSON.stringify(config, null, 4), function (err) {
            if (err) console.log(err);
        });
    },
    playNext: function () {
        console.log("USER INPUT::playing next");
        if (playback.autoplayTimerID) {
            // update playback status
            playback.playing = playback.playingFadeIn || playback.playingAutoNext;
            // autoplay early by restarting timeout
            clearTimeout(playback.autoplayTimerID);
            playback.autoplayTimerID = setTimeout(autoplayNext, 0, 1000); // override fade duration to be 1000 (ms)
        } else
            console.log(`error skipping to next media: autoplay is off`);
    },
    fakeMouseInput: function () {
        console.log("USER INPUT::send renderer gesture input");
        rendererSocket.write(JSON.stringify({
            command: 'fakeInput'
        }));
    },
    setStartupPlaylist: function (msg) {
        console.log(`USER INPUT::set startup playlist to ${msg}`);
        config_settings.startupPlaylist = msg;
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

function parseMediaItemDirectory(directory, meta, callback) {
    // add metadata to media table in database
    var insertQuery = "INSERT INTO media (directory, title, source, description, modified) VALUES (?, ?, ?, ?, ?)";
    db.run(insertQuery, [directory, meta.demo.title, meta.demo.source || 'about:none', meta.demo.description, meta.demo.modified], function () {
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

var autoplayList = []; // list of items to autoplay
var autoplayPos = 0; // index in autoplay list

function autoplayNext(thisFadeDuration = config_settings.fade) {
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
        }, thisFadeDuration);
        // choose random timespan in min-max range to wait before playing next
        var delayTime = Math.random() * Math.abs(config_settings.autoplayDuration.max - config_settings.autoplayDuration.min);
        delayTime += Math.min(config_settings.autoplayDuration.max, config_settings.autoplayDuration.min); // add min of range
        // increment autoplay position
        autoplayPos = (autoplayPos + 1) % autoplayList.length;
        // update playback status
        playback.playingAutoNext = {
            directory: autoplayList[autoplayPos],
            startTime: Date.now() + config_settings.fade + delayTime,
            fadeDuration: config_settings.fade
        }
        // get metadata for next media from database
        var selectQuery = `SELECT title, source FROM media WHERE directory = ?`;
        db.get(selectQuery, [autoplayList[autoplayPos]], (err, itemrow) => {
            if (err) console.log(`Error getting media metadata from database for ${autoplayList[autoplayPos]}`);
            // store media metadata in playback object
            playback.playingAutoNext.title = itemrow.title;
            playback.playingAutoNext.source = itemrow.source;
            // send playbackstatus changed update to client
            module.exports.eventEmitter.emit('playbackstatus');
        });
        // start timer to autoplay next
        playback.autoplayTimerID = setTimeout(autoplayNext, config_settings.fade + delayTime);
    } else {
        // error autoplaying
        console.log(`error autoplaying - list is empty`);
    }
}

    // updateConfig: function (msg) {
    //     console.log("USER INPUT::updating output configuration");
    //     // update window
    //     if (msg.window) {
    //         config.window = Object.assign(config.window, msg.window);
    //     }
    //     // update output
    //     if (msg.outputs) {
    //         // find correct output
    //         msg.outputs.forEach(function (msgoutput) {
    //             var output = config.outputs.find(x => x.index === msgoutput.index); // DEPRECATED led.index property
    //             // update output properties
    //             if (msgoutput.properties) {
    //                 output.properties = Object.assign(output.properties, msgoutput.properties);
    //             }
    //             // update output leds
    //             if (msgoutput.leds) {
    //                 // find correct led
    //                 msgoutput.leds.forEach(function (msgled) {
    //                     var led = output.leds.find(x => x.index === msgled.index); // DEPRECATED led.index property
    //                     // update led properties
    //                     led = Object.assign(led, msgled);
    //                 });
    //             }
    //         });
    //     }
    // },

    // reloadPage: function () {
    //     if (playback.currentURL) {
    //         if (playback.currentURL.includes('file:///')) {
    //             // get directory name
    //             var splitURL = playback.currentURL.split('/');
    //             var directoryname = splitURL[splitURL.length - (splitURL[splitURL.length - 1].includes('.') ? 2 : 1)];
    //             // send message to play local media
    //             module.exports.playLocalMedia({
    //                 directory: directoryname
    //             });
    //         } else {
    //             // send full URL to play remote media
    //             module.exports.playRemoteMedia(playback.currentURL);
    //         }
    //         mediaRequiringScreenshot = null;
    //     }
    // },
    // createMedia: function (channelName, callback) {
    //     // stop autoplay
    //     module.exports.stopAutoplay();
    //     // path of new media
    //     var randomName = "item_" + Math.random().toString(36).substring(2, 8);
    //     var newDirectory = path.join(mediaDir, randomName);
    //     console.log("USER INPUT::creating media: " + newDirectory);
    //     // make directory
    //     fs.mkdir(newDirectory, function (err) {
    //         if (err) console.log(err)
    //         else {
    //             var pathToDefault = path.join(mediaDir, '.default');
    //             // get default metadata
    //             var meta = require(path.join(pathToDefault, 'demo.json'));
    //             // add channel if unique
    //             if (meta.demo.channels.indexOf(channelName) === -1)
    //                 meta.demo.channels.push(channelName);
    //             // save metadata to disk
    //             fs.writeFile(path.join(newDirectory, 'demo.json'), JSON.stringify(meta, null, 4), function (err) {
    //                 if (err) console.log(err);
    //                 // copy default files
    //                 fs.copyFile(path.join(pathToDefault, 'index.html'), path.join(newDirectory, 'index.html'), (err) => {
    //                     if (err) console.log(err);
    //                     fs.copyFile(path.join(pathToDefault, 'style.css'), path.join(newDirectory, 'style.css'), (err) => {
    //                         if (err) console.log(err);
    //                         fs.copyFile(path.join(pathToDefault, 'sketch.js'), path.join(newDirectory, 'sketch.js'), (err) => {
    //                             if (err) console.log(err);
    //                             fs.copyFile(path.join(pathToDefault, 'thumb.jpg'), path.join(newDirectory, 'thumb.jpg'), (err) => {
    //                                 if (err) console.log(err);
    //                                 // add to database
    //                                 parseMediaItemDirectory(randomName, meta, callback(randomName));
    //                             });
    //                         });
    //                     });
    //                 });
    //             });
    //         }
    //     });
    // },
    // duplicateMedia: function (sourceDir, callback) {
    //     // stop autoplay
    //     module.exports.stopAutoplay();
    //     // get path of media to duplicate
    //     var pathToOriginal = path.join(mediaDir, sourceDir);
    //     // get source metadata
    //     var originalMeta = require(path.join(pathToOriginal, 'demo.json'));
    //     // make directory for new media
    //     var destName = `${originalMeta.demo.title}_copy_${Math.random().toString(36).substring(2, 8)}`;
    //     var destDir = path.join(mediaDir, destName);
    //     console.log("USER INPUT::duplicating media: " + destName);
    //     fs.mkdir(destDir, function (err) {
    //         if (err) console.log(`error creating directory for duplicated media: ${err}`);
    //         // get datetime
    //         var timestamp = new Date().toISOString();
    //         timestamp = timestamp.substring(0, timestamp.lastIndexOf('.')); // trim ms out of datetime string
    //         // create metadata object for new media
    //         var destMeta = {
    //             "demo": {
    //                 "title": `${originalMeta.demo.title} copy`,
    //                 "description": `original description: ${originalMeta.demo.description}`,
    //                 "files": originalMeta.demo.files,
    //                 "channels": originalMeta.demo.channels,
    //                 "playcount": 0,
    //                 "modified": timestamp
    //             }
    //         };
    //         // copy files (function credit: https://stackoverflow.com/a/54818489)
    //         function copyFiles(srcDir, dstDir, files) {
    //             return Promise.all(files.map(f => {
    //                 return copyFilePromise(path.join(srcDir, f), path.join(dstDir, f));
    //             }));
    //         }
    //         copyFiles(pathToOriginal, destDir, destMeta.demo.files).then(() => {
    //             // save metadata
    //             fs.writeFile(path.join(destDir, 'demo.json'), JSON.stringify(destMeta, null, 4), function (err) {
    //                 if (err) console.log(`error saving metadata for duplicated media: ${err}`);
    //                 // add to database
    //                 parseMediaItemDirectory(destName, destMeta, callback(destName));
    //             });
    //         }).catch(err => {
    //             console.log(`error copying files to duplicate media: ${err}`);
    //         });
    //     });
    // },

    // createFile: function (msg, callback) {
    //     // stop autoplay
    //     module.exports.stopAutoplay();
    //     //
    //     var filepath = path.join(mediaDir, msg, 'new_file.txt');
    //     console.log("USER INPUT::creating file " + filepath);
    //     // create file on disk
    //     fs.writeFile(filepath, "", function (err) {
    //         if (err) console.log(err);
    //         // add file to JSON
    //         var metaPath = path.join(mediaDir, msg, 'demo.json');
    //         var meta = require(metaPath);
    //         meta.demo.files.push('new_file.txt');
    //         fs.writeFile(metaPath, JSON.stringify(meta, null, 4), function (err) {
    //             if (err) console.log(err);
    //             // add file to database
    //             var addFileQuery = "INSERT INTO files (media_directory, filename, data) VALUES (?, ?, ?)";
    //             db.run(addFileQuery, [msg, 'new_file.txt', ""], function () {
    //                 callback();
    //             });
    //         });
    //     });
    // },
    // renameFile: function (msg, callback) {
    //     // stop autoplay
    //     module.exports.stopAutoplay();
    //     // get path of file on disk
    //     var oldPath = path.join(mediaDir, msg.directory, msg.oldName);
    //     var newPath = path.join(mediaDir, msg.directory, msg.newName);
    //     console.log("USER INPUT::renaming file " + msg.oldName + " - " + newPath);
    //     // rename file on disk
    //     fs.rename(oldPath, newPath, function (err) {
    //         if (err) console.log(err);
    //         // update JSON
    //         var metaPath = path.join(mediaDir, msg.directory, 'demo.json');
    //         var meta = require(metaPath);
    //         var index = meta.demo.files.indexOf(msg.oldName); // get index of channel in array
    //         if (index > -1) {
    //             // delete if exists
    //             meta.demo.files[index] = msg.newName;
    //         }
    //         fs.writeFile(metaPath, JSON.stringify(meta, null, 4), function (err) {
    //             if (err) console.log(err);
    //             // update name in database
    //             var updateQuery = "UPDATE files SET filename = ? WHERE rowid = ?";
    //             db.run(updateQuery, [msg.newName, msg.fileID], function () {
    //                 callback();
    //             });
    //         });
    //     });
    // },
    // updateFile: function (msg) {
    //     // stop autoplay
    //     module.exports.stopAutoplay();
    //     // update file in database
    //     var updateQuery = "UPDATE files SET data = ? WHERE rowid = ?";
    //     db.run(updateQuery, [msg.text, msg.fileID]);
    //     // get path of file on disk
    //     var filepath = path.join(mediaDir, msg.directory, msg.filename);
    //     console.log("USER INPUT::updating file " + filepath);
    //     // update file on disk
    //     fs.writeFile(filepath, msg.text, function (err) {
    //         if (err) console.log(err);
    //         // refresh display
    //         module.exports.playLocalMedia({
    //             directory: msg.directory
    //         });
    //     });
    // },
    // removeFile: function (msg, callback) {
    //     // stop autoplay
    //     module.exports.stopAutoplay();
    //     // remove file in database
    //     var removeQuery = "DELETE FROM files WHERE rowid = ?";
    //     db.run(removeQuery, [msg.fileID]);
    //     // get path of file on disk
    //     var filepath = path.join(mediaDir, msg.directory, msg.filename);
    //     console.log("USER INPUT::removing file " + filepath);
    //     // remove file on disk
    //     fs.unlink(filepath, function (err) {
    //         if (err) console.log(err);
    //         // update demo.json
    //         var metaPath = path.join(mediaDir, msg.directory, 'demo.json');
    //         var meta = require(metaPath);
    //         var index = meta.demo.files.indexOf(msg.filename); // get index of channel in array
    //         if (index > -1) {
    //             // delete if exists
    //             meta.demo.files.splice(index, 1);
    //         }
    //         // save json to disk
    //         fs.writeFile(metaPath, JSON.stringify(meta, null, 4), function (err) {
    //             if (err) console.log(err);
    //             if (rendererSocket.connected) {
    //                 // send file path to renderer to refresh display
    //                 var updatedDir = 'file://' + path.join(mediaDir, msg.directory);
    //                 rendererSocket.write(JSON.stringify({
    //                     command: 'loadURL',
    //                     path: updatedDir
    //                 }));
    //                 console.log('refreshing ' + updatedDir);
    //             }
    //             callback();
    //         });
    //     });
    // },
    // saveVersion: function (msg) {
    //     console.log(`warning: not saving version (DAT is deprecated)`);
    //     // get datetime
    //     var timestamp = new Date().toISOString();
    //     timestamp = timestamp.substring(0, timestamp.lastIndexOf('.')); // trim ms out of datetime string
    //     // update in database
    //     var updateModifiedQuery = "UPDATE media SET modified = ? WHERE directory = ?";
    //     db.run(updateModifiedQuery, [timestamp, msg]);
    //     // update datetime in JSON
    //     var metaPath = path.join(mediaDir, msg, 'demo.json');
    //     var meta = require(metaPath);
    //     meta.demo = Object.assign(meta.demo, {
    //         modified: timestamp
    //     });
    //     fs.writeFile(metaPath, JSON.stringify(meta, null, 4), function (err) {
    //         if (err) console.log(err);
    //     });
    //     console.log(`USER INPUT::Saved ${msg} at ${timestamp}`);
    // },
