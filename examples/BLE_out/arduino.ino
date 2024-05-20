#include <Servo.h>
#include <SoftwareSerial.h>
#include <FastLED.h>

#define LED_PIN 6
#define OFFSET_PIN 5
#define CERAMIC_PIN 11
#define OFFSET_REVERSE_PIN 4

#define RINGS_OF_7_LEDS 16
#define RINGS_OF_12_LEDS 1
#define NUM_MOTOR_TRIPLETS 1

#define NUM_COLOURS (RINGS_OF_7_LEDS * 7) + (RINGS_OF_12_LEDS * 12)

#define DEBUG_LED 13

// serial bluetooth
// SoftwareSerial SerialSPP(2, 3); // RX | TX

// data header
uint8_t prefix[] = {'A', 'd', 'a'}, hi, lo, chk, i;

// baudrate
#define serialRate 9600

// data size
const uint16_t total_bytes = (RINGS_OF_7_LEDS + RINGS_OF_12_LEDS + NUM_MOTOR_TRIPLETS) * 3;
uint8_t rec_data[total_bytes]; // recieved data

// current data
uint8_t cur_data[total_bytes];

//
CRGB leds[NUM_COLOURS];
Servo Ceramic;
uint8_t offset_speed = 0;  // 0 - 255
uint8_t ceramic_speed = 0; // 0 - 180

uint8_t offset_min_speed = 64;  // 128
uint8_t ceramic_min_speed = 20; // 50

int debug_flag = 0;

void setup()
{
  // init all to 0
  for (int k = 0; k < total_bytes; k++)
  {
    rec_data[k] = 0;
    cur_data[k] = 0;
  }

  FastLED.addLeds<NEOPIXEL, LED_PIN>(leds, NUM_COLOURS);
  Serial.begin(serialRate);
  // SerialSPP.begin(9600);
  //  debug led pin
  pinMode(DEBUG_LED, OUTPUT);
  // connect to motors
  pinMode(OFFSET_PIN, OUTPUT); // Defines the Offset_Pin as a PWM output
  uint16_t min_pulse, max_pulse;
  min_pulse = 1000;
  max_pulse = 2000;
  Ceramic.attach(CERAMIC_PIN, min_pulse, max_pulse);
  // calirate ceramic ESC
  delay(2000);
  Ceramic.writeMicroseconds(max_pulse);
  delay(2000);
  Ceramic.writeMicroseconds(min_pulse);
  delay(2000);
  // send high enough signal to jump start motors
  analogWrite(OFFSET_PIN, 255);
  Ceramic.write(100);
}

void updateEverything()
{
  digitalWrite(DEBUG_LED, HIGH);
  // lerp current data to target data
  float lerp_amt = 0.1;
  for (int j = 0; j < total_bytes; j++)
  {
    cur_data[j] = uint8_t(float(cur_data[j]) * (1.0 - lerp_amt) + float(rec_data[j]) * lerp_amt);
  }

  // parse data
  int cur_data_idx = 0;
  int leds_idx = 0;

  // get colours in rings of 7
  for (int j = 0; j < RINGS_OF_7_LEDS; j++)
  {
    // get colour of ring
    int R = cur_data[cur_data_idx];
    cur_data_idx++;
    int G = cur_data[cur_data_idx];
    cur_data_idx++;
    int B = cur_data[cur_data_idx];
    cur_data_idx++;
    // set colors to ring of 7 leds
    for (int k = 0; k < 7; k++)
    {
      leds[leds_idx].setRGB(R, G, B);
      leds_idx++;
    }
  }
  // get colours in rings of 12
  for (int j = 0; j < RINGS_OF_12_LEDS; j++)
  {
    // get colour of ring
    int R = cur_data[cur_data_idx];
    cur_data_idx++;
    int G = cur_data[cur_data_idx];
    cur_data_idx++;
    int B = cur_data[cur_data_idx];
    cur_data_idx++;
    // set colors to ring of 7 leds
    for (int k = 0; k < 12; k++)
    {
      leds[leds_idx].setRGB(R, G, B);
      leds_idx++;
    }
  }

  // get motor vals
  offset_speed = cur_data[total_bytes - 1];
  ceramic_speed = cur_data[total_bytes - 2]; // map from 0 to 180?
  // map ceramic speed from 0 to 180
  // ceramic_speed = uint8_t((180.0/255.0) * float(ceramic_speed));
  // map ceramic speed from 0 to 180
  // ceramic_speed = uint8_t((180.0/255.0) * float(ceramic_speed));
  ceramic_speed = map(ceramic_speed, 0, 255, ceramic_min_speed, 180);
  // map offset speed from 128 to 255
  offset_speed = map(offset_speed, 0, 255, offset_min_speed, 255);
  // send ceramic motor speed
  Ceramic.write(ceramic_speed); // 0 - 180
  // send offset speed and reverse sign
  // digitalWrite(OFFSET_REVERSE_PIN, cur_data[total_bytes-3] < 100 ? LOW : HIGH);
  analogWrite(OFFSET_PIN, offset_speed); // 0 to 255
  // update LEDs
  FastLED.show();
  digitalWrite(DEBUG_LED, LOW);
}

void loop()
{
  // int secs = int(millis() / 1000.0f);
  /*
  if (debug_flag == 0) {
    digitalWrite(DEBUG_LED, HIGH);
    debug_flag = 1;
  } else {
    digitalWrite(DEBUG_LED, LOW);
    debug_flag = 0;
  }
  */
  // wait for first byte of Magic Word
  for (i = 0; i < sizeof prefix; ++i)
  {
  waitLoop:
    while (!Serial.available())
      ;
    ;
    // Check next byte in Magic Word
    if (prefix[i] == Serial.read())
      continue;
    // otherwise, start over
    i = 0;
    //
    // updateEverything();
    //
    goto waitLoop;
  }

  // Hi, Lo, Checksum
  while (!Serial.available())
    ;
  ;
  hi = Serial.read();
  while (!Serial.available())
    ;
  ;
  lo = Serial.read();
  while (!Serial.available())
    ;
  ;
  chk = Serial.read();

  // if checksum does not match go back to wait
  if (chk != (hi ^ lo ^ 0x55))
  {
    i = 0;
    goto waitLoop;
  }

  // read the transmition data and set motor values
  while (!Serial.available())
    ;
  size_t count = Serial.readBytes(rec_data, total_bytes);
  // check data and log
  if (count != total_bytes)
  {
    // Serial.print("Error: wrong num of bytes received\n");
  }
  else
  {
    // update
    updateEverything();
  }
}