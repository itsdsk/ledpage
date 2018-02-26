#!/bin/bash

numleds=$1

# report starting
echo "makearduino.sh: Starting arduino sync!"

# add first bit to file
cat /usr/src/app/arduino_files/display_pt1.txt >> /usr/src/app/arduino_files/arduino_display.ino
# add numleds
echo "#define NUM_LEDS " $numleds >> /usr/src/app/arduino_files/arduino_display.ino
# add last bit to file
cat /usr/src/app/arduino_files/display_pt2.txt >> /usr/src/app/arduino_files/arduino_display.ino

# copy arduino file
cp /usr/src/app/arduino_files/arduino_display.ino /usr/src/app/arduino_display/arduino_display.ino

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

# remove file
rm /usr/src/app/arduino_files/arduino_display.ino

# report done
echo "makearduino.sh: Finished arduino sync!"
