#!/bin/bash

# for raspbian 2018-11-13-raspbian-stretch-lite.zip image

# dependencies
sudo apt update
sudo apt install xserver-xorg-core \
  xserver-xorg-input-all \
  xserver-xorg-video-fbturbo \
  xorg \
  libgtk-3-0 \
  libxss1 \
  libgconf2-dev \
  libnss3 \
  sqlite3 \
  libboost-all-dev

# compile backend
cd ./backend
sudo chmod +x ./compile.sh
./compile.sh
cd ../
# add backend to service manager
sudo > /etc/systemd/system/disk-backend-daemon.service
sudo chmod 664 /etc/systemd/system/disk-backend-daemon.service
sudo cat <<EOT >> /etc/systemd/system/disk-backend-daemon.service
[Unit]
Description=Disk Backend
After=disk-renderer-daemon.service

[Service]
ExecStart=/home/pi/disk/backend/main -d

[Install]
WantedBy=multi-user.target
EOT
systemctl enable disk-backend-daemon

# get renderer dependencies
cd ./renderer/
npm install
cd ../
# add renderer to service manager
sudo > /etc/systemd/system/disk-renderer-daemon.service
sudo chmod 664 /etc/systemd/system/disk-renderer-daemon.service
sudo cat <<EOT >> /etc/systemd/system/disk-renderer-daemon.service
[Unit]
Description=Disk Renderer
After=disk-ui-daemon.service

[Service]
ExecStart=/usr/bin/startx /home/pi/disk/renderer/node_modules/electron/dist/electron /home/pi/disk/renderer/main.js

[Install]
WantedBy=multi-user.target
EOT
systemctl enable disk-renderer-daemon

# get app dependencies
cd ./ui/
npm install
cd ../
# add renderer to service manager
sudo > /etc/systemd/system/disk-ui-daemon.service
sudo chmod 664 /etc/systemd/system/disk-ui-daemon.service
sudo cat <<EOT >> /etc/systemd/system/disk-ui-daemon.service
[Unit]
Description=Disk UI

[Service]
User=root
WorkingDirectory=/home/pi/disk/ui
ExecStart=/usr/bin/node app.js

[Install]
WantedBy=multi-user.target
EOT
systemctl enable disk-ui-daemon

# edit /etc/X11/Xwrapper.config to include the line:
# allowed_users=anybody

