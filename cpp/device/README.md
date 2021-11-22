# Configuration

```javascript
{
    "window": {
        //
    },
    "outputs": []
}
```

## Window

Contains the dimensions in which the LED coordinates are mapped. Note that the coordinate system is mapped so that the top left corner is considered (0,0).

```javascript
{
    "width": 640,
    "height": 480
}
```

## Outputs

### APA102 on Pi GPIO #0

Dotstar/APA102 via Raspberry Pi GPIO pins `BCM 10` for data and `BCM 11` for clock (SPI0)

```javascript
{
    "type": "apa102_spi0",
    "properties": {
        "colorOrder": "rgb",
        "clockDivider": 64
    },
    "leds": [ /* ... */ ]
}
```

#### clockDivider
##### type
integer 
##### description
SPI clock speed (via SPI clock divider [info](https://www.airspayce.com/mikem/bcm2835/group__constants.html#gaf2e0ca069b8caef24602a02e8a00884e))

### APA102 on Pi GPIO #1

Dotstar/APA102 via Raspberry Pi GPIO pins `BCM 20` for data and `BCM 21` for clock (SPI1)

```javascript
{
    "type": "apa102_spi1",
    "properties": {
        "colorOrder": "rgb",
        "clockDivider": 64
    },
    "leds": [ /* ... */ ]
}
```

#### clockDivider
##### type
integer 
##### description
SPI clock speed (via SPI clock divider [info](https://www.airspayce.com/mikem/bcm2835/group__constants.html#gaf2e0ca069b8caef24602a02e8a00884e))

### Arduino on Pi USB port

Neopixel/WS2812 via Arduino connected to Raspberry Pi via USB serial / RS232 [arduino sketch](https://pastebin.com/zhQCRFhd)

```javascript
{
    "type": "adalight_serial",
    "properties": {
        "port": "/dev/ttyACM0",
        "colorOrder": "rgb",
        "rate": 460800
    },
    "leds": [ /* ... */ ]
}
```

#### port
##### type
string 
##### description
path to USB device e.g. /dev/ttyACM0

### UART

Arduino connected to Raspberry Pi GPIO pin `BCM 14` (UART)

```javascript
{
    "type": "adalight_uart",
    "properties": {
        "colorOrder": "rgb"
    },
    "leds": [ /* ... */ ]
}
```

### PWM (using bcm2835 library)

Device connected to Raspberry Pi via GPIO pin `BCM 18` (PWM0)

```javascript
{
    "type": "pwm_hw",
    "properties": {
        "colorOrder": "rgb",
        "clockDivider": 128
    },
    "leds": [ /* ... */ ]
}
```

#### clockDivider
##### type
integer 
##### description
PWM clock speed (via divider [info](https://www.airspayce.com/mikem/bcm2835/group__pwm.html#ga4487f4e26e57ea3697a57cf52b8de35b))

### PWM (using pigpio library)

Device connected to Raspberry Pi via PWM

```javascript
{
    "type": "pwm_gpio",
    "properties": {
        "colorOrder": "rgb",
        "pin": 18,
        "frequency": 250,
    },
    "leds": [ /* ... */ ]
}
```

#### pin
##### type
integer 
##### description
GPIO pin number on Raspberry Pi in range 0-31 (more [info](http://abyz.me.uk/rpi/pigpio/cif.html))

#### frequency
##### type
integer 
##### description
PWM clock speed in Hz (more [info](http://abyz.me.uk/rpi/pigpio/cif.html))

### Bluetooth Serial Port Profile

Arduino with HC-05 module connected via Bluetooth. SPP must be enabled on the Raspberry Pi and the device should be trusted beforehand.

```javascript
{
    "type": "bluetooth_spp",
    "properties": {
        "colorOrder": "rgb",
        "MAC": "00:00:00:00:00:00"
    },
    "leds": [ /* ... */ ]
}
```

#### MAC
##### type
string 
##### description
MAC address of bluetooth server

## Settings

```javascript
"settings": {
    "brightness": 0.0125,
    "desaturation": 0.0,
    "gamma": 2.2,
    "blur": 50,
    "fade": 25000,
    "autoplayDuration": {
        "min": 30000,
        "max": 60000
    },
    "startupPlaylist": "",
    "autoClickPeriod": 0,
    "title": "DISK"
}
```

# Example

```javascript
{
    "window": {
        "width": 640,
        "height": 480
    },
    "outputs": [
        {
            "type": "adalight_serial",
            "properties": {
                "port": "/dev/ttyACM0",
                "colorOrder": "rgb",
                "rate": 460800
            },
            "leds": [
                {
                    "x": 160,
                    "y": 120,
                    "r": 50
                }
            ]
        }
    ]
}
```
