class BalenaBLE {
  constructor() {
    this.device = null;
    this.imu = null;
    this.onDisconnected = this.onDisconnected.bind(this);
  }

  /* the IMU characteristic providing on/off capabilities */
  async setImuCharacteristic() {
    console.log('setImuCharacteristic');
    if (this.device.connected == false) {
      console.log('setimu reconnect');
      await this.connect();
    }
    const service = await this.device.gatt.getPrimaryService('4fafc201-1fb5-459e-8fcc-c5c9c331914b');
    const characteristic = await service.getCharacteristic(
      "beb5483e-36e1-4688-b7f5-ea07361b26a8"
    );
    // characteristic.startNotifications();
    this.imu = characteristic;

    await this.imu.startNotifications();

    this.imu.addEventListener(
      "characteristicvaluechanged",
      handleImuStatusChanged
    );
  }

  /* request connection to a BalenaBLE device */
  async request() {
    console.log('request');
    //await new Promise(r => setTimeout(r, 2000));
    let options = {
      filters: [
        {
          name: "ESP32"
        }
      ],
      optionalServices: ['4fafc201-1fb5-459e-8fcc-c5c9c331914b']
    };
    if (navigator.bluetooth == undefined) {
      alert("Sorry, Your device does not support Web BLE!");
      return;
    }
    this.device = await navigator.bluetooth.requestDevice(options);
    if (!this.device) {
      throw "No device selected";
    }
    this.device.addEventListener("gattserverdisconnected", this.onDisconnected);
  }

  /* connect to device */
  async connect() {
    console.log('connect');
    if (!this.device) {
      return Promise.reject("Device is not connected.");
    }
    await this.device.gatt.connect();
    // if(this.device.connected != true) {
    //   console.log('reconnect');
    //   this.connect();
    //    }
    // await this.setImuCharacteristic
  }

  //   exponentialBackoff(max, delay, toTry, success, fail) {
  //   toTry().then(result => success(result))
  //   .catch(_ => {
  //     if (max === 0) {
  //       return fail();
  //     }
  //     time('Retrying in ' + delay + 's... (' + max + ' tries left)');
  //     setTimeout(function() {
  //       exponentialBackoff(--max, delay * 2, toTry, success, fail);
  //     }, delay * 1000);
  //   });
  // }

  // time(text) {
  //   console.log('[' + new Date().toJSON().substr(11, 8) + '] ' + text);
  // }
  //   async connect() {
  //     console.log('connect');
  //     if (!this.device) {
  //       return Promise.reject("Device is not connected.");
  //     }
  //   this.exponentialBackoff(3 /* max retries */, 2 /* seconds delay */,
  //     async function toTry() {
  //       this.time('Connecting to Bluetooth Device... ');
  //       await this.device.gatt.connect();
  //     },
  //     function success() {
  //       console.log('> Bluetooth Device connected. Try disconnect it now.');
  //     },
  //     function fail() {
  //       time('Failed to reconnect.');
  //     });
  // }


  /* read LED state */
  async readImu() {
    let newImu = await this.imu.readValue();
    return decode(newImu);
  }

  /* disconnect from peripheral */
  disconnect() {
    if (!this.device) {
      return Promise.reject("Device is not connected.");
    }
    return this.device.gatt.disconnect();
  }

  /* handler to run when device successfully disconnects */
  onDisconnected(event) {
    console.log("Device is disconnected.");
    this.connect();
    //if (this.device.connected) {
    //  console.log('adding connected device imu');
    this.setImuCharacteristic();
    //}
    //location.reload();
  }
}
