

// LED programming objects (should already be set)
#include "FastLED.h"
#define DATA_PIN 5
#define CLOCK_PIN 13
#define NUM_LEDS 96
#define COLOR_ORDER BGR
#define LED_TYPE APA102
#define DATA_RATE 4000 // KHz

#define COLS_PER_FRAME 20
#define HEADER_SIZE 2 // including brightness byte and frame byte

CRGB leds[NUM_LEDS];       // output array
CRGB targetLeds[NUM_LEDS]; // target array

byte brightness = 0;       // output brightness
byte targetBrightness = 0; // target brightness

byte rawFrames[NUM_LEDS * 3];

extern const uint8_t gamma8[]; // gamma correction lookup table

// baudrate (higher is faster refresh rate)
#define serialRate 57600 // try 9600, 14400, 19200, 28800, 38400, 57600, 115200, 230400, 460800

unsigned framesSinceReceiveEvent = 0; // how many times loop() has been called since last Wire.onReceive

void setup()
{
    delay(1000); // power up safety delay

    // initialise LEDs
    FastLED.addLeds<LED_TYPE, DATA_PIN, CLOCK_PIN, COLOR_ORDER, DATA_RATE_KHZ(DATA_RATE)>(leds, NUM_LEDS).setCorrection(TypicalSMD5050).setTemperature(CarbonArc);
    FastLED.setBrightness(brightness);

    // initialise serial USB communication
    Serial.begin(serialRate);
}

void serialEvent()
{
    Serial.println("done");
    framesSinceReceiveEvent = 0;

    if (Serial.available())
    {
        // get brightness
        targetBrightness = Serial.read();
        // get frame index
        unsigned frameIndex = Serial.read() * COLS_PER_FRAME * 3;
        unsigned idx = 0;
        while (Serial.available())
        {
            if (idx == COLS_PER_FRAME * 3 || frameIndex + idx == NUM_LEDS * 3)
                return;
            rawFrames[frameIndex + idx] = Serial.read();
            idx++;
        }
    }
}

void loop()
{
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
    for (int k = 0; k < NUM_LEDS; k++)
    {
        // set target array
        targetLeds[k].r = pgm_read_byte(&gamma8[rawFrames[(k * 3) + 0]]);
        targetLeds[k].g = pgm_read_byte(&gamma8[rawFrames[(k * 3) + 1]]);
        targetLeds[k].b = pgm_read_byte(&gamma8[rawFrames[(k * 3) + 2]]);
    }
    // copy brightness, and...
    // downscale to stop voltage drop that
    // appears as redder pixels further from the power inputs on the screen,
    // only when displaying pure white and setting brightness over 25%
    // without any clamping/mapping)
    // targetBrightness = round(rawFrames[0][1] * 0.25);
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
    return;
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