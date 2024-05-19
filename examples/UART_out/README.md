# UART Display Example

This demonstrates display output through UART. An Arduino Uno parses the serial data from the Pi then updates a string of DotStar/APA102 LEDs.

![Video of UART display](/examples/media/uart_out.webp "Cover image")

## Files

* [config.json](config.json) - ledpage configuration
* [arduino.ino](arduino.ino) - Arduino Uno code
* [pi_config.txt](pi_config.txt) - Raspberry Pi config file, to be saved in /boot/ as per https://www.raspberrypi.com/documentation/computers/config_txt.html

## Logging

Performance logs can be accessed through the Arduino monitor when connected by USB. Alternatively, you can use `minicom` or `stty` on the command line.

```shell
sudo apt install minicom
minicom -D /dev/ttyACM0 -b 115200
# CTRL-A X to exit
```

```shell
stty -F /dev/ttyACM0 raw 115200
cat /dev/ttyACM0
```
