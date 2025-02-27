![Photos of projects realised using this software](/examples/media/cover.webp "Cover image")

Web browser for the [Raspberry Pi](www.raspberrypi.com) that streams to addressable LEDs, motors and other outputs by sampling the display at any given 2D location. It is controlled wirelessly over a web interface. For videos of it in action, see [here](examples/media/corona_lamp.mp4) and [here](exmples/media/square_two.mp4).

## Supported outputs and inputs

- UART (Arduino Uno [video](examples/media/uart_out.webp), [example](examples/UART_out))
- SPI (DotStar/APA102 [image](examples/media/spi_out.jpg), [example](examples/SPI_out))
- PWM (DC motor [video](examples/media/ble_pwm_out.webp), [image](examples/media/ble_pwm_out.jpg), [example](examples/BLE_out))
- I2C (Arduino Nano Every [video](examples/media/i2c_out.webp), [example](examples/I2C_out))
- Bluetooth (BLE [video](examples/media/ble_pwm_out.webp), [image](examples/media/ble_pwm_out.jpg), [example](examples/BLE_out))
- WebAudio <!-- ([MIC example](examples/MIC_IN/README.md)) -->
- WebBluetooth (IMU [video](examples/media/webbluetooth.gif), [example](examples/WebBluetooth_in))
- WebRTC (Pose detection [video](examples/media/webrtc_in.webp), [example](examples/WebRTC_in))

## Compile and install

- Connect a terminal to headless device running Raspberry Pi OS Lite: `ssh pi@<ip address>`.

- Run these commands to download the repository and dependencies, build, install and add to start up.

```bash
git clone --recurse-submodules -j8 https://github.com/itsdsk/ledpage.git
cd ./ledpage
chmod +x install.sh
./install.sh
```

- Follow the final instructions at the end of [install.sh](install.sh).

## Configure the display topology

- Save a list of XY coordinates in the format described by [examples/README.md](examples/README.md).

## Open the web UI

- Nagivate to [http://raspberrypi.local](http://raspberrypi.local) from a device on the same local network.

![Screenshots of the web UI homepage](/examples/media/web_ui_home.png)

## Update the configuration

- Go to the setup page of the web UI: [http://raspberrypi.local/setup](http://raspberrypi.local/setup).

![Screenshots of the web UI setup page](/examples/media/web_ui_setup.png)

- Copy your configuration JSON into the text input.

- Click update.

- Reboot the Pi.
