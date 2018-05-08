const electron = require('electron');
const path = require('path');
const url = require('url');
const ipc = require('node-ipc');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

const {
  app,
  BrowserWindow
} = electron;

app.disableHardwareAcceleration();
/*
 we initialize our application display as a callback of the electronJS "ready" event
 */
app.on('ready', () => {
  'use strict';
  // here we actually configure the behavour of electronJS
  const windowA = new BrowserWindow({
    width: 1280,
    height: 720,
    center: true,
    resizable: true,
    show: false,
    useContentSize: true,
    frame: false, // frameless window without chrome graphical interfaces (borders, toolbars etc)
    kiosk: true, // chromium kiosk mode (fullscreen without icons or taskbar)
    backgroundColor: '#000000', // set backgrounnd
    webPreferences: {
      sandbox: false,
      nodeIntegration: false,
      overlayScrollbars: false,
    },
  });
  windowA.webContents.on('did-finish-load', () => {
    setTimeout(() => {
      windowA.show();
      windowB.hide();
    }, 300);
  });

  const windowB = new BrowserWindow({
    width: 1280,
    height: 720,
    center: true,
    resizable: true,
    show: false,
    useContentSize: true,
    frame: false, // frameless window without chrome graphical interfaces (borders, toolbars etc)
    kiosk: true, // chromium kiosk mode (fullscreen without icons or taskbar)
    backgroundColor: '#000000', // set backgrounnd
    webPreferences: {
      sandbox: false,
      nodeIntegration: false,
      overlayScrollbars: false,
    },
  });

  windowB.webContents.on('did-finish-load', () => {
    setTimeout(() => {
      windowB.show();
      windowA.hide();
    }, 300);
  });

  // flipping state to say which window to loadurl to
  var flipWindow = true;

  process.on('uncaughtException', function (err) {
    console.log(err);
  });
  // the big red button, here we go
  var initialURL = `file:///${path.join(__dirname, 'data', 'index.html')}`;
  windowA.loadURL(initialURL);

  // recieve URI to display
  ipc.config.id = 'dplayeripc';
  ipc.config.retry = 1500;
  ipc.serve(
    function () {
      ipc.server.on(
        'message',
        function (data, socket) {
          //ipc.log('got a message : '.debug, data);
          console.log('electron load URL: '+data);
          if(flipWindow){
            windowB.loadURL(data); // display recieved URI
          }else{
            windowA.loadURL(data); // display recieved URI
          }
          flipWindow = !flipWindow;
          //ipc.server.emit(
          //  socket,
          //  'message', //this can be anything you want so long as
          //  //your client knows.
          //  data + ' world!'
          //);
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
  //ipc.serve(() => ipc.server.on('set-uri', message => {
  //  console.log(message);
  //  window.loadURL(message); // display recieved URI
  //}));
  ipc.server.start();
});