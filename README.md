# Disk1

Disk1 is an LED display server for motion graphics with a web interface. The main features of project title are:

* Configure LED things with arbitrary 2D mappings
* Display motion graphics supported by modern browsers
* Freely upload and download motion graphics 'sketches' to and from subscribed peer-to-peer channels
* Program automatic and responsive display behaviour

## Getting Started

<!-- These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system. -->

These instructions will get the project up and running for testing and development purposes. See deployment for notes on how to deploy the project on a live system with rendering, sharing and LED output.

<!-- - Make sure you have [Node.js](http://nodejs.org/download) 0.10+ and [MongoDB](http://www.mongodb.org/downloads) v2.4+ installed -->

### Prerequisites

Make sure you have [Node.js](http://nodejs.org/download) 0.10+ and [MongoDB](http://www.mongodb.org/downloads) v2.4+ installed.


<!-- What things you need to install the software and how to install them -->


### Installing

- Clone this repository to your local workspace
- Install the dependencies by running `npm install` in the root folder
- Start MongoDB then run `node app.js`
- Visit the app using a web browser (default: `http://0.0.0.0:8081`)

INSERT WEB UI SCREENSHOTS

<!-- A step by step series of examples that tell you have to get a development env running -->

<!-- Say what the step will be

```
Give the example
```

And repeat

```
until finished
```

End with an example of getting some data out of the system or using it for a little demo -->

<!-- ## Running the tests

Explain how to run the automated tests for this system

### Break down into end to end tests

Explain what these tests test and why

```
Give an example
```

### And coding style tests

Explain what these tests test and why

```
Give an example
```
 -->
## Deployment

<!-- Add additional notes about how to deploy this on a live system -->

### Hardware

This project is designed to run on Raspberry Pi and Arduino devices. Similar hardware should work although only the RPi3 and Arduino Uno have been tested.

For LED output, the system needs a microcontroller attached to the main computer by USB. The following boards can be configured by the software automatically via the Web UI:

```
Arduino Uno/Arduino Leonardo/Arduino Mega/Arduino Nano
```

The LED chipsets supported by the Web UI setup are listed below:

```
LED Chipsets: APA102 (Dotstar), WS2812B (Neopixel), WS2813, WS2811, WS2801, TM1812, TM1809, TM1804, TM1803, UCS2903, UCS1903, LPD8806, SM16716, P9813, GW6205, APA104.
```

### Setup

- Sign up on [resin.io](https://dashboard.resin.io/signup)
- go throught the [getting started guide](http://docs.resin.io/raspberrypi/nodejs/getting-started/) and create a new application
- clone this repository to your local workspace
- add the _resin remote_ to your local workspace using the useful shortcut in the dashboard UI ![remoteadd](https://raw.githubusercontent.com/resin-io-playground/boombeastic/master/docs/gitresinremote.png)
- `git push resin master`

#### Configuration

| Key                                       | Value
|-------------------------------------------|-------------------------
|**`RESIN_HOST_CONFIG_hdmi_force_hotplug`** | **`1`**
|**`RESIN_HOST_CONFIG_hdmi_group`**         | **`2`**
|**`RESIN_HOST_CONFIG_hdmi_mode`**          | **`87`**
|**`RESIN_HOST_CONFIG_hdmi_cvt`**           | **`720 720 60 1 0 0 0`**
|**`RESIN_HOST_CONFIG_gpu_mem`** | **`194`**

### How to Add Media

Upload valid HTML in the 'Upload' view.

#### Example

- Design a [p5js](https://editor.p5js.org/) sketch and fit the canvas to the window using this setup ([more info](https://github.com/processing/p5.js/wiki/Positioning-your-canvas#making-the-canvas-fill-the-window)):
```
function setup(){
  var cnv = createCanvas(windowWidth, windowHeight);
  var x = (windowWidth - width) / 2;
  var y = (windowHeight - height) / 2;
  cnv.position(x, y);
}
```

- Wrap your sketch between the following HTML blocks:
```
<html>
  <head>
    <script src="http://cdnjs.cloudflare.com/ajax/libs/p5.js/0.5.6/p5.js"></script>
    <script src="http://cdnjs.cloudflare.com/ajax/libs/p5.js/0.5.6/addons/p5.dom.js"></script>
    <script>
```
```
</script>
  </head>
  <body>
  </body>
</html>
```

### Connect with Home Assistant

Install Hass.io
Install configurator https://www.home-assistant.io/getting-started/configuration/
Add REST command as service https://www.home-assistant.io/components/rest_command/, so in config/configuration.yaml:
```
rest_command:
  playmedia1:
    url: 'http://IP_ADDRESS/api/media/:id/play'
  full_brightness:
    url: 'http://192.168.0.30/api/leds/set-brightness/1.0'
  half_brightness:
    url: 'http://192.168.0.30/api/leds/set-brightness/0.5'

```
Then check it works by clicking 'services' in HASSIO sidebar, finding 'rest_command.playmedia1' and click 'call service'

Add the light to the HASSIO web ui by adding:
```
light:
  - platform: template
    lights:
      diskone:
        friendly_name: "Disk One"
        turn_on:
          service: rest_command.full_brightness
        turn_off:
          service: rest_command.half_brightness
```
Automation in automations.yaml or editor https://www.home-assistant.io/docs/automation/editor/
```
- id: '1526143570622'
  alias: Turn up brightness when media stops playing
  trigger:
  - entity_id: media_player.tv_room_hdmi4
    from: playing'
    platform: state
    to: idle'
  condition: []
  action:
  - alias: ''
    data: {}
    service: rest_command.full_brightness
- id: '1526144303798'
  alias: Turn down brightness when media starts playing
  trigger:
  - entity_id: media_player.tv_room_hdmi4
    from: 'idle'
    platform: state
    to: 'playing'
  condition: []
  action:
  - service: rest_command.half_brightness

```

## Built With

* [KeystoneJS](http://keystonejs.com/) - The web content management system used
* [Hyperion](https://hyperion-project.org/) - Image grabbing and output
* [IPFS](https://ipfs.io/) - Media sharing
* [FastLED](http://fastled.io/) - Used to drive LEDs
* [Resin.io](https://resin.io/) - Linux container management

<!-- ## Contributing

Please read [CONTRIBUTING.md](https://gist.github.com/PurpleBooth/b24679402957c63ec426) for details on our code of conduct, and the process for submitting pull requests to us. -->

<!-- ## Versioning

We use [SemVer](http://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/your/project/tags). -->

<!-- ## Authors

* **Billie Thompson** - *Initial work* - [PurpleBooth](https://github.com/PurpleBooth)

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details -->

<!-- ## Acknowledgments

* Hat tip to anyone who's code was used
* Inspiration
* etc -->
