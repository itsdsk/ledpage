#!/bin/bash

# for raspbian 2018-11-13-raspbian-stretch-lite.zip image

curl -sL https://deb.nodesource.com/setup_12.x | sudo -E bash -

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
  libboost-all-dev \
  nodejs \
  cmake \
  bluetooth \
  pi-bluetooth \
  bluez \
  blueman \
  libbluetooth-dev \
  libxtst-dev \
  xdotool

# get absolute path to directory
BASEDIR=$(dirname $(readlink -f $0))

# compile backend
cd ./cpp
chmod +x ./compile.sh
./compile.sh
cd ../
# add backend to service manager
sudo bash -c "> /etc/systemd/system/disk-backend-daemon.service"
sudo bash -c "cat <<EOT >> /etc/systemd/system/disk-backend-daemon.service
[Unit]
Description=Disk Backend
After=disk-renderer-daemon.service

[Service]
ExecStart=$BASEDIR/cpp/main -d -c \"$BASEDIR/public/config.json\" -p \"$BASEDIR/public/settings.json\"
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOT"
sudo systemctl enable disk-backend-daemon

# get app dependencies
cd ./web
npm install
cd ../

# add renderer to service manager
sudo bash -c "> /etc/systemd/system/disk-renderer-daemon.service"
sudo bash -c "cat <<EOT >> /etc/systemd/system/disk-renderer-daemon.service
[Unit]
Description=Disk Renderer
After=disk-ui-daemon.service

[Service]
ExecStart=/usr/bin/startx $BASEDIR/web/node_modules/electron/dist/electron --no-sandbox $BASEDIR/web/renderer.js
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOT"
sudo systemctl enable disk-renderer-daemon

# run script to build web pages
cd ./web
npm run build
cd ../
# add renderer to service manager
sudo bash -c "> /etc/systemd/system/disk-ui-daemon.service"
sudo bash -c "cat <<EOT >> /etc/systemd/system/disk-ui-daemon.service
[Unit]
Description=Disk UI

[Service]
User=root
WorkingDirectory=$BASEDIR/web
ExecStart=/usr/bin/node app.js
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOT"
sudo systemctl enable disk-ui-daemon

sudo systemctl daemon-reload

sudo systemctl start disk-ui-daemon
sudo systemctl start disk-renderer-daemon
sudo systemctl start disk-backend-daemon

# disable screen-off (blanking)
sudo bash -c "> /usr/share/X11/xorg.conf.d/10-monitor.conf"
sudo bash -c "cat <<EOT >> /usr/share/X11/xorg.conf.d/10-monitor.conf
Section \"ServerLayout\"
    Identifier \"ServerLayout0\"
    Option \"StandbyTime\" \"0\"
    Option \"SuspendTime\" \"0\"
    Option \"OffTime\"     \"0\"
    Option \"BlankTime\"   \"0\"
EndSection
EOT"


# for UART output:
# run `sudo raspi-config`
# go to 'Interfacing options'
# go to 'Serial' and press Enter
# select No to 'Login shell to be accessible over serial'
# select Yes to 'Serial port hardware'
# reboot

# edit /etc/X11/Xwrapper.config to include the line:
# allowed_users=anybody

# edit /etc/X11/xinit/xserverrc so the exec line is:
# exec /usr/bin/X -nocursor -nolisten tcp "$@"

# edit system video settings in /boot/config.txt:
# force HDMI output
# hdmi_force_hotplug=1
# HDMI mode
# hdmi_group=2
# custom size:
# hdmi_mode=87
# hdmi_cvt=640 480 60 1 0 0 0
# 640 x 350 @ 85Hz:
# hdmi_group=2
# hdmi_mode=1
# gpu_mem=192
