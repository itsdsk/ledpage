# Web Bluetooth API Example

This example contains a website with graphics that follow the rotation of a nearby device. The device is an ESP32 with a BNO055 IMU attached.

![Video of Web Bluetooth demo](/examples/media/webbluetooth.gif "Cover image")

## Files

* [RotationToBLE.ino](RotationToBLE.ino) - ESP code
* [public/](public) - website

## Logging

Performance logs can be accessed through the Arduino monitor when connected by USB. Alternatively, you can use `minicom` or `stty` on the command line.

```shell
sudo apt install minicom
minicom -D /dev/ttyACM0 -b 9600
# CTRL-A X to exit
```

```shell
stty -F /dev/ttyACM0 raw 9600
cat /dev/ttyACM0
```
