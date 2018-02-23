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
( /usr/bin/hyperiond /usr/src/app/hyperion.config.json ) &

# compile and update arduino
cd /usr/src/app/arduino_display && make
diff /usr/src/app/arduino_display/arduino_display.ino /data/arduino_display.ino || PROGRAMMER=1
if [ "${PROGRAMMER:-}" == "1" ]; then
  echo $PROGRAMMER
  pushd /usr/src/app/arduino_display
  make upload && cp arduino_display.ino /data/
  unset PROGRAMMER
  popd
fi

# start webserver/cms
( cd /usr/src/app/cms && /usr/local/bin/node /usr/src/app/cms/keystone.js ) &

# start nginx
( nginx -g "daemon off;" ) &

# wait for subprocesses to finish
wait
