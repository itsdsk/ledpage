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
        blur_amt INT DEFAULT 50, modified TEXT,
        source TEXT, playcount INT DEFAULT 0
    )`);
    db.run(`CREATE TABLE channels (
        name TEXT PRIMARY KEY
    )`);
    // create tables for relational types (thumbnails, files and connections)
    db.run(`CREATE TABLE thumbnails (
        media_directory TEXT NOT NULL, filename TEXT NOT NULL,
        FOREIGN KEY(media_directory) REFERENCES media(directory),
        UNIQUE(media_directory, filename)
    )`);
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
var screenshotPath = path.join(__dirname, '../', 'public', 'screenshot.ppm');

//
var backendSocket = new sockets.DomainClient("backend");
backendSocket.event.on('data', function (data) {
    console.log("backend socket got data in media: " + data.toString());
});

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
// current screenshot from renderer
var rendererScreenshotBuffer = false;
// timer to tell renderer to unload old window when faded out
var unloadBrowserWindowTimerID = false;
// IPC definition, data events
var rendererSocket = new sockets.DomainClient("renderer");
rendererSocket.event.on('connect', function () {
    // update renderer with autoclickperiod
    if (config_settings) {
        // set autoclickperiod
        if (config_settings.autoClickPeriod) {
            rendererSocket.write(JSON.stringify({
                command: 'setAutoClickPeriod',
                newValue: config_settings.autoClickPeriod
            }));
        }
        // start autoplay
        setTimeout(module.exports.startAutoplay, 500, config_settings.startupPlaylist);
    } else {
        console.log('error no config settings yet')
    }
});
rendererSocket.event.on('data', function (data) {
    var dataAsString = data.toString();
    if (dataAsString === '__disconnect') {
        cleanup();
    } else {
        var rendererMsg;
        try {
            rendererMsg = JSON.parse(dataAsString);
        } catch (e) {
            console.log(`error parsing json from renderer: ${e}\n${dataAsString}`);
            return;
        }
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
                console.log(`skipping legacy screenshot mode`);
                // tell backend to take screenshot
                // backendMsg.command = "screenshot";
                // start watching for screenshot to be saved
                // saveScreenshot(rendererMsg.whichWindow); // legacy screenshot function?
            }
            // send message to backend
            backendSocket.write(JSON.stringify(backendMsg));
            // tell renderer to close old window when fade is done
            clearTimeout(unloadBrowserWindowTimerID);
            unloadBrowserWindowTimerID = null;
            unloadBrowserWindowTimerID = setTimeout((windowSide) => {
                // send msg to renderer to unload window side
                rendererSocket.write(JSON.stringify({
                    command: 'unloadSide',
                    side: windowSide == 'A' ? 'B' : 'A'
                }));
            }, rendererMsg.fade + 250, rendererMsg.whichWindow);
            // send update to clients
            module.exports.eventEmitter.emit('switchingsides', JSON.stringify({
                targetSide: rendererMsg.whichWindow,
                fadeDuration: rendererMsg.fade
            }));
            // send screenshot to web ui clients
            var screenshotMsgForApp = {
                side: rendererMsg.whichWindow,
                screenshots: rendererMsg.screenshots,
                directory: rendererMsg.directory
            };
            module.exports.eventEmitter.emit('screenshot', JSON.stringify(screenshotMsgForApp));
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
                        // play media
                        module.exports.playLocalMedia({
                            directory: rendererMsg.directory
                        }, 1000);
                    });
                });
            }
        } else if (rendererMsg.savedScreenshot) {
            console.log(`renderer saved screenshot ${JSON.stringify(rendererMsg, null, 2)}`);
            // check if website is in library
            if (rendererMsg.directory && rendererMsg.directory.length > 0) {
                // update media db and json
                // update client
                console.log("USER INPUT::adding screenshot");
                // create connection in database
                var sql = "INSERT INTO thumbnails (media_directory, filename) VALUES (?, ?)";
                db.run(sql, [rendererMsg.directory, rendererMsg.filename], (err) => {
                    if (err) console.log(`error updating database: ${err}`);
                    // get path and load json
                    var metaPath = path.join(mediaDir, rendererMsg.directory, 'demo.json');
                    var meta = require(metaPath);
                    // check for thumbnails array in metadata
                    if (meta.demo.thumbnails) {
                        // check screenshot is not already saved
                        var index = meta.demo.thumbnails.indexOf(rendererMsg.filename);
                        if (index == -1) {
                            // add screenshot
                            meta.demo.thumbnails.push(rendererMsg.filename);
                        }
                    } else {
                        // create array of thumbnails in metadata and add first screenshot
                        meta.demo.thumbnails = [rendererMsg.filename];
                    }
                    // send screenshot to web ui clients
                    var screenshotMsgForApp = {
                        side: rendererMsg.whichWindow,
                        screenshots: rendererMsg.screenshots,
                        directory: rendererMsg.directory
                    };
                    console.log(`sending screenshot msg:\n${JSON.stringify(screenshotMsgForApp)}`);
                    module.exports.eventEmitter.emit('screenshot', JSON.stringify(screenshotMsgForApp));
                    // update web ui clients
                    module.exports.eventEmitter.emit('updatemediaitem', rendererMsg.directory);
                    // save json to disk
                    fs.writeFile(metaPath, JSON.stringify(meta, null, 4), function (err) {
                        if (err) console.log(err);
                        console.log(`finished saving media`);
                    });
                });
            } else {
                //
                console.log(`not saving screenshot bc website isnt in library`);
            }
        } else if (rendererMsg.dimensions) {
            windowDims = rendererMsg.dimensions;
        } else if (rendererMsg.status) {
            //
            //console.log(`got renderer status`);
            if (rendererMsg.screenshot) {
                // get jpeg data buffer
                rendererScreenshotBuffer = Buffer.from(rendererMsg.screenshot.data);
                // save screenshot to file
                // fs.writeFile(path.join(__dirname, 'renderer_screenshot.jpg'), rendererScreenshotBuffer, function (err) {
                //     if (err) console.log(`error writing file of screenshot: ${err}`);
                //     console.log(`saved screenshot`);
                // });
            }
        }
    }
});

// current screenshot from renderer
var screenshotBufferA = false;
var screenshotBufferB = false;
// screenshots socket
var screenshotsSocket = new sockets.DomainClient("screenshots");
screenshotsSocket.event.on('data', function (data) {
    var dataAsString = data.toString();
    // console.log("screenshot msg length: " + dataAsString.length);
    if (dataAsString === '__disconnect') {
        cleanup();
    } else {
        // try parsing screenshot msg
        var screenshotMsg;
        try {
            screenshotMsg = JSON.parse(dataAsString);
        } catch (e) {
            console.log(`Error parsing JSON for screenshot (length: ${dataAsString.length}): ${e}`);
            return;
        }
        if (screenshotMsg.screenshot) {
            // check side
            if (screenshotMsg.side == 'A') {
                // get jpeg data buffer
                screenshotBufferA = Buffer.from(screenshotMsg.screenshot.data);
                // send to clients
                var screenshotMsgForApp = {
                    dataURL: `data:image/jpeg;base64,${screenshotBufferA.toString('base64')}`,
                    side: screenshotMsg.side
                };
                module.exports.eventEmitter.emit('screenshot', JSON.stringify(screenshotMsgForApp));
            } else {
                // get jpeg data buffer
                screenshotBufferB = Buffer.from(screenshotMsg.screenshot.data);
                // send to clients
                var screenshotMsgForApp = {
                    dataURL: `data:image/jpeg;base64,${screenshotBufferB.toString('base64')}`,
                    side: screenshotMsg.side
                };
                module.exports.eventEmitter.emit('screenshot', JSON.stringify(screenshotMsgForApp));
            }
            // save screenshot to file
            // fs.writeFile(path.join(__dirname, 'renderer_screenshot.jpg'), rendererScreenshotBuffer, function (err) {
            //     if (err) console.log(`error writing file of screenshot: ${err}`);
            //     console.log(`saved screenshot`);
            // });
            // console.log(`screenshot ${screenshotMsg.side} of ${JSON.stringify(screenshotMsg.path)}`)
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
        if (screenshotsSocket.connected) {
            screenshotsSocket.socket.end();
        }
        process.exit(0);
    }
}
process.on('SIGINT', cleanup);

// legacy screenshot function?
function saveScreenshot(side) {
    // check directory of media
    if (mediaRequiringScreenshot && mediaRequiringScreenshot.length > 0) {
        // watch screenshot file for changes // TODO: make work if file does not exist yet
        const watcher = fs.watch(screenshotPath, (eventType, filename) => {
            // stop watching once file has been changed
            watcher.close();
            // wait 1 second for backend to finish changing file
            setTimeout(function () {
                // get demo.json and add image to it
                var metaPath = path.join(mediaDir, mediaRequiringScreenshot, 'demo.json');
                var meta = require(metaPath);
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

var mediaDir = path.join(__dirname, '../', 'public', 'media');
var config; // device config
var config_settings; // settings
var windowDims; // dimensions of renderer
module.exports = {
    // event emitter
    eventEmitter: new EventEmitter(),
    // build local database in memory
    generateDb: function () {
        // read media directory
        fs.readdir(mediaDir, function (err, files) {
            files.forEach((file, index) => {
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
                // finishing loading library
                if (index == files.length - 1) {
                    // connect to IPC sockets
                    setTimeout(() => {
                        backendSocket.startConnecting();
                        rendererSocket.startConnecting();
                        screenshotsSocket.startConnecting();
                    }, 1000);
                }
            });
        });
        // get config JSON
        var configPath = path.join(__dirname, '../', 'public', 'config.json');
        try {
            config = require(configPath);
        } catch (ex) {
            console.log("Error getting config: " + ex);
            var pathToDefault = path.join(__dirname, '../', 'public', '.default_config.json');
            fs.copyFile(pathToDefault, configPath, (err) => {
                if (err) console.log(err)
                else {
                    console.log("Copied default config to " + configPath);
                    config = require(configPath);
                }
            });
        }
        // get settings JSON
        var settingsPath = path.join(__dirname, '../', 'public', 'settings.json');
        try {
            config_settings = require(settingsPath);
        } catch (ex) {
            console.log("Error getting settings.json: " + ex);
            var pathToDefaultSettings = path.join(__dirname, '../', 'public', '.default_settings.json');
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
            playingAutoNext: playback.playingAutoNext,
            screenshot: `data:image/jpeg;base64,${rendererScreenshotBuffer.toString('base64')}`
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
            mediaDir: mediaDir,
            channel: playback.channel || config_settings.startupPlaylist
        }));
    },
    renameMedia: function (msg, callback) {
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
    deleteMedia: function (msg, callback) {
        // get demo.json TODO: check msg length?
        var metaPath = path.join(mediaDir, msg, 'demo.json');
        var meta = require(metaPath);
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
    deleteConnection: function (msg, callback) {
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
                if (callback) callback();
            });
        });
    },
    createConnection: function (msg, callback) {
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
            // get media info from database
            module.exports.loadMediaItem(dirAndVersion.directory, row => {
                // send play media command to renderer, preferring source URL over local file path (todo: add toggle to prefer local/remote path)
                rendererSocket.write(JSON.stringify({
                    command: 'loadURL',
                    path: row.source != 'about:none' ? row.source : ('file://' + filePath + '/index.html'),
                    fade: thisFadeDuration,
                    screenshots: row.screenshots,
                    directory: dirAndVersion.directory
                }));
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
            playback.playingFadeIn.source = itemrow.source != 'about:none' ? itemrow.source : `/media/${dirAndVersion.directory}/index.html`;
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
                playback.playing.source = itemrow.source != 'about:none' ? itemrow.source : `/media/${playingDirectory}/index.html`;
            });
            //
            playback.playingFadeIn = false;
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
        // round to 3 decimal places
        msg.brightness = Math.round(msg.brightness * 1000) / 1000;
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
    setAutoClickPeriod: function (msg) {
        console.log(`set autoclickperiod msg: ${JSON.stringify(msg)}`);
        // update local config object
        config_settings.autoClickPeriod = msg.autoClickPeriod;
        // update renderer
        rendererSocket.write(JSON.stringify({
            command: 'setAutoClickPeriod',
            newValue: msg.autoClickPeriod
        }));
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
            playback.autoplayTimerID = setTimeout(autoplayNext, 0, 1000);
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
        }, thisFadeDuration, name);
        // send playbackstatus changed update to client
        module.exports.eventEmitter.emit('playbackstatus');
        console.log('USER INPUT::playing remote media: ' + name);
    },
    loadMediaFeed: function (params, callback) {
        // get media items from db with list of channels
        var mediaQuery = `SELECT media.title, media.directory, media.source, media.modified, media.playcount, json_group_array(connections.channel_name) AS channels
        FROM connections INNER JOIN media ON media.directory = connections.media_directory GROUP BY media.directory`;
        // get media items and channels with list of thumbnails
        var mediaQuery2 = `SELECT title, directory, source, modified, playcount, channels, json_group_array(thumbnails.filename) AS screenshots
        FROM (${mediaQuery}) LEFT JOIN thumbnails ON directory = thumbnails.media_directory GROUP BY directory`;
        db.all(mediaQuery2, (err, dbreturn) => {
            if (err) console.log(`err: ${err}`);
            // parse string returned from db to json array
            for (var i = 0; i < dbreturn.length; i++) {
                // add channels
                dbreturn[i].channels = JSON.parse(dbreturn[i].channels);
                // add screenshots
                var screenshot_filenames = JSON.parse(dbreturn[i].screenshots);
                if (screenshot_filenames.length > 0 && screenshot_filenames[0] != null) {
                    dbreturn[i].screenshots = screenshot_filenames;
                } else {
                    dbreturn[i].screenshots = null;
                }
                // return list of media after parsing last item
                if (i == dbreturn.length - 1) {
                    callback(dbreturn);
                }
            }
        });
    },
    loadMediaItem: function (directory, callback) {
        // get item with channels
        var mediaQuery1 = `SELECT media.title, media.directory, media.source, media.modified, media.playcount,
            json_group_array(connections.channel_name) AS channels
            FROM connections INNER JOIN media ON media.directory = connections.media_directory WHERE media.directory = ?`;
        // get item with channels and thumbnails
        var mediaQuery2 = `SELECT title, directory, source, modified, playcount,
            channels, json_group_array(thumbnails.filename) AS screenshots
            FROM (${mediaQuery1}) LEFT JOIN thumbnails ON directory = thumbnails.media_directory WHERE directory = ?`;
        db.get(mediaQuery2, [directory, directory], (err, dbreturn) => {
            if (err) console.log(`err: ${err}`);
            // parse json array from string returned from db
            dbreturn.channels = JSON.parse(dbreturn.channels);
            // add screenshots
            var screenshot_filenames = JSON.parse(dbreturn.screenshots);
            if (screenshot_filenames.length > 0 && screenshot_filenames[0] != null) {
                dbreturn.screenshots = screenshot_filenames;
            } else {
                dbreturn.screenshots = null;
            }
            // return media item
            callback(dbreturn);
        });
    },
    loadChannelList: function (params, callback) {
        // updated to sort channels by size
        db.all(`SELECT channel_name, count(media_directory) AS count FROM connections GROUP BY channel_name ORDER BY count DESC`, (err, info) => {
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
        var settingsPath = path.join(__dirname, '../', 'public', 'settings.json');
        console.log("USER INPUT::saving settings to " + settingsPath);
        fs.writeFile(settingsPath, JSON.stringify(config_settings, null, 4), function (err) {
            if (err) console.log(err);
        });
        // save output
        var configPath = path.join(__dirname, '../', 'public', 'config.json');
        console.log("USER INPUT::saving output config to " + configPath);
        fs.writeFile(configPath, JSON.stringify(config, null, 4), function (err) {
            if (err) console.log(err);
        });
    },
    delayAutoplay: function () {
        // to call when playing specific media instead of stopAutoplay
        if (playback.autoplayTimerID) {
            // update playback status
            var delayTime = (30 * 60) * 1000; // 30 minutes
            playback.playingAutoNext.startTime = Date.now() + config_settings.fade + delayTime;
            // autoplay early by restarting timeout
            clearTimeout(playback.autoplayTimerID);
            playback.autoplayTimerID = null;
            // todo make delay longer
            playback.autoplayTimerID = setTimeout(autoplayNext, config_settings.fade + delayTime);
            // send playbackstatus changed update to client
            //module.exports.eventEmitter.emit('playbackstatus');
        } else {
            // TODO: start autoplaying
        }
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
    takeScreenshot: function () {
        console.log(`USER INPUT::taking screenshot`);
        rendererSocket.write(JSON.stringify({
            command: 'takeScreenshot'
        }));
    },
    windowDimensions: function (callback) {
        callback(JSON.stringify(windowDims));
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
    },
    deleteAllThumbnails: deleteAllThumbnails
};

function parseMediaItemDirectory(directory, meta, callback) {
    // add metadata to media table in database
    var insertQuery = "INSERT INTO media (directory, title, source, description, modified) VALUES (?, ?, ?, ?, ?)";
    db.run(insertQuery, [directory, meta.demo.title, meta.demo.source || 'about:none', meta.demo.description, meta.demo.modified], function () {
        var itemPath = path.join(mediaDir, directory);
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
        // add thumbnails to database
        if (meta.demo.thumbnails) {
            var addThumbnailQuery = "INSERT INTO thumbnails (media_directory, filename) VALUES (?, ?)";
            meta.demo.thumbnails.forEach(filename => {
                db.run(addThumbnailQuery, [directory, filename]);
            });
        }
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

async function autoplayNext(thisFadeDuration = config_settings.fade) {
    // check if screen is on
    while (config_settings.brightness == 0.0) {
        // pause until switched on
        await new Promise(r => setTimeout(r, Math.max(thisFadeDuration / 2, 5000)));
    }
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
        // get next autoplay index
        var nextAutoplayPos = (autoplayPos + 1) % autoplayList.length;
        // choose random timespan in min-max range to wait before playing next
        var delayTime = Math.random() * Math.abs(config_settings.autoplayDuration.max - config_settings.autoplayDuration.min);
        delayTime += Math.min(config_settings.autoplayDuration.max, config_settings.autoplayDuration.min); // add min of range
        // update playback status
        playback.playingAutoNext = {
            directory: autoplayList[nextAutoplayPos],
            startTime: Date.now() + config_settings.fade + delayTime,
            fadeDuration: config_settings.fade
        }
        // get metadata for next media from database
        var selectQuery = `SELECT title, source FROM media WHERE directory = ?`;
        db.get(selectQuery, [autoplayList[nextAutoplayPos]], (err, itemrow) => {
            if (err) console.log(`Error getting media metadata from database for next item on autoplay: ${autoplayList[nextAutoplayPos]}`);
            // store media metadata in playback object
            playback.playingAutoNext.title = itemrow.title;
            playback.playingAutoNext.source = itemrow.source != 'about:none' ? itemrow.source : `/media/${autoplayList[nextAutoplayPos]}/index.html`;
        });
        // play item
        module.exports.playLocalMedia({
            directory: autoplayList[autoplayPos]
        }, thisFadeDuration);
        // increment autoplay position
        autoplayPos = (autoplayPos + 1) % autoplayList.length;
        // start timer to autoplay next
        playback.autoplayTimerID = setTimeout(autoplayNext, config_settings.fade + delayTime);
    } else {
        // error autoplaying
        console.log(`error autoplaying - list is empty`);
    }
}

// helper function to remove all images
function deleteAllThumbnails() {
    // read media directory
    fs.readdir(mediaDir, function (err, files) {
        files.forEach((file, index) => {
            var itemPath = path.join(mediaDir, file);
            fs.stat(itemPath, function (err, stats) {
                if (err) console.log("err: " + err);
                // check if subpath is a directory
                if (stats.isDirectory()) {
                    // check folder is not hidden (unless media directory is unpopulated)
                    if (itemPath.includes('/.') == false || files.length == 1) {
                        // load media metadata
                        var jsonpath = path.join(itemPath, 'demo.json');
                        var meta = require(jsonpath);
                        if (meta) {
                            // check thumbnails
                            if (meta.demo.thumbnails) {
                                console.log(`${file} / ${JSON.stringify(meta.demo.thumbnails)}`)
                                // remove each file
                                var thumbnails_list = meta.demo.thumbnails;
                                thumbnails_list.forEach(filename => {
                                    // remove image on disk
                                    var imagepath = path.join(itemPath, filename);
                                    fs.unlink(imagepath, function (err) {
                                        if (err) console.log(`err deleting img ${imagepath}: ${err}`);
                                        console.log(`removed image ${imagepath}`);
                                    });
                                });
                                // save demo json without thumbnails
                                meta.demo.thumbnails = null;
                                fs.writeFile(jsonpath, JSON.stringify(meta, null, 4), function (err) {
                                    if (err) console.log(`error saving json ${jsonpath}: ${err}`);
                                    console.log(`updated json ${jsonpath}`);
                                })
                            }
                        }
                    }
                }
            });
        });
    });
}