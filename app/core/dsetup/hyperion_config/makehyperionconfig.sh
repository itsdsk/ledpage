#!/bin/bash

# report starting
echo "makehyperionconfig.sh: Starting!"

# add first bit to file
cat /usr/src/app/core/dsetup/hyperion_config/config_pt1.txt >> /usr/src/app/core/dsetup/hyperion_config/temp.config.json

# add middle bit (LEDs) to file
cat /usr/src/app/core/dsetup/hyperion_config/leds.txt >> /usr/src/app/core/dsetup/hyperion_config/temp.config.json

# add last bit to file
cat /usr/src/app/core/dsetup/hyperion_config/config_pt2.txt >> /usr/src/app/core/dsetup/hyperion_config/temp.config.json

# check if config is different
if diff -q /usr/src/app/core/dsetup/hyperion_config/temp.config.json /usr/src/app/core/dsetup/hyperion_config/hyperion.config.json > /dev/null; then
    echo "LED config in hyperion unchanged"
else
    echo "Restarting Hyperion - LED config changed"
    # check and kill hyperion (https://stackoverflow.com/a/15896729)
	ps -ef | grep /usr/bin/hyperiond | grep -v grep | awk '{print $2}' | xargs kill
	# remove old file
	rm /usr/src/app/core/dsetup/hyperion_config/hyperion.config.json
	# copy new config
	cp /usr/src/app/core/dsetup/hyperion_config/temp.config.json /usr/src/app/core/dsetup/hyperion_config/hyperion.config.json
	# make config public
	cp /usr/src/app/core/dsetup/hyperion_config/hyperion.config.json /usr/src/app/core/dsetup/public/hyperion.config.json
	# remove temp file
	rm /usr/src/app/core/dsetup/hyperion_config/temp.config.json
	# start hyperion
	( /usr/bin/hyperiond /usr/src/app/core/dsetup/hyperion_config/hyperion.config.json ) &
	# report done
	echo "makehyperionconfig.sh: Finished!"
fi











