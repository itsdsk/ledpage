const electron = require('electron');
const path = require('path');
const net = require('net');
const fs = require('fs');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let windowA = null;
let windowB = null;

const {
  app,
  BrowserWindow
} = electron;

// enable content to use web bluetooth api
app.commandLine.appendSwitch('enable-experimental-web-platform-features');
app.commandLine.appendSwitch('enable-web-bluetooth', true);

class RenderWindow {
  browserWindow;
  side;
  loadMessage;
  client;
  constructor(windowOpts, side) {
    this.side = side;
    // create browser window
    this.browserWindow = new BrowserWindow(windowOpts);
    // move window
    this.browserWindow.setPosition(side == 'A' ? 0 : windowOpts.width, 0);
    // log
    console.log(`${side} size: ${JSON.stringify(this.browserWindow.getContentSize())} position: ${JSON.stringify(this.browserWindow.getPosition())}`);
    // add handlers
    this.browserWindow.webContents.on('did-finish-load', this.onLoadFinished.bind(this));
    this.browserWindow.webContents.on('console-message', this.onConsoleOutput.bind(this));
    this.browserWindow.webContents.on('select-bluetooth-device', this.onSelectBluetoothDevice.bind(this));
  }
  loadURL(msg, client) {
    this.loadMessage = msg;
    this.client = client;
    console.log(`loadurl ${this.side}: ${JSON.stringify(msg)}`)
    //
    this.browserWindow.loadURL(this.loadMessage.path);
  }
  // behaviour on pageload
  async onLoadFinished() {
    setTimeout(() => {
      // show newly opened window
      if (this.browserWindow.isMinimized()) {
        this.browserWindow.restore();
      }
      this.browserWindow.show();
      this.browserWindow.focus();
      // report loaded to client
      if (this.client) this.client.write(JSON.stringify({
        loaded: true,
        whichWindow: this.side,
        URL: this.browserWindow.webContents.getURL(),
        fade: this.loadMessage.fade
      }));
    }, 300);
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
  // log windows
  onConsoleOutput(event, level, message, line, sourceId) {
    console.log(`${this.side} console: ${message}`);
  }

}

// app.disableHardwareAcceleration();
/*
 we initialize our application display as a callback of the electronJS "ready" event
 */
app.on('ready', () => {
  // get screen resolution
  const {
    width,
    height
  } = electron.screen.getPrimaryDisplay().workAreaSize
  console.log(`Detected screen size: ${JSON.stringify({ width, height })}`);
  // window options (electronJS)
  const windowOpts = {
    width: (width / 2),
    height: height,
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
    },
  };
  // create 2 windows
  windowA = new RenderWindow(windowOpts, 'A');
  windowB = new RenderWindow(windowOpts, 'B');
  //
  process.on('uncaughtException', (err) => {
    console.log(err);
  });

  // initial page load
  var initialURL = `index.html`;
  //mainWindowA.loadFile(initialURL);

  // bool state to say which window to load to
  var flipWindow = false;

  // bool state to say whether to save page
  var savePage = false;

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

        stream.on('end', function () {
          console.log('Client disconnected.');
        });

        stream.on('data', function (msg) {
          // parse buffer
          msg = JSON.parse(msg.toString());

          console.log('Client:', JSON.stringify(msg));

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
          } else if (msg.command == "fakeInput") {
            // send fake user gesture to trigger event in page
            console.log(`sending mouse click event to window ${flipWindow ? 'B' : 'A'}`);
            if (flipWindow) {
              // hide previous window
              windowA.browserWindow.hide();
              windowA.browserWindow.minimize();
              // trigger event
              windowB.browserWindow.webContents.executeJavaScript('document.dispatchEvent(new Event("click"));', true);
            } else {
              // hide previous window
              windowB.browserWindow.hide();
              windowB.browserWindow.minimize();
              // trigger event
              windowA.browserWindow.webContents.executeJavaScript('document.dispatchEvent(new Event("click"));', true);
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
                      fs.writeFile(path.join(newDirectory, 'thumb.jpg'), image.toJPEG(80), (err) => {
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
                            "channels": ["firstchannel"],
                            "playcount": 0,
                            "image": "thumb.jpg",
                            "modified": timestamp
                          }
                        }
                        // save metadata
                        fs.writeFile(path.join(newDirectory, 'demo.json'), JSON.stringify(newMetadata, null, 4), function (err) {
                          if (err) console.log(`error saving metadata: ${err}`);
                          console.log(`saved page ${msg.URL} to ${newDirectory}`);
                          // report loaded to client
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
          }
        });
      })
      .listen(socket)
      .on('connection', function (socket) {
        console.log('Client connected.');
      });
    return server;
  }
});