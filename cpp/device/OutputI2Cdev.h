#pragma once

#include <device/Output.h>
#include <stdio.h>
#include <math.h>
#include <thirdparty/json/single_include/nlohmann/json.hpp>
#include <unistd.h>
#include <sys/ioctl.h>
#include <linux/i2c-dev.h>
#include <fcntl.h>

using json = nlohmann::json;

class OutputI2Cdev : public Output
{
public:
    OutputI2Cdev(const json &properties)
    {
        // check properties object contains MAC address of bluetooth device
        if (properties.contains("device"))
        {
            filename = properties["device"];
            std::cout << "Using I2C address " << filename << std::endl;
        }
        else
        {
            std::cout << "No I2C device specified in properties, defaulting to " << filename << std::endl;
        }

        // try to connect to I2C
        if ((file_i2c = open(filename.c_str(), O_RDWR)) < 0)
        {
            std::cout << "Failed to open the i2c bus" << std::endl;
            return;
        }

        int addr = 0x08; // address of Arduino
        if (ioctl(file_i2c, I2C_SLAVE, addr) < 0)
        {
            std::cout << "Failed to acquire bus access and/or talk to slave" << std::endl;
            return;
        }
        std::cout << "Opened i2c dev" << std::endl;
    };

    int write(std::vector<ColorRgb> &ledValues,  float &brightness)
    {
        // check output buffer object is initialised
        if (frameParts == 0)
        {
            // calc number of 10-colour parts needed to send frame
            frameParts = (unsigned)ceil(ledValues.size() / 10.0);
        }
        // init error counter
        unsigned write_error_count = 0;
        // set brightness in header
        buffer[1] = brightness * 255;
        // break frame into parts
        for(unsigned i = 0; i < frameParts; i++)
        {
            // set index of frame in header
            buffer[0] = i;
            // copy colours to frame
            for(unsigned k = 0; k < 10; k++)
            {
                // for each colour in the next 10
                unsigned ledIndex = (i * 10) + k;
                if (ledIndex < ledValues.size()) {
                    // copy colour values into buffer
                    unsigned bufferIndex = 2 + (k * 3);
                    buffer[bufferIndex] = ledValues[ledIndex].red;
                    buffer[bufferIndex + 1] = ledValues[ledIndex].green;
                    buffer[bufferIndex + 2] = ledValues[ledIndex].blue;
                }
            }
            // send by i2c
            if (::write(file_i2c, buffer, 32) != 32)
            {
                write_error_count++;
            }
            // pause to let buffer clear
            // usleep(1200);
        }
        // log errors
        if (write_error_count > 1)
        {
            std::cout << "Failed to write to the i2c bus " << write_error_count << " times." << std::endl;
            // pause before retrying
            usleep(200000);
        }
        return 0;
    }
    virtual ~OutputI2Cdev()
    {
        // close
        std::cout << "Closed i2c dev" << std::endl;
    };
    int _i2cHandle;
    unsigned char buffer[32]; // 32 = maximum i2c buffer on arduino 
    unsigned frameParts = 0; // number of 32 byte messages per frame
    std::string filename = "/dev/i2c-3"; // file descriptor for i2c
    int file_i2c;
};