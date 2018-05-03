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
  const window = new BrowserWindow({
    width: 720,
    height: 720,
    frame: false, // frameless window without chrome graphical interfaces (borders, toolbars etc)
    kiosk: true, // chromium kiosk mode (fullscreen without icons or taskbar)
    backgroundColor: '#09f911', // set backgrounnd
    webPreferences: {
      sandbox: false,
      nodeIntegration: false,
      overlayScrollbars: false,
    },
  });

  window.webContents.on('did-finish-load', () => {
    setTimeout(() => {
      window.show();
    }, 300);
  });

  process.on('uncaughtException', function (err) {
    console.log(err);
  });
  // the big red button, here we go
  var initialURL = `file:///${path.join(__dirname, 'data', 'index.html')}`;
  window.loadURL(initialURL);

  // recieve URI to display
  ipc.config.id = 'dplayeripc';
  ipc.config.retry = 1500;
  ipc.serve(
    function () {
      ipc.server.on(
        'message',
        function (data, socket) {
          //ipc.log('got a message : '.debug, data);
          //console.log(data);
          window.loadURL(data); // display recieved URI
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