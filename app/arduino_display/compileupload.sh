#!/bin/bash

# report starting
echo "compileupload.sh: Starting:"

# output file to console
cat /usr/src/app/arduino_display/arduino_display.ino

# report
echo "compileupload.sh: Compile and upload!"

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

# report end
echo "compileupload.sh: Finished compile and upload!"
