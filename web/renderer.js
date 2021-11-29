const electron = require('electron');
const path = require('path');
const net = require('net');
const fs = require('fs');
const {
  exec
} = require("child_process");
var sockets = require('./sockets.js');

// constants
const screenshotQuality = 50;
const graphicsDriver = false ? 'VC4' : ''; // set to true if using `dtoverlay=vc4-fkms-v3d`
const pixelDoubling = false; // set to true if width appears as double when using `vc4-fkms-v3d`

// disable electron warnings
process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true';

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let windowA = null;
let windowB = null;

const {
  app,
  session,
  BrowserWindow
} = electron;

// enable content to use web bluetooth api
app.commandLine.appendSwitch('enable-experimental-web-platform-features');
app.commandLine.appendSwitch('enable-web-bluetooth', true);

// graphics
if (graphicsDriver != 'VC4') {
  console.log('Disabling hardware acceleration because graphics driver is not VC4 - this can be re-enabled in renderer.js');
  app.disableHardwareAcceleration();
}
app.commandLine.appendSwitch('ignore-gpu-blacklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-native-gpu-memory-buffers'); // makes no difference

let windowDims = {
  width: null,
  height: null
};

class RenderWindow {
  browserWindow;
  side;
  loadMessage;
  client;
  windowSize;
  loadTimeout;
  constructor(windowOpts, side) {
    this.side = side;
    // create browser window
    this.browserWindow = new BrowserWindow(windowOpts);
    // move window
    this.browserWindow.setPosition(side == 'A' ? 0 : windowOpts.width, 0);
    // log
    this.windowSize = this.browserWindow.getContentSize();
    console.log(`${side} size: ${JSON.stringify(this.browserWindow.getContentSize())} position: ${JSON.stringify(this.browserWindow.getPosition())}`);
    // init
    this.loadTimeout = null;
    // add handlers
    this.browserWindow.webContents.on('did-finish-load', this.onLoadFinished.bind(this));
    this.browserWindow.webContents.on('did-fail-load', this.onLoadFailed.bind(this));
    this.browserWindow.webContents.on('did-fail-provisional-load', this.onProvisionalLoadFailed.bind(this));
    this.browserWindow.webContents.on('dom-ready', this.onDomReady.bind(this));
    this.browserWindow.webContents.on('did-stop-loading', this.onStopLoading.bind(this));
    this.browserWindow.webContents.on('console-message', this.onConsoleOutput.bind(this));
    this.browserWindow.webContents.on('select-bluetooth-device', this.onSelectBluetoothDevice.bind(this));
  }
  loadURL(msg, client) {
    this.loadMessage = msg;
    this.client = client;
    console.log(`loadurl ${this.side}: ${JSON.stringify(msg)}`)
    //
    this.browserWindow.loadURL(this.loadMessage.path);
    // reset load timeout
    if (this.loadTimeout != null) {
      clearTimeout(this.loadTimeout);
    }
    // start load timeout to switch screens if media doesnt load in time
    this.loadTimeout = setTimeout(() => {
      console.log(`${this.side}: timed out while loading`);
      // send ipc msg to ui
      this.onLoadFinished();
    }, 10000);
  }
  mouseClick(norm_x = 0.5, norm_y = 0.5) {
    // fake mouse click in location
    var click_x = norm_x * this.windowSize[0];
    var click_y = norm_y * this.windowSize[1];
    if (this.side == 'B') click_x += this.windowSize[0];
    // fake mouse click
    var clickCmd = `xdotool mousemove ${Math.floor(click_x)} ${Math.floor(click_y)} click 1`;
    exec(clickCmd, (error, stdout, stderr) => {
      if (error) {
        console.log(`fake mouse error: ${error.message}`);
        return;
      }
      if (stderr) {
        console.log(`fake mouse stderr: ${stderr}`);
        return;
      }
    });
  }
  // save screenshot aon disk and send update with new filename in callback
  saveScreenshot(client_tmp = null, callback = null) {
    //
    this.browserWindow.capturePage().then(image => {
      if (!image) console.log(`error taking screenshot: image is null`);
      // check screenshot is valid
      if (image.isEmpty() == false) {
        var new_filename = "";
        if (this.loadMessage.directory && this.loadMessage.directory.length) {
          var d = new Date();
          new_filename = `screenshot_${d.getDate()}${d.getMonth()}${d.getFullYear()}_${d.getHours()}${d.getMinutes()}-${d.getSeconds()}.jpg`;
        } else {
          new_filename = `screenshot_tmp.jpg`;
        }
        // add screenshot to media list
        if (!this.loadMessage.screenshots)
          this.loadMessage.screenshots = [];
        this.loadMessage.screenshots.push(new_filename);
        // choose file name to save screenshot
        var confObj = {
          savedScreenshot: true,
          filename: new_filename,
          whichWindow: this.side,
          screenshots: this.loadMessage.screenshots
        };
        // choose location to save screenshot
        var savePath;
        if (this.loadMessage.directory && this.loadMessage.directory.length) {
          // save under local directory
          confObj.directory = this.loadMessage.directory;
          console.log(`save screenshot in local folder`);
          savePath = path.join(__dirname, '../', 'public', 'media', this.loadMessage.directory, confObj.filename);
        } else {
          console.log(`saving screenshot in public`);
          savePath = path.join(__dirname, '../', 'public', confObj.filename);
        }
        console.log(`full path: ${savePath}`);
        fs.writeFile(savePath, image.toJPEG(screenshotQuality), (err) => {
          if (err) console.log(`error capturing page: ${err}`);
          // report loaded to client
          console.log(`saved screenshot:\n${JSON.stringify(confObj, null, 2)}`);
          if (client_tmp) {
            client_tmp.write(JSON.stringify(confObj));
          };
          // callback
          if (callback) {
            callback(confObj);
          }
        });
      } else {
        // image is empty
      }
    });
  }
  // behaviour on pageload
  async onLoadFinished() {
    // hide p5.js Editor header
    if (this.browserWindow.webContents.getURL().includes('editor.p5js.org')) {
      this.browserWindow.webContents.insertCSS('nav.nav.preview-nav {display: none !important;}', {
        cssOrigin: 'user'
      }).then(result => {
        // console.log(`Added CSS to hide p5.js Editor header`);
      }).catch(error => {
        console.log(`Error hiding p5.js Editor header: ${error}`);
      });
    }
    // stop timer to call this automatically
    if (this.loadTimeout != null) {
      clearTimeout(this.loadTimeout);
    }
    setTimeout(() => {
      // show newly opened window
      if (this.browserWindow.isMinimized()) {
        this.browserWindow.restore();
      }
      this.browserWindow.show();
      this.browserWindow.focus();
      // TODO: reset automouseclick timer
      // report loaded to client
      if (this.client) {
        // check if media has screenshot
        var has_screenshot = (this.loadMessage.screenshots && this.loadMessage.screenshots.length > 0) ? true : false;
        // if playing remote media without screenshot
        if (!this.loadMessage.directory && !has_screenshot) {
          this.saveScreenshot(null, new_screenshot => {
            // report loaded to client with saved screenshot
            this.client.write(JSON.stringify({
              loaded: true,
              whichWindow: this.side,
              URL: this.browserWindow.webContents.getURL(),
              fade: this.loadMessage.fade,
              screenshots: [new_screenshot.filename],
              directory: this.loadMessage.directory
            }));
            // do not repeat, avoid resending when URL changes i.e. due to mouse click on hyperlink in page
            this.client = null;
          });
        } else if (this.loadMessage.directory && !has_screenshot) {
          // playing local media without screenshot
          this.saveScreenshot(this.client, new_screenshot => {
            setTimeout(() => {
              // report loaded to client with saved screenshot
              this.client.write(JSON.stringify({
                loaded: true,
                whichWindow: this.side,
                URL: this.browserWindow.webContents.getURL(),
                fade: this.loadMessage.fade,
                screenshots: [new_screenshot.filename],
                directory: this.loadMessage.directory
              }));
              // do not repeat, avoid resending when URL changes i.e. due to mouse click on hyperlink in page
              this.client = null;
            }, 400); // pause to avoid message clash
          });
        } else {
          // report loaded to client
          this.client.write(JSON.stringify({
            loaded: true,
            whichWindow: this.side,
            URL: this.browserWindow.webContents.getURL(),
            fade: this.loadMessage.fade,
            screenshots: this.loadMessage.screenshots,
            directory: this.loadMessage.directory
          }));
          // do not repeat, avoid resending when URL changes i.e. due to mouse click on hyperlink in page
          this.client = null;
        }
      };
    }, 300);
  }
  // behaviour on page load fail
  async onLoadFailed(error) {
    //console.log(`${this.side}: Load failed, ${error}`)
  }
  async onStopLoading() {
    //console.log(`${this.side} stopped loading`);
  }
  async onProvisionalLoadFailed(error) {
    //console.log(`${this.side}: Provisional load failed, ${error}`);
  }
  async onDomReady() {
    //console.log(`${this.side} DOM ready`);
  }
  // bluetooth device request handler
  onSelectBluetoothDevice(event, deviceList, callback) {
    event.preventDefault();
    console.log(`window ${this.side} bluetooth request device list: ${JSON.stringify(deviceList)}`);
    let result = deviceList[0]; // return first device in list
    if (!result) {
      callback('');
    } else {
      callback(result.deviceId);
    }
  }
  // print logs from website if they start with 'DISK' or are errors
  onConsoleOutput(event, level, message, line, sourceId) {
    // check if log is error (levels 0 - 3 correspond with verbose, info, warning, and error)
    if (level == 3) {
      console.log(`${this.side} console error: ${message}`);
    } else if (String(message).startsWith("DISK")) {
      console.log(`${this.side} console: ${message.substring(5)}`)
    }
  }

}

/*
 we initialize our application display as a callback of the electronJS "ready" event
 */
app.on('ready', () => {
  // get screen resolution
  const {
    width,
    height
  } = electron.screen.getPrimaryDisplay().workAreaSize;
  if (pixelDoubling) {
    windowDims.width = Math.floor(width / 4); // get actual width by dividing by 4 - bc vc4-fkms-v3d flag causes width to be 4x larger
  } else {
    windowDims.width = Math.floor(width / 2);
  }
  windowDims.height = height;
  console.log(`Detected display size: ${JSON.stringify({width, height})}`);
  console.log(`Window dimensions: ${JSON.stringify(windowDims)} ${pixelDoubling ? ' (halving width to fix pixel doubling - can be disabled in renderer.js)' : ''}`);
  // window options (electronJS)
  const windowOpts = {
    width: windowDims.width,
    height: windowDims.height,
    // useContentSize: true,
    // fullscreen: true,
    // enableLargerThanScreen: true,
    show: false,
    autoHideMenuBar: true,
    // center: true,
    // useContentSize: true,
    frame: true, // frameless window without chrome graphical interfaces (borders, toolbars etc)
    kiosk: false, // chromium kiosk mode (fullscreen without icons or taskbar)
    backgroundColor: '#000000', // set backgrounnd
    webPreferences: {
      sandbox: false,
      nodeIntegration: false,
      overlayScrollbars: false,
      webSecurity: false // disable same-origin-policy to autoplay file:///
    },
  };
  // create 2 windows
  windowA = new RenderWindow(windowOpts, 'A');
  windowB = new RenderWindow(windowOpts, 'B');

  // log GPU features
  setTimeout(() => {
    console.log(`Electron version: ${process.versions.electron}`);
    console.log(`GPU:\n${JSON.stringify(app.getGPUFeatureStatus(), null, 2)}`);
    // app.getGPUInfo('complete'); // or 'basic'
  }, 3000);

  // grant permission for microphone
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    let allowedPermissions = ["media"];
    if (allowedPermissions.includes(permission)) {
      callback(true); // Approve permission request
    } else {
      // console.error(`Denied permission request for '${permission}'`);
      callback(false); // Deny
    }
  });

  //
  process.on('uncaughtException', (err) => {
    console.log(err);
  });

  // bool state to say which window to load to
  var flipWindow = false;

  // bool state to say whether to save page
  var savePage = false;

  // start IPC server to send screenshots
  var screenshotSocket = new sockets.DomainServer("screenshots");

  // fake mouse click periodically
  var autoClickPeriod = 0;
  var autoClickTimeout;

  function autoMouseClick() {
    // send fake user gesture to trigger event in page
    if (flipWindow) {
      // trigger event
      windowB.mouseClick(Math.random(), Math.random());
      // needed to get BLE auth?
      //windowB.browserWindow.webContents.executeJavaScript('document.dispatchEvent(new Event("click"));', true);
    } else {
      // trigger event
      windowA.mouseClick(Math.random(), Math.random());
      // needed to get BLE auth?
      // windowA.browserWindow.webContents.executeJavaScript('document.dispatchEvent(new Event("click"));', true);
    }
    // check whether repeat click
    if (autoClickPeriod > 0) {
      // wait then repeat click
      autoClickTimeout = setTimeout(autoMouseClick, autoClickPeriod);
    }
  }
  // update period of autoclick and stop/start
  function resetAutoClickPeriod(newAutoClickPeriod) {
    // remove old timeout
    if (autoClickTimeout) {
      clearTimeout(autoClickTimeout);
    }
    // save new autoclickperiod
    autoClickPeriod = newAutoClickPeriod;
    // restart timeout
    if (autoClickPeriod > 0) {
      autoClickTimeout = setTimeout(autoMouseClick, 500);
    }
  }

  // create UNIX socket to receive URLs on
  var client; // keep track of connected client
  const SOCKETFILE = "/tmp/renderer.sock";
  // check for failed cleanup
  require('fs').stat(SOCKETFILE, function (err, stats) {
    if (err) {
      // no leftover socket found... start server
      createServer(SOCKETFILE);
      return;
    }
    // remove leftover socket file then start server
    require('fs').unlink(SOCKETFILE, function (err) {
      if (err) {
        console.log("ERROR REMOVING LEFTOVER SOCKET FILE");
      }
      createServer(SOCKETFILE);
      return;
    });
  });

  function createServer(socket) {
    console.log('Creating server.');
    var server = net.createServer(function (stream) {
        console.log('Connection acknowledged.');
        // send window dimensions to client
        stream.write(JSON.stringify({
          dimensions: windowDims
        }));
        // reguarly take screenshot and send to ui process
        var screenshotViewTimeout;
        var screenshotViewFrequency = 0; // ms
        function screenshotView() {
          // get window currently playing
          var currentWindow = false;
          var loadMsg = false;
          var side = false;
          if (flipWindow) {
            currentWindow = windowB.browserWindow;
            loadMsg = windowB.loadMessage;
            side = windowB.side;
          } else {
            currentWindow = windowA.browserWindow;
            loadMsg = windowA.loadMessage;
            side = windowA.side;
          }
          currentWindow.capturePage().then(image => {
            if (!image) console.log(`error taking screenshot: image is null`);
            // check screenshot is valid
            if (image.isEmpty() == false) {
              // send screenshot
              var screenshotMsg = JSON.stringify({
                status: true,
                screenshot: image.toJPEG(screenshotQuality).toJSON(),
                side: side,
                path: loadMsg.path
              });
              screenshotSocket.write(screenshotMsg, () => {
                // repeat
                screenshotViewTimeout = setTimeout(screenshotView, screenshotViewFrequency);
              });
            } else {
              // image is empty, repeat
              screenshotViewTimeout = setTimeout(screenshotView, screenshotViewFrequency);
            }
          });
        }

        stream.on('error', function (err) {
          console.log(`error in stream: ${err}`);
        });
        stream.on('end', function () {
          console.log('Client disconnected.');
        });

        stream.on('data', function (msg) {
          // parse buffer
          msg = JSON.parse(msg.toString());

          // save client
          client = stream;

          // check type of message received
          if (msg.command == "loadURL") {
            // check save request
            savePage = (msg.save ? true : false);
            // display recieved URI
            if (flipWindow) {
              windowA.loadURL(msg, client);
            } else {
              windowB.loadURL(msg, client);
            }
            // flip window to display on
            flipWindow = !flipWindow;
          } else if (msg.command == "unloadSide") {
            // get right browser window
            var _browserWindow = msg.side == 'A' ? windowA.browserWindow : windowB.browserWindow;
            // load empty webpage
            _browserWindow.loadURL('about:blank');
          } else if (msg.command == "takeScreenshot") {
            // take screenshot
            if (flipWindow) {
              windowB.saveScreenshot(client);
            } else {
              windowA.saveScreenshot(client);
            }
          } else if (msg.command == "automaticScreenshotPeriod") {
            // change frequency of automatic screenshots
            console.log(`changing frequency of automatic screenshots to ${msg.newValue}ms`);
            if (screenshotViewTimeout != null)
              clearTimeout(screenshotViewTimeout);
            // save new frequency (ms)
            screenshotViewFrequency = msg.newValue;
            // restart timer
            if (screenshotViewFrequency > 0)
              screenshotViewTimeout = setTimeout(screenshotView, screenshotViewFrequency);
          } else if (msg.command == "fakeInput") {
            // send fake user gesture to trigger event in page
            console.log(`sending mouse click event ${msg.position[0]},${msg.position[1]} to window ${flipWindow ? 'B' : 'A'}`);
            if (flipWindow) {
              // trigger event
              windowB.mouseClick(msg.position[0], msg.position[1]);
            } else {
              // trigger event
              windowA.mouseClick(msg.position[0], msg.position[1]);
            }
          } else if (msg.command == "saveURL") {
            // get right browser window
            var _browserWindow = false;
            if (windowA.browserWindow.webContents.getURL() == msg.URL) {
              _browserWindow = windowA.browserWindow;
            } else if (windowB.browserWindow.webContents.getURL() == msg.URL) {
              _browserWindow = windowB.browserWindow;
            } else {
              console.log(`error saving url for ${msg.URL} (not matching ${windowA.browserWindow.webContents.getURL()} or ${windowB.browserWindow.webContents.getURL()})`);
            }
            // if requested URL is open
            if (_browserWindow) {
              // make directory
              var randomName = "item_" + Math.random().toString(36).substring(2, 8);
              var newDirectory = path.join(msg.mediaDir, randomName);
              fs.mkdir(newDirectory, function (err) {
                if (err) console.log(`err: ${err}`)
                else {
                  // save page
                  _browserWindow.webContents.savePage(path.join(newDirectory, 'index.html'), 'HTMLComplete').then(() => {
                    //console.log(`saved page successfully`);
                    // save screenshot
                    _browserWindow.capturePage().then(image => {
                      //console.log(`captured page screenshot`);
                      if (!image) console.log(`error capturing page: image is null`);
                      fs.writeFile(path.join(newDirectory, 'thumb.jpg'), image.toJPEG(screenshotQuality), (err) => {
                        if (err) console.log(`error capturing page: ${err}`);
                        //console.log(`saved screenshot`);
                        // get datetime
                        var timestamp = new Date().toISOString();
                        timestamp = timestamp.substring(0, timestamp.lastIndexOf('.')); // trim ms out of datetime string
                        // build metadata object
                        var newMetadata = {
                          "demo": {
                            "title": _browserWindow.webContents.getTitle(),
                            "source": msg.URL,
                            "description": msg.URL,
                            "files": ["index.html"],
                            "channels": [msg.channel],
                            "playcount": 0,
                            "thumbnails": ["thumb.jpg"],
                            "modified": timestamp
                          }
                        }
                        // save metadata
                        fs.writeFile(path.join(newDirectory, 'demo.json'), JSON.stringify(newMetadata, null, 4), function (err) {
                          if (err) console.log(`error saving metadata: ${err}`);
                          console.log(`saved page ${msg.URL} to ${newDirectory}`);
                          // report loaded to client
                          console.log(`sending saved`);
                          if (client) client.write(JSON.stringify({
                            saved: true,
                            directory: randomName
                          }));
                        });
                      });
                    }).catch(err => {
                      console.log(`error capturing page screenshot: ${err}`);
                    });
                  }).catch(err => {
                    console.log(`didnt save page successfully: ${err}`);
                  });
                }
              });
            }
          } else if (msg.command == "setAutoClickPeriod") {
            // set auto click period
            console.log(`setting autoclickperiod to ${msg.newValue}`);
            resetAutoClickPeriod(msg.newValue);
          }
        });
      })
      .listen(socket)
      .on('connection', function (socket) {
        console.log('Client connected.');
      })
      .on('error', function (err) {
        console.log(`server error: ${err}`);
      });
    return server;
  }
});