#pragma once

#include <device/Output.h>
#include <stdio.h>
#include <math.h>
#include <bcm2835.h>
#include <thirdparty/json/single_include/nlohmann/json.hpp>
using json = nlohmann::json;

class OutputI2Cbcm2835 : public Output
{
public:
    OutputI2Cbcm2835(const json &properties)
    {
        // init interface library
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
        std::cout << "BCM2835 Version: " << BCM2835_VERSION << std::endl;
        if (!bcm2835_i2c_begin())
        {
            std::cout << "bcm2835_i2c_begin failedg. Are you running as root??\n"
                      << std::endl;
            return;
        }
        else
        {
            std::cout << "i2c begin bcm2835" << std::endl;
        }
        // set address of I2C slave
        bcm2835_i2c_setSlaveAddress(0x08);
        // set clock speed
        // bcm2835_i2c_setClockDivider(BCM2835_I2C_CLOCK_DIVIDER_626);
        bcm2835_i2c_set_baudrate(400000);
        std::cout << "Opened i2c" << std::endl;
    };
    int write(std::vector<ColorRgb> &ledValues,  float &brightness)
    {
        // check output buffer object is initialised
        if (_ledBuffer.size() == 0)
        {
            // calc number of 10-colour parts needed to send frame
            frameParts = (unsigned)ceil(ledValues.size() / 10.0);
            // set led buffer size (contains 10 colours)
            _ledBuffer.resize(32); // 32 = maximum i2c buffer on arduino
        }
        // set brightness in header
        _ledBuffer[1] = brightness * 255;
        // break frame into parts
        for(unsigned i = 0; i < frameParts; i++)
        {
            // set index of frame in header
            _ledBuffer[0] = i;
            // copy colours to frame
            for(unsigned k = 0; k < 10; k++)
            {
                // for each colour in the next 10
                unsigned ledIndex = (i * 10) + k;
                if (ledIndex < ledValues.size()) {
                    // copy colour values into buffer
                    unsigned bufferIndex = 2 + (k * 3);
                    _ledBuffer[bufferIndex] = ledValues[ledIndex].red;
                    _ledBuffer[bufferIndex + 1] = ledValues[ledIndex].green;
                    _ledBuffer[bufferIndex + 2] = ledValues[ledIndex].blue;
                }
            }
                // send by i2c
                int i2cWriteStatus = bcm2835_i2c_write(_ledBuffer.data(), 32);
                if (i2cWriteStatus == BCM2835_I2C_REASON_OK) {
                    //std::cout << "BCM2835_I2C_REASON_OK" << std::endl;
                } else if (i2cWriteStatus == BCM2835_I2C_REASON_ERROR_NACK) {
                    std::cout << "BCM2835_I2C_REASON_ERROR_NACK" << std::endl;
                } else if (i2cWriteStatus == BCM2835_I2C_REASON_ERROR_CLKT ) {
                    std::cout << "BCM2835_I2C_REASON_ERROR_CLKT" << std::endl;
                } else if (i2cWriteStatus == BCM2835_I2C_REASON_ERROR_DATA) {
                    std::cout << "BCM2835_I2C_REASON_ERROR_DATA" << std::endl;
                }
                bcm2835_delayMicroseconds(100);
        }
        //bcm2835_delay(1);
        return 0;
    }
    virtual ~OutputI2Cbcm2835()
    {
        // close
        bcm2835_i2c_end();
        bcm2835_close();
        std::cout << "Closed i2c" << std::endl;
    };
    int _i2cHandle;
    std::vector<char> _ledBuffer;
    unsigned frameParts = 0; // number of 32 byte messages per frame
};