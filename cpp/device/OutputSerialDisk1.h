#pragma once

#include <vector>
#include <grabber/ColorRgb.h>
#include <device/Output.h>
#include <device/OutputSerial.h>
#include <thirdparty/json/single_include/nlohmann/json.hpp>
using json = nlohmann::json;

class OutputSerialDisk1 : public OutputSerial
{
public:
    //
    OutputSerialDisk1(const json &properties) : OutputSerial(properties) {}
    int write(std::vector<ColorRgb> &ledValues, float &brightness)
    {
        // check output buffer object is initialised
        if (frameParts == 0)
        {
            // arduino can recv max 64 bytes per msg, so
            // calc number of 18-colour parts needed to send frame
            frameParts = (unsigned)ceil(ledValues.size() / 18.0);
        }
        // apply brightness
        buffer[6] = brightness * 255;
        if (_ledBuffer.size() == 0)
        {
            _ledBuffer.resize(8 + 3 * ledValues.size());
            _ledBuffer[0] = 'A';
            _ledBuffer[1] = 'd';
            _ledBuffer[2] = 'a';
            _ledBuffer[3] = ((ledValues.size() - 1) >> 8) & 0xFF; // LED count high byte
            _ledBuffer[4] = (ledValues.size() - 1) & 0xFF;        // LED count low byte
            _ledBuffer[5] = _ledBuffer[3] ^ _ledBuffer[4] ^ 0x55; // Checksum
            buffer[0] = 'A';
            buffer[1] = 'd';
            buffer[2] = 'a';
            buffer[3] = ((ledValues.size() - 1) >> 8) & 0xFF; // LED count high byte
            buffer[4] = (ledValues.size() - 1) & 0xFF;        // LED count low byte
            buffer[5] = buffer[3] ^ buffer[4] ^ 0x55;         // Checksum
        }
        // break frame into parts
        for (unsigned i = 0; i < frameParts; i++)
        {
            // set index of frame in header
            buffer[7] = i;
            // copy colours to frame
            for (unsigned k = 0; k < 18; k++)
            {
                // for each colour in the next 18
                unsigned ledIndex = (i * 18) + k;
                if (ledIndex < ledValues.size())
                {
                    // copy colour values into buffer
                    unsigned bufferIndex = 8 + (k * 3);
                    buffer[bufferIndex] = ledValues[ledIndex].red;
                    buffer[bufferIndex + 1] = ledValues[ledIndex].green;
                    buffer[bufferIndex + 2] = ledValues[ledIndex].blue;
                }
            }
            // send by serial
            writeBytes(62, buffer);
        }
        return 0;
    }
    unsigned char buffer[62]; // 64 = maximum serial buffer on arduino
    unsigned frameParts = 0;  // number of 62 byte messages per frame
};