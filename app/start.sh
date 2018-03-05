#!/bin/bash

# kill all subshells and processes on exit
trap "kill 0" SIGINT

# start mongodb
#( mongod ) &

sleep 15

# start electron
umount /dev/shm && mount -t tmpfs shm /dev/shm
rm /tmp/.X0-lock &>/dev/null || true
( startx /usr/src/app/core/dplayer/node_modules/electron/dist/electron /usr/src/app/core/dplayer --enable-logging ) &

# start hyperion
#( /usr/bin/hyperiond /usr/src/app/core/dsetup/hyperion_config/hyperion.config.json ) &

sleep 5

# start webserver/led layout
( cd /usr/src/app/core/dsetup && pm2 start d3server.js ) &

sleep 5

# start webserver/cms
( cd /usr/src/app/core/dremote && pm2 start keystone.js ) &

sleep 5

# start nginx
#( /usr/sbin/nginx -g 'daemon off;' ) &

# wait
sleep 30

# report done
echo "---------------------------"
echo "start.sh: Finished startup!"
echo "---------------------------"

# wait for subprocesses to finish
wait
