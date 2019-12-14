#pragma once

#include <device/Output.h>
#include <bcm2835.h>
#include <stdio.h>
#include <math.h>

class OutputGPIO : public Output
{
public:
    OutputGPIO()
    {
        //
        //Initiate the SPI Data Frame
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
        if (!bcm2835_spi_begin())
        {
            std::cout << "bcm2835_spi_begin failedg. Are you running as root??\n"
                      << std::endl;
            return;
        }
        else
        {
            std::cout << "spi begin bcm2835" << std::endl;
        }
        bcm2835_spi_setBitOrder(BCM2835_SPI_BIT_ORDER_MSBFIRST);   // The default
        bcm2835_spi_setDataMode(BCM2835_SPI_MODE0);                // The default
                                                                   /*
		
	BCM2835_SPI_MODE0 		CPOL = 0, CPHA = 0
	BCM2835_SPI_MODE1 		CPOL = 0, CPHA = 1
	BCM2835_SPI_MODE2 		CPOL = 1, CPHA = 0
	BCM2835_SPI_MODE3 		CPOL = 1, CPHA = 1	
	*/
        bcm2835_spi_setClockDivider(BCM2835_SPI_CLOCK_DIVIDER_64); // The default
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
        bcm2835_spi_chipSelect(BCM2835_SPI_CS0);                   // The default
        bcm2835_spi_setChipSelectPolarity(BCM2835_SPI_CS0, LOW);   // the default

        //
        std::cout << "Opened GPIO" << std::endl;
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
        bcm2835_spi_writenb(_ledBuffer.data(), spiFrameLength);
        bcm2835_delay(5);
        return 0;
    }
    virtual ~OutputGPIO()
    {
        // close the SPI bus
        bcm2835_spi_end();
        bcm2835_close();
        std::cout << "Closed GPIO" << std::endl;
    };
    std::vector<char> _ledBuffer;

    // setup data block for LEDs
    static const uint8_t bytesPerLED = 4;
    static const int16_t endFrameLength = 15;   //round( (numOfLEDs/2)/8 );
    static const int16_t startFrameLength = 1; // n * bytesPerLED
    static const int16_t voltageBoostPixel = 1;
    int16_t spiFrameLength = 0;
};