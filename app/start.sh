#!/bin/bash

# kill all subshells and processes on exit
trap "kill 0" SIGINT

# start mongodb
( mongod ) &

# start electron
umount /dev/shm && mount -t tmpfs shm /dev/shm
rm /tmp/.X0-lock &>/dev/null || true
( startx /usr/src/app/node_modules/electron/dist/electron /usr/src/app --enable-logging ) &

# start webserver/led layout
( cd /usr/src/app/d3 && /usr/local/bin/node /usr/src/app/d3/d3server.js ) &

# start hyperion
( /usr/bin/hyperiond /usr/src/app/hyperion_config/hyperion.config.json ) &

# start webserver/cms
( cd /usr/src/app/cms && /usr/local/bin/node /usr/src/app/cms/keystone.js ) &

# wait
sleep 20

# start nginx
( nginx -g "daemon off;" ) &

# report done
echo "start.sh: Finished startup!"

# wait for subprocesses to finish
wait
