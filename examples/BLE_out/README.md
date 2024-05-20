# Bluetooth and PWM Display Example

This demonstrates display output through Bluetooth Low Energy (BLE) and PWM. An Arduino Nano gets the data from a HC-05 bluetooth module, parses it, then updates a strip of NeoPixel/WS2812 LEDs and 2 motors. Simultaneously, PWM output controls a 3rd motor connected to the Pi GPIO.

![Video of BLE/PWM display](/examples/media/ble_pwm_out.webp "Cover image")

## Files

* [config.json](config.json) - ledpage configuration
* [arduino.ino](arduino.ino) - Arduino Nano code

![Image of BLE/PWM display](/examples/media/ble_pwm_out.jpg "Extra image")
