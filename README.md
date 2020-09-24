# Disk Interaction System

Disk Interaction System is an app for things with physical outputs, such as LEDs and motors, that cycles through websites while translating the video of the screen to electronic devices(s) in any position.

## Supported hardware

* Raspberry Pi 3/4
* DotStars
* NeoPixels
* DC Motors

## Installation

Download with dependencies in terminal:

```bash
git clone --recurse-submodules -j8 https://github.com/itsdsk/disk-interaction-system.git
cd ./disk-interaction-system
```

Install web UI:

```bash
npm install
npm run dev
# open http://localhost:3000
```

Create configuration file, for example:

```javascript
{
    "window": {
        "width": 640,
        "height": 480
    },
    "outputs": [
        {
            "type": "apa102_spi0", // apa102_spi1, adalight_serial, adalight_uart, pwm_hw, pwm_gpio
            "properties": {
                "colorOrder": "rgb"
            },
            "leds": [
                {
                    "x": 320,
                    "y": 240,
                    "r": 50
                }
            ]
        }
    ]
}
```

Install all on a Raspberry Pi running Raspbian Lite setup headlessly:

```bash
chmod +x install.sh
./install.sh # then follow instructions at bottom of install.sh
# open http://<IP address or 'raspberrypi.local'>:3000
```