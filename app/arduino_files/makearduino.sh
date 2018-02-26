#!/bin/bash

numleds=$1

# remove existing file
rm ./arduino_display.ino

# add first bit to file
cat display_pt1.txt >> arduino_display.ino
# add numleds
echo "#define NUM_LEDS " $numleds >> arduino_display.ino
# add last bit to file
cat display_pt2.txt >> arduino_display.ino

# copy arduino file
cp arduino_display.ino /usr/src/app/arduino_display/arduino_display.ino

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
