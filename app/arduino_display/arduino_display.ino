// reference: http://www.instructables.com/id/Interface-Python-and-Arduino-with-pySerial/

// LED programming objects
#include "FastLED.h"
#define DATA_PIN 5
#define NUM_LEDS 32
CRGB leds[NUM_LEDS];

// data header
const uint8_t header[4] = { 0xDE, 0xAD, 0xBE, 0xEF };

void setup()
{
  // initialise serial USB communication
  Serial.begin(9600);
  Serial.setTimeout(50);

  // initialise LEDs
  FastLED.addLeds<WS2812B, DATA_PIN, BRG>(leds, NUM_LEDS);

  // initialise randomness
  randomSeed(analogRead(0));
}


void loop()
{
  // reference:
  // https://github.com/FastLED/FastLED/wiki/Interrupt-problems

  while(true) {
    while(Serial.available() == false){} // wait for serial data
    uint8_t b = Serial.read(); // read first byte
    bool looksLikeHeader = false;
    if(b == header[0]){ // check if first byte is header
      looksLikeHeader = true;
      for(int i = 1; looksLikeHeader && (i < sizeof(header)); i++) {
        while(Serial.available() == 0){} // wait for new serial data
        b = Serial.read();
        if(b != header[i]) {
          // whoops, not a match, this no longer looks like a header.
          looksLikeHeader = false;
        }
      }
    }
    if(looksLikeHeader){
      int bytesRead = 0;
      // read bytes to buffer
      while(bytesRead < (NUM_LEDS*3)){
        bytesRead += Serial.readBytes((char*)(((uint8_t*)leds) +
                      bytesRead), (NUM_LEDS*3)-bytesRead);
      }
      break; // break out of while loop
    }
  }
  // output to LEDs
  FastLED.show();

  // finally, flush out any data in the serial buffer, as it may have been interrupted oddly by writing out led data:
  while(Serial.available() > 0) { Serial.read(); }
}
