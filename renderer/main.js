const electron = require('electron');
const path = require('path');
const net = require('net');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

const {
  app,
  BrowserWindow
} = electron;

// app.disableHardwareAcceleration();
/*
 we initialize our application display as a callback of the electronJS "ready" event
 */
app.on('ready', () => {
  // get screen resolution
  const { width, height } = electron.screen.getPrimaryDisplay().workAreaSize
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
  mainWindowA = new BrowserWindow(windowOpts);
  mainWindowB = new BrowserWindow(windowOpts);
  // move windows next to each other
  mainWindowA.setPosition(0, 0);
  mainWindowB.setPosition((width / 2), 0);
  // log
  console.log(`Window positions: ${JSON.stringify(mainWindowA.getPosition())}, ${JSON.stringify(mainWindowB.getPosition())}`);
  console.log(`Window sizes: ${JSON.stringify(mainWindowA.getContentSize())}, ${JSON.stringify(mainWindowB.getContentSize())}`);
  // behaviour on pageload
  mainWindowA.webContents.on('did-finish-load', () => {
    setTimeout(() => {
      // show newly opened window
      if (mainWindowA.isMinimized()) {
        mainWindowA.restore();
      }
      mainWindowA.show();
      // hide previous window
      mainWindowB.hide();
      mainWindowB.minimize();
      // report loaded to client
      if (client) client.write("loaded");
    }, 300);
  });
  mainWindowB.webContents.on('did-finish-load', () => {
    setTimeout(() => {
      // show newly opened window
      if (mainWindowB.isMinimized()) {
        mainWindowB.restore();
      }
      mainWindowB.show();
      // hide previous window
      mainWindowA.hide();
      mainWindowA.minimize();
      // report loaded to client
      if (client) client.write("loaded");
    }, 300);
  });

  process.on('uncaughtException', (err) => {
    console.log(err);
  });

  // initial page load
  var initialURL = `file:///${path.join(__dirname, 'index.html')}`;
  mainWindowA.loadURL(initialURL);

  // bool state to say which window to load to
  var flipWindow = false;


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
          // parse buffer to string
          msg = msg.toString();

          console.log('Client:', msg);

          // save client
          client = stream;

          // display recieved URI
          if (flipWindow) {
            mainWindowA.loadURL(msg);
          } else {
            mainWindowB.loadURL(msg);
          }
          // flip window to display on
          flipWindow = !flipWindow;

        });
      })
      .listen(socket)
      .on('connection', function (socket) {
        console.log('Client connected.');
      });
    return server;
  }
});