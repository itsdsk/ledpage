**API Endpoints**
----
  Base URL: `/api`

***

Upload content (web motion graphics)

* **URL**

  /media/create

* **Method:**

  `POST`

* **Data Params**

  **Required:**

  `sketch` = HTML content

***

Display content via URL

* **URL**

  /media/queue

* **Method:**

  `POST`

* **Data Params**

  **Required:**

  `address` = website URL

***

Display content on device

* **URL**

  /media/:id/play

* **Method:**

  `GET`

*  **URL Params**

   **Required:**

   `id=[string]`

***

Update local media

* **URL**

  /media/:id/update

* **Method:**

  `POST`

*  **URL Params**

   **Required:**

   `id=[string]`

* **Data Params**

  `code` = HTML content

  `title` = media name



***

Update channel of local media (add/remove)

* **URL**

  /media/:id/channel?\_id=:key

* **Method:**

  `GET`

*  **URL Params**

   **Required:**

   `id=[string]`

   `key=[string]`


***

Delete local media

* **URL**

  /media/:id/remove

* **Method:**

  `GET`

*  **URL Params**

   **Required:**

   `id=[string]`   

***

Save screenshot of local media

* **URL**

  /media/:id/screenshot

* **Method:**

  `GET`

*  **URL Params**

   **Required:**

   `id=[string]`   

***

Share local media on peer-to-peer network (IPFS)

* **URL**

  /media/:id/share

* **Method:**

  `GET`

*  **URL Params**

   **Required:**

   `id=[string]`   

***

Download content from peer-to-peer network

* **URL**

  /media/:ipfs/download

* **Method:**

  `GET`

*  **URL Params**

   **Required:**

   `ipfs=[string]`   

***

Add media channel

* **URL**

  /media/channel/subscribe?name=:topic

* **Method:**

  `GET`

*  **URL Params**

   **Required:**

   `topic=[string]`   

***

Remove media channel

* **URL**

  /media/channel/unsubscribe\?id=:key

* **Method:**

  `GET`

*  **URL Params**

   **Required:**

   `key=[string]`   

***

Display media in channel on repeat

* **URL**

  /media/channel/autoplay?secs=:time&channel=:key

* **Method:**

  `GET`

*  **URL Params**

   **Required:**

   `time=[integer]`

   `key=[string]`   

***

Upload LED coordinates

* **URL**

  /leds/map-positions

* **Method:**

  `POST`

* **Data Params**

  **Required:**

  `leds` = mapping coordinates

  `rescale` = multiplier for colour grabbing area

***

Upload colour correction values

* **URL**

  /leds/calibrate

* **Method:**

  `POST`

* **Data Params**

  **Required:**

  `body` = values to transform pure colours

***

Set brightness

* **URL**

  /leds/set-brightness/:val

* **Method:**

  `GET`

* **URL Params**

  **Required:**

  `val=[float]`

***

Configure and upload to USB-connected Arduino

* **URL**

  /leds/config-arduino

* **Method:**

  `POST`

* **Data Params**

  **Required:**

  `numLeds` = number of individual LEDs

  `ledChip` = chipset of LED modules

  `boardType` = Arduino model

  `dataPin` = pin number for Arduino data out

  **Optional:**

  `clockPin` = pin number for Arduino clock

***

Restart device

* **URL**

  /system/reboot

* **Method:**

  `GET`

***

Turn off device

* **URL**

  /system/shutdown

* **Method:**

  `GET`


<!-- ***

* **URL**

  /users/:id

* **Method:**

  `GET`

*  **URL Params**

   **Required:**

   `id=[integer]`

* **Data Params**

  None

* **Success Response:**

  * **Code:** 200 <br />
    **Content:** `{ id : 12, name : "Michael Bloom" }`

* **Error Response:**

  * **Code:** 404 NOT FOUND <br />
    **Content:** `{ error : "User doesn't exist" }`

  OR

  * **Code:** 401 UNAUTHORIZED <br />
    **Content:** `{ error : "You are unauthorized to make this request." }`

* **Sample Call:**

  ```javascript
    $.ajax({
      url: "/users/1",
      dataType: "json",
      type : "GET",
      success : function(r) {
        console.log(r);
      }
    });
  ``` -->
