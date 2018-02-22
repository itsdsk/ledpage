#!/bin/bash

# arduino

# check and update arduino board
diff /usr/src/app/arduino_display/arduino_display.ino /data/arduino_display.ino || PROGRAMMER=1
if [ "${PROGRAMMER:-}" == "1" ]; then
  echo $PROGRAMMER
  pushd /usr/src/app/arduino_display
  make upload && cp arduino_display.ino /data/
  unset PROGRAMMER
  popd
fi

# web server/cms

# start nginx
nginx -g "daemon off;"

# start mongodb
/docker-entrypoint.sh mongod &
# start webserver/cms
cd /usr/src/app/cms && /usr/local/bin/node /usr/src/app/cms/keystone.js &

# electron

# By default docker gives us 64MB of shared memory size but to display heavy
# pages we need more.
umount /dev/shm && mount -t tmpfs shm /dev/shm

# using local electron module instead of the global electron lets you
# easily control specific version dependency between your app and electron itself.
# the syntax below starts an X istance with ONLY our electronJS fired up,
# it saves you a LOT of resources avoiding full-desktops envs

rm /tmp/.X0-lock &>/dev/null || true
startx /usr/src/app/node_modules/electron/dist/electron /usr/src/app --enable-logging &

# start hyperion
/usr/bin/hyperiond /usr/src/app/hyperion.config.json
