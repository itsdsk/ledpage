#pragma once

#include <device/Output.h>
#include <bcm2835.h>
#include <stdio.h>
#include <math.h>
#include <thirdparty/json/single_include/nlohmann/json.hpp>
using json = nlohmann::json;

class OutputSPI1 : public Output
{
public:
    OutputSPI1(const json &properties)
    {
        // check properties object contains SPI properties, and set defaults if not
        if (properties.contains("clockDivider"))
        {
            _clockDivider = properties["clockDivider"].get<unsigned>();
        }
        else
        {
            _clockDivider = 64;
            std::cout << "no clock divider specified in properties, using default: " << _clockDivider << std::endl;
        }
        //Initiate the SPI Data Frame
        if (!bcm2835_init())
        {
            std::cout << "bcm2835_init failed. Are you running as root??\n"
                      << std::endl;
            return;
        }
        else
        {
            std::cout << "initialised aux bcm2835" << std::endl;
        }
        if (!bcm2835_aux_spi_begin())
        {
            std::cout << "bcm2835_aux_spi_begin failed. Are you running as root??\n"
                      << std::endl;
            return;
        }
        else
        {
            std::cout << "aux spi begin bcm2835" << std::endl;
        }
        bcm2835_aux_spi_setClockDivider(_clockDivider); // The default
                                                                   /*

		BCM2835_SPI_CLOCK_DIVIDER_65536 	65536 = 262.144us = 3.814697260kHz
		BCM2835_SPI_CLOCK_DIVIDER_32768 	32768 = 131.072us = 7.629394531kHz
		BCM2835_SPI_CLOCK_DIVIDER_16384 	16384 = 65.536us = 15.25878906kHz
		BCM2835_SPI_CLOCK_DIVIDER_8192 		8192 = 32.768us = 30/51757813kHz
		BCM2835_SPI_CLOCK_DIVIDER_4096 		4096 = 16.384us = 61.03515625kHz
		BCM2835_SPI_CLOCK_DIVIDER_2048 		2048 = 8.192us = 122.0703125kHz
		BCM2835_SPI_CLOCK_DIVIDER_1024 		1024 = 4.096us = 244.140625kHz
		BCM2835_SPI_CLOCK_DIVIDER_512 		512 = 2.048us = 488.28125kHz
		BCM2835_SPI_CLOCK_DIVIDER_256 		256 = 1.024us = 976.5625kHz
		BCM2835_SPI_CLOCK_DIVIDER_128 		128 = 512ns = = 1.953125MHz
		BCM2835_SPI_CLOCK_DIVIDER_64 		64 = 256ns = 3.90625MHz
		BCM2835_SPI_CLOCK_DIVIDER_32 		32 = 128ns = 7.8125MHz
		BCM2835_SPI_CLOCK_DIVIDER_16 		16 = 64ns = 15.625MHz
		BCM2835_SPI_CLOCK_DIVIDER_8 		8 = 32ns = 31.25MHz
		BCM2835_SPI_CLOCK_DIVIDER_4 		4 = 16ns = 62.5MHz
		BCM2835_SPI_CLOCK_DIVIDER_2 		2 = 8ns = 125MHz, fastest you can get	
	
	*/
        //
        std::cout << "Opened SPI1" << std::endl;
    };
    int write(const std::vector<ColorRgb> &ledValues)
    {
        // check output buffer object is initialised
        if (_ledBuffer.size() == 0)
        {
            // set output buffer size
            spiFrameLength = (startFrameLength + voltageBoostPixel + ledValues.size() + endFrameLength) * bytesPerLED;
            _ledBuffer.resize(spiFrameLength);
            // init the start frame
            for (int i = 0; i < startFrameLength * bytesPerLED; i++)
            {
                _ledBuffer[i] = 0;
            }
            // init the driver LED / voltage boost pixel
            for (int i = startFrameLength * bytesPerLED; i < (startFrameLength + voltageBoostPixel) * bytesPerLED; i += bytesPerLED)
            {
                _ledBuffer[i] = 255;
                _ledBuffer[i + 1] = 0;
                _ledBuffer[i + 2] = 0;
                _ledBuffer[i + 3] = 0;
            }
            // init the end frame
            for (int ledIndex = spiFrameLength - (endFrameLength * bytesPerLED); ledIndex < spiFrameLength; ledIndex += bytesPerLED)
            {
                _ledBuffer[ledIndex] = 255;
                _ledBuffer[ledIndex + 1] = 255;
                _ledBuffer[ledIndex + 2] = 255;
                _ledBuffer[ledIndex + 3] = 255;
            }
        }
        // insert colours into output buffer
        for (int ledIndex = 0; ledIndex < ledValues.size(); ledIndex++)
        {
            int bufferIndex = (startFrameLength + voltageBoostPixel + ledIndex) * bytesPerLED;
            _ledBuffer[bufferIndex] = 255;
            _ledBuffer[bufferIndex + 1] = ledValues[ledIndex].red;
            _ledBuffer[bufferIndex + 2] = ledValues[ledIndex].green;
            _ledBuffer[bufferIndex + 3] = ledValues[ledIndex].blue;
        }
        // send to LEDs
        bcm2835_aux_spi_writenb(_ledBuffer.data(), spiFrameLength);
        bcm2835_delay(1);
        return 0;
    }
    virtual ~OutputSPI1()
    {
        // close the SPI bus
        bcm2835_aux_spi_end();
        bcm2835_close();
        std::cout << "Closed SPI1" << std::endl;
    };
    std::vector<char> _ledBuffer;
    unsigned _clockDivider = 64; // SPI clock divider, https://www.airspayce.com/mikem/bcm2835/group__constants.html#gaf2e0ca069b8caef24602a02e8a00884e
    // setup data block for LEDs
    static const uint8_t bytesPerLED = 4;
    static const int16_t endFrameLength = 15;   //round( (numOfLEDs/2)/8 );
    static const int16_t startFrameLength = 1; // n * bytesPerLED
    static const int16_t voltageBoostPixel = 1;
    int16_t spiFrameLength = 0;
};