const electron = require('electron');
const path = require('path');
const ipc = require('node-ipc');

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
  // here we actually configure the behavour of electronJS
  mainWindow = new BrowserWindow({
    width: 720,
    height: 720,
    // center: true,
    // useContentSize: true,
    frame: false, // frameless window without chrome graphical interfaces (borders, toolbars etc)
    kiosk: true, // chromium kiosk mode (fullscreen without icons or taskbar)
    backgroundColor: '#000000', // set backgrounnd
    webPreferences: {
      sandbox: false,
      nodeIntegration: false,
      overlayScrollbars: false,
    },
  });
  mainWindow.webContents.on('did-finish-load', () => {
    setTimeout(() => {
      mainWindow.show();
      ipc.server.broadcast('message', 'test');
    }, 300);
  });

  process.on('uncaughtException', (err) => {
    console.log(err);
  });

  // the big red button, here we go
  var initialURL = `file:///${path.join(__dirname, 'data', 'index.html')}`;
  mainWindow.loadURL(initialURL);

  // recieve URI to display
  ipc.config.id = 'dplayeripc';
  ipc.config.retry = 1500;
  ipc.serve(
    function () {
      ipc.server.on(
        'message',
        function (data, socket) {
          console.log('electron load URL: ' + data);
          mainWindow.loadURL(data); // display recieved URI
        }
      );
      ipc.server.on(
        'socket.disconnected',
        function (socket, destroyedSocketID) {
          //ipc.log('client ' + destroyedSocketID + ' has disconnected!');
        }
      );
    }
  );
  ipc.server.start();
});