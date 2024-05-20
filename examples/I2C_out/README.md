# I2C Display Example

This demonstrates display output through I2C. An Arduino Nano Every parses the serial data from the Pi then updates a string of DotStar/APA102 LEDs.

![Video of I2C display](/examples/media/i2c_out.webp "Cover image")

## Files

* [config.json](config.json) - ledpage configuration
* [arduino.ino](arduino.ino) - Arduino Nano Every code
* [pi_config.txt](pi_config.txt) - Raspberry Pi config file, to be saved in /boot/ as per https://www.raspberrypi.com/documentation/computers/config_txt.html

## Note

This requires I2C to be enabled on the Raspberry Pi, which can be done through `raspi-config`. The baudrate on the Pi and Arduino must also match, as shown in `arduino.ino` and `pi_config.txt`.

## Logging

Performance logs can be accessed through the Arduino monitor when connected by USB if `PERFORMANCE_LOGGING` is defined. Alternatively, you can use `minicom` or `stty` on the command line.

```shell
sudo apt install minicom
minicom -D /dev/ttyACM0 -b 115200
# CTRL-A X to exit
```

```shell
stty -F /dev/ttyACM0 raw 115200
cat /dev/ttyACM0
```
