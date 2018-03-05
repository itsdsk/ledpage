#!/bin/bash

# kill all subshells and processes on exit
trap "kill 0" SIGINT

# start electron
umount /dev/shm && mount -t tmpfs shm /dev/shm
rm /tmp/.X0-lock &>/dev/null || true
( startx /usr/src/app/core/dplayer/node_modules/electron/dist/electron /usr/src/app/core/dplayer --enable-logging ) &

# start webserver/led layout
( cd /usr/src/app/core/dsetup && pm2 start d3server.js ) &

# start webserver/cms
( cd /usr/src/app/core/dremote && pm2 start keystone.js ) &

# wait for subprocesses to finish
wait
