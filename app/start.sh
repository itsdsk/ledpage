#!/bin/bash

# start webserver/led layout
pm2 start /usr/src/app/core/dsetup/d3server.js

# start webserver/cms
pm2 start /usr/src/app/core/dremote/keystone.js

# start sharing component
pm2 start /usr/src/app/core/dsharing/app.js

# start electron
umount /dev/shm && mount -t tmpfs shm /dev/shm
rm /tmp/.X0-lock &>/dev/null || true
startx /usr/src/app/core/dplayer/node_modules/electron/dist/electron /usr/src/app/core/dplayer --enable-logging
