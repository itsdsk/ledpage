// #define FASTLED_ALLOW_INTERRUPTS 0
// #define FASTLED_INTERRUPT_RETRY_COUNT 1
// #define FASTLED_FORCE_SOFTWARE_SPI

#include <FastLED.h>
#include <Wire.h>

#define NUM_LEDS 280 // 10 x 28
#define LED_TYPE APA102
#define DATA_RATE 4000 // KHz

CRGB leds[NUM_LEDS];       // output array
CRGB targetLeds[NUM_LEDS]; // target array

byte brightness = 0;       // output brightness
byte targetBrightness = 0; // target brightness

byte rawFrames[28][32]; // [num packets][packet length]

extern const uint8_t gamma8[]; // gamma correction lookup table

unsigned framesSinceReceiveEvent = 0; // how many times loop() has been called since last Wire.onReceive

// #define FRAMERATE_LIMITING
#ifdef FRAMERATE_LIMITING
float framerate_limit_period = 1000.0 / 30.0;
unsigned long framerate_limit_a;
unsigned long framerate_limit_b;
#endif

// #define PERFORMANCE_LOGGING
#ifdef PERFORMANCE_LOGGING
unsigned int perfLogFrequency = 450;
unsigned int loopCount = 0;
unsigned int lastMillis = 0;
#endif

void receiveEvent(int howMany);

void setup()
{
    delay(3000); // power up safety delay
    // init LEDs
    FastLED.addLeds<LED_TYPE, 11, 13, BGR, DATA_RATE_KHZ(DATA_RATE)>(leds, NUM_LEDS).setCorrection(TypicalSMD5050).setTemperature(CarbonArc);
    FastLED.setBrightness(brightness);
    // init I2C
    Wire.begin(0x8);              // join i2c bus with address #8
    Wire.setClock(500000);        // fast mode plus
    Wire.onReceive(receiveEvent); // register event
#ifdef PERFORMANCE_LOGGING
    // init debugging
    Serial.begin(115200);
    lastMillis = millis();
#endif
#ifdef FRAMERATE_LIMITING
    framerate_limit_a = millis();
    framerate_limit_b = millis();
#endif
}

void loop()
{
#ifdef FRAMERATE_LIMITING
    framerate_limit_a = millis();
    unsigned long work_time = framerate_limit_a - framerate_limit_b;
    if (work_time < framerate_limit_period)
    {
        unsigned int delta_ms = framerate_limit_period - work_time;
        FastLED.delay(delta_ms);
    }
    framerate_limit_b = millis();
#endif
// monitor performance
#ifdef PERFORMANCE_LOGGING
    if (loopCount == perfLogFrequency)
    {
        int millisNow = millis();
        int deltaMillis = millisNow - lastMillis;
        Serial.print(perfLogFrequency / (deltaMillis / 1000.0));
        Serial.println();
        lastMillis = millisNow;
        loopCount = 0;
    }
    loopCount++;
#endif
    // check if frames are being received
    framesSinceReceiveEvent++;
    if (framesSinceReceiveEvent >= 30 * 5)
    {
        // blank screen
        for (int i = 0; i < NUM_LEDS; i++)
        {
            leds[i] = CRGB::Black;
        }
        leds[0] = CRGB::Red;
        FastLED.setBrightness(32);
        FastLED.show();
        FastLED.delay(33);
        return;
    }
    // copy led buffer
    for (int i = 0; i < 28; i++)
    {
        for (int k = 0; k < 10; k++)
        {
            // get index of LED
            unsigned led_idx = (i * 10) + k;
            // set target array
            targetLeds[led_idx].r = pgm_read_byte(&gamma8[rawFrames[i][2 + (k * 3) + 0]]);
            targetLeds[led_idx].g = pgm_read_byte(&gamma8[rawFrames[i][2 + (k * 3) + 1]]);
            targetLeds[led_idx].b = pgm_read_byte(&gamma8[rawFrames[i][2 + (k * 3) + 2]]);
        }
    }
    // copy brightness, and...
    // downscale to stop voltage drop on 4fold that
    // appears as redder pixels further from the power inputs on the screen,
    // only when displaying pure white and setting brightness over 25%
    // without any clamping/mapping)
    targetBrightness = round(rawFrames[0][1] * 0.25);
    // set output array by blending into target
    unsigned NUM_BLENDS = 1;
    unsigned BLEND_DELAY = 5;
    unsigned MAX_BLEND = 12; // 0 - 255
    for (int i = 0; i < NUM_BLENDS; i++)
    {
        for (int k = 0; k < NUM_LEDS; k++)
        {
            // red
            if (leds[k].r < targetLeds[k].r)
            {
                // fade up
                leds[k].r += min(targetLeds[k].r - leds[k].r, MAX_BLEND);
            }
            else
            {
                // fade down
                leds[k].r -= min(leds[k].r - targetLeds[k].r, MAX_BLEND);
            }
            // green
            if (leds[k].g < targetLeds[k].g)
            {
                // fade up
                leds[k].g += min(targetLeds[k].g - leds[k].g, MAX_BLEND);
            }
            else
            {
                // fade down
                leds[k].g -= min(leds[k].g - targetLeds[k].g, MAX_BLEND);
            }
            // blue
            if (leds[k].b < targetLeds[k].b)
            {
                // fade up
                leds[k].b += min(targetLeds[k].b - leds[k].b, MAX_BLEND);
            }
            else
            {
                // fade down
                leds[k].b -= min(leds[k].b - targetLeds[k].b, MAX_BLEND);
            }
        }
        // blend brightness and update
        if (brightness < targetBrightness)
        {
            // fade up
            brightness += min(targetBrightness - brightness, MAX_BLEND);
        }
        else
        {
            // fade down
            brightness -= min(brightness - targetBrightness, MAX_BLEND);
        }
        // update LEDs
        FastLED.setBrightness(brightness);
        FastLED.show();
        FastLED.delay(BLEND_DELAY);
    }
}

// function that executes whenever data is received from master
// this function is registered as an event, see setup()
void receiveEvent(int howMany)
{
    framesSinceReceiveEvent = 0;

    if (Wire.available())
    {
        // get frame index
        int frameIndex = Wire.read();
        // store message bytes, starting with brightness then rgb values
        unsigned idx = 1;
        while (Wire.available())
        {
            rawFrames[frameIndex][idx] = Wire.read();
            idx++;
        }
    }
}

const uint8_t PROGMEM gamma8[] = {
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1,
    1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 2, 2, 2, 2, 2, 2,
    2, 3, 3, 3, 3, 3, 3, 3, 4, 4, 4, 4, 4, 5, 5, 5,
    5, 6, 6, 6, 6, 7, 7, 7, 7, 8, 8, 8, 9, 9, 9, 10,
    10, 10, 11, 11, 11, 12, 12, 13, 13, 13, 14, 14, 15, 15, 16, 16,
    17, 17, 18, 18, 19, 19, 20, 20, 21, 21, 22, 22, 23, 24, 24, 25,
    25, 26, 27, 27, 28, 29, 29, 30, 31, 32, 32, 33, 34, 35, 35, 36,
    37, 38, 39, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 50,
    51, 52, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64, 66, 67, 68,
    69, 70, 72, 73, 74, 75, 77, 78, 79, 81, 82, 83, 85, 86, 87, 89,
    90, 92, 93, 95, 96, 98, 99, 101, 102, 104, 105, 107, 109, 110, 112, 114,
    115, 117, 119, 120, 122, 124, 126, 127, 129, 131, 133, 135, 137, 138, 140, 142,
    144, 146, 148, 150, 152, 154, 156, 158, 160, 162, 164, 167, 169, 171, 173, 175,
    177, 180, 182, 184, 186, 189, 191, 193, 196, 198, 200, 203, 205, 208, 210, 213,
    215, 218, 220, 223, 225, 228, 231, 233, 236, 239, 241, 244, 247, 249, 252, 255};