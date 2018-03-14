#!/bin/bash

# report starting
echo "compileupload.sh: Starting:"

# compile and update arduino
cd /usr/src/app/core/dremote/libs/arduino_segments && make
diff /usr/src/app/core/dremote/libs/arduino_segments/form_setup.ino /data/arduino_display.ino || PROGRAMMER=1
if [ "${PROGRAMMER:-}" == "1" ]; then
  echo $PROGRAMMER
  pushd /usr/src/app/core/dremote/libs/arduino_segments
  make upload && cp form_setup.ino /data/arduino_display.ino
  unset PROGRAMMER
  popd
fi

# report end
echo "compileupload.sh: Finished compile and upload!"
