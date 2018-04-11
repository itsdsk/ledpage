#!/bin/bash

# start webserver/led layout
#pm2 start /usr/src/app/core/dsetup/d3server.js --cwd "/usr/src/app/core/dsetup/" --name "dsetup"

# start webserver/cms
pm2 start /usr/src/app/core/dremote/keystone.js --cwd "/usr/src/app/core/dremote/" --name "dremote"

# start sharing component
#pm2 start /usr/src/app/core/dsharing/app.js --cwd "/usr/src/app/core/dsharing/" --name "dsharing"

# start electron
umount /dev/shm && mount -t tmpfs shm /dev/shm
rm /tmp/.X0-lock &>/dev/null || true
startx /usr/src/app/core/dplayer/node_modules/electron/dist/electron /usr/src/app/core/dplayer --enable-logging 
