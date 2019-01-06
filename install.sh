#!/bin/bash

# for raspbian 2018-11-13-raspbian-stretch-lite.zip image

# dependencies
sudo apt update && sudo apt install xserver-xorg-core \
  xserver-xorg-input-all \
  xserver-xorg-video-fbturbo \
  xorg \
  libgtk2.0-dev \
  libxss1 \
  libgconf2-dev \
  libnss3

# edit /etc/X11/Xwrapper.config to include the line:
# allowed_users=anybody