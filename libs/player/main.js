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
  // window options (electronJS)
  const windowOpts = {
    width: 720,
    height: 720,
    // useContentSize: true,
    // fullscreen: true,
    // enableLargerThanScreen: true,
    show: false,
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
  };
  // create 2 windows
  mainWindowA = new BrowserWindow(windowOpts);
  mainWindowB = new BrowserWindow(windowOpts);

  // behaviour on pageload
  mainWindowA.webContents.on('did-finish-load', () => {
    setTimeout(() => {
      // show newly opened window
      if(mainWindowA.isMinimized()){
        mainWindowA.restore();
      }
      mainWindowA.show();
      // hide previous window
      mainWindowB.hide();
      mainWindowB.minimize();
      ipc.server.broadcast('message', 'test');
    }, 300);
  });
  mainWindowB.webContents.on('did-finish-load', () => {
    setTimeout(() => {
      // show newly opened window
      if(mainWindowB.isMinimized()){
        mainWindowB.restore();
      }
      mainWindowB.show();
      // hide previous window
      mainWindowA.hide();
      mainWindowA.minimize();
      ipc.server.broadcast('message', 'test');
    }, 300);
  });

  process.on('uncaughtException', (err) => {
    console.log(err);
  });

  // initial page load
  var initialURL = `file:///${path.join(__dirname, 'data', 'index.html')}`;
  mainWindowA.loadURL(initialURL);

  // bool state to say which window to load to
  var flipWindow = false;

  // recieve URI to display
  ipc.config.id = 'dplayeripc';
  ipc.config.retry = 1500;
  ipc.serve(
    function () {
      ipc.server.on(
        'message',
        function (data, socket) {
          console.log('electron load URL: ' + data);
          // display recieved URI
          if(flipWindow){
            mainWindowA.loadURL(data);
          }else{
            mainWindowB.loadURL(data);
          }
          // flip window to display on
          flipWindow = !flipWindow;
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