#pragma once

#include <device/Output.h>
#include <stdio.h>
#include <math.h>
#include <pigpio.h>

class OutputPWMpigpio : public Output
{
public:
    OutputPWMpigpio()
    {
        //
        if (gpioInitialise() < 0)
        {
            std::cout << "pigpio initialisation failed" << std::endl;
            return;
        }
        else
        {
            std::cout << "initialised pigpio" << std::endl;
            if (gpioSetMode(18, PI_OUTPUT) != 0) {
                std::cout << "error in gpio set mode" << std::endl;
            }
            std::cout << "PWM frequency: " << gpioSetPWMfrequency(18, 250) << "Hz" << std::endl;
            gpioSetPWMrange(18, 765); // range = 255 * 3
        }
        std::cout << "Opened PWM" << std::endl;
    };
    int write(const std::vector<ColorRgb> &ledValues)
    {
        // get colour (max speed is RANGE = 255 * 3)
        uint32_t data = 0;
        data += ledValues[0].red;
        data += ledValues[0].green;
        data += ledValues[0].blue;
        // send to PWM
        if(gpioPWM(18, data) != 0) {
            std::cout << "pwm error" << std::endl;
        }
        return 0;
    }
    virtual ~OutputPWMpigpio()
    {
        // close
        gpioTerminate();
        std::cout << "Closed PWM" << std::endl;
    };
};