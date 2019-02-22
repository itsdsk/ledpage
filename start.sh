#!/bin/bash

# start backend
cd /home/pi/disk/backend && ./main -d &
# start renderer 
startx /home/pi/disk/renderer/node_modules/electron/dist/electron /home/pi/disk/renderer/main.js &
# start ui
cd ./ui && node app.js &