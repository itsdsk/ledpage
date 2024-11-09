# Configuration

The main config contains an array for `outputs` and an object for `window` properties. It should be saved in `public/config.json`.

## Window

The `window` object contains the `width` and `height` bounds in which LED coordinates are mapped. Values will be stetched to fit the browser window's dimensions if these don't match.

```javascript
"window": {
    "width": 640,
    "height": 480
}
```

## Outputs

The `outputs` array contains one or more objects, each defining an output `type`, it's `properties` and an array of `leds`. All the available output types are described below.

2D coordinates, defined in the `leds` array for each output, are mapped such that the top left corner is (0,0). The value `r` is the radius in which pixels are sampled. Higher values of `r` typically improve colour reproduction on low-resoution displays. However, they also decrease FPS.

```javascript
"outputs": [
    {
        "type": "apa102_spi0",
        "leds": [
            {
                "x": 108.9,
                "y": 100.4,
                "r": 1
            },
            /* ... */
        ]
    }
]
```

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

### 'Disk One' on Pi USB port

Specific to 'disk one': Neopixel/WS2812 via Arduino connected to Raspberry Pi via USB serial / RS232

```javascript
{
    "type": "disk1_serial",
    "properties": {
        "port": "/dev/ttyACM0",
        "colorOrder": "rgb",
        "rate": 57600
    },
    "leds": [ /* ... */ ]
}
```

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

## Example config

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

# Settings

A second config contains settings for the display. This should be saved in `public/settings.json`.

## Example settings

```javascript
{
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
    "offlineMode": false,
    "title": "DISK"
}
```
