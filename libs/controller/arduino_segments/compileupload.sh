#!/bin/bash

# report starting
echo "compileupload.sh: Starting:"

# cd to dir and make arduino file
cd /usr/src/app/libs/controller/arduino_segments && make

# stop hyperion
systemctl stop hyperion
echo "hyperion process stopped"

# compile and upload to arduino
diff /usr/src/app/libs/controller/arduino_segments/form_setup.ino /data/arduino_display.ino || PROGRAMMER=1
if [ "${PROGRAMMER:-}" == "1" ]; then
  echo $PROGRAMMER
  pushd /usr/src/app/libs/controller/arduino_segments
  make upload && cp form_setup.ino /data/arduino_display.ino
  unset PROGRAMMER
  popd
fi

# restart hyperion
systemctl start hyperion
echo "hyperion process restarted"

# report end
echo "compileupload.sh: Finished compile and upload!"
