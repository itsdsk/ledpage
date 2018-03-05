const ipc = require('node-ipc');

ipc.config.id = 'a-unique-process-name2';
ipc.config.retry = 1500;
ipc.config.silent = true;
ipc.connectTo('dplayer-ipc', () => {
  ipc.of['jest-observer'].on('connect', () => {
    ipc.of['jest-observer'].emit('set-uri', "https://crocus-skull.glitch.me/");
  });
});