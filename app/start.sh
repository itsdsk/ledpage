#!/bin/bash

# kill all subshells and processes on exit
trap "kill 0" SIGINT

# start mongodb
( mongod ) &

sleep 5

# start electron
umount /dev/shm && mount -t tmpfs shm /dev/shm
rm /tmp/.X0-lock &>/dev/null || true
( startx /usr/src/app/node_modules/electron/dist/electron /usr/src/app --enable-logging ) &

sleep 5

# start webserver/led layout
( cd /usr/src/app/d3 && /usr/local/bin/node /usr/src/app/d3/d3server.js ) &

sleep 5

# start hyperion
( /usr/bin/hyperiond /usr/src/app/hyperion_config/hyperion.config.json ) &

sleep 5

# start webserver/cms
( cd /usr/src/app/cms && /usr/local/bin/node /usr/src/app/cms/keystone.js ) &

sleep 5

# start nginx
( nginx -g "daemon off;" ) &

# wait
sleep 30

# report done
echo "---------------------------"
echo "start.sh: Finished startup!"
echo "---------------------------"

# wait for subprocesses to finish
wait
