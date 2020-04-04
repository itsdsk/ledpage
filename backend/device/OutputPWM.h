#pragma once

#include <device/Output.h>
#include <bcm2835.h>
#include <stdio.h>
#include <math.h>

// PWM output on RPi Plug P1 pin 12 (which is GPIO pin 18)
// in alt fun 5.
// Note that this is the _only_ PWM pin available on the RPi IO headers
#define PIN RPI_GPIO_P1_12
// and it is controlled by PWM channel 0
#define PWM_CHANNEL 0
// This controls the max range of the PWM signal
#define RANGE 1024

class OutputPWM : public Output
{
public:
    OutputPWM()
    {
        //
        if (!bcm2835_init())
        {
            std::cout << "bcm2835_init failed. Are you running as root??\n"
                      << std::endl;
            return;
        }
        else
        {
            std::cout << "initialised bcm2835" << std::endl;
        }
        // Set the output pin to Alt Fun 5, to allow PWM channel 0 to be output there
        bcm2835_gpio_fsel(PIN, BCM2835_GPIO_FSEL_ALT5);
        // Clock divider is set to 16.
        // With a divider of 16 and a RANGE of 1024, in MARKSPACE mode,
        // the pulse repetition frequency will be
        // 1.2MHz/1024 = 1171.875Hz, suitable for driving a DC motor with PWM
        bcm2835_pwm_set_clock(BCM2835_PWM_CLOCK_DIVIDER_16);
        bcm2835_pwm_set_mode(PWM_CHANNEL, 1, 1);
        bcm2835_pwm_set_range(PWM_CHANNEL, RANGE);
        std::cout << "Opened PWM" << std::endl;
    };
    int write(const std::vector<ColorRgb> &ledValues)
    {
        // get colour // TODO: as value between 1/RANGE and (RANGE-1)/RANGE
        int data = 0;
        data += ledValues[0].red;
        data += ledValues[0].green;
        data += ledValues[0].blue;
        // send to PWM
        bcm2835_pwm_set_data(PWM_CHANNEL, data);
        bcm2835_delay(1);
        return 0;
    }
    virtual ~OutputPWM()
    {
        // close
        bcm2835_close();
        std::cout << "Closed PWM" << std::endl;
    };
};