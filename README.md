avconv -f x11grab -r 25 -s 1824x984 -i :0.0+0,0 -vcodec libx264 video.mkv

avconv -f x11grab -r 25 -s 1824x984 -i :0.0+0,0 -c:v libx264 -f mpegts udp://224.0.0.100:1234

uv4l --driver raspidisp --display 0 --framerate 30 --resolution 0 --auto-video_nr

g++ -o process_video process_v4l.cpp

v4l2-ctl --all -d /dev/video0

g++ opencv_test.cpp -o  opencv_test -I/usr/local/include/ -lopencv_core -lopencv_highgui -lopencv_imgproc

export DISPLAY=":0" && g++ xscr.cpp -o  xscr -I/usr/local/include/ -lopencv_core -lopencv_highgui -lopencv_imgproc -lX11

export DISPLAY=":0" && g++ Xcap.cpp -o  xcap -I/usr/local/include/ -lX11

gcc -o capv4l2 capv4l2.c -I/usr/local/include/ -lopencv_core -lopencv_highgui -lopencv_imgproc -lm

resin sync --source . --destination /usr/src/

avconv -r 25 -s 1824x984 -f video4linux2 -i /dev/video0 udp://224.0.0.100:1234

/usr/bin/hyperiond ./hyperion.config.json

resin sync --source ./app/ --destination /usr/src/app/

mongod --repair

import -window root -display :0.0 screenshot.jpg

curl -H "Content-Type: application/json" -X POST -d '{"username":"xyz","password":"xyz"}' http://localhost:19444

curl -X POST -H "Content-Type: application/json" -d '"leds":[{"index":0,"hscan":{"minimum":0.2222,"maximum":0.3333},"vscan":{"minimum":0.1111,"maximum":0.2222}}]' http://localhost:19444

curl -H "Content-Type: application/json" --data-binary @test.json http://localhost:19444
{"command":"color","priority":100,"color":[255,0,255]}

main (pm2)
- player
  - play sketch URI
  - (IPC to main)
- hardware
  - compile                          x
  - upload                           x
  - (IPC to main)
- remote
  - cms web view
	- play sketch
	- add sketch
  - setup web view
    - set led num+chipset+port       
    - set positions                  
	- (future?) sort/reorder
- file-sharing
  - download sketch
hyperion
mongodb
nginx
