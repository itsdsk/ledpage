#!/bin/bash

numleds=$1

# report starting
echo "makearduino.sh: Starting arduino sync!"

# check and kill hyperion (https://stackoverflow.com/a/15896729)
ps -ef | grep /usr/bin/hyperiond | grep -v grep | awk '{print $2}' | xargs kill

# add first bit to file
cat /usr/src/app/arduino_files/display_pt1.txt >> /usr/src/app/arduino_files/arduino_display.ino
# add numleds
echo "#define NUM_LEDS" $numleds >> /usr/src/app/arduino_files/arduino_display.ino
# add last bit to file
cat /usr/src/app/arduino_files/display_pt2.txt >> /usr/src/app/arduino_files/arduino_display.ino

# copy arduino file
cp /usr/src/app/arduino_files/arduino_display.ino /usr/src/app/arduino_display/arduino_display.ino

# compile and update arduino
cd /usr/src/app/arduino_display && ./compileupload.sh

# remove files
rm /usr/src/app/arduino_files/arduino_display.ino
rm /usr/src/app/arduino_display/arduino_display.ino

# start hyperion
( /usr/bin/hyperiond /usr/src/app/hyperion.config.json ) &

# report done
echo "makearduino.sh: Finished arduino sync!"
