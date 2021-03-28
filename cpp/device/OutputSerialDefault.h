#pragma once

#include <vector>
#include <grabber/ColorRgb.h>
#include <device/Output.h>
#include <device/OutputSerial.h>
#include <thirdparty/json/single_include/nlohmann/json.hpp>
using json = nlohmann::json;

class OutputSerialDefault : public OutputSerial
{
  public:
    //
    OutputSerialDefault(const json &properties) : OutputSerial(properties) {}
    int write(std::vector<ColorRgb> &ledValues,  float &brightness)
    {
        // apply brightness
        setBrightness(ledValues, brightness);
        if (_ledBuffer.size() == 0)
        {
            _ledBuffer.resize(6 + 3 * ledValues.size());
            _ledBuffer[0] = 'A';
            _ledBuffer[1] = 'd';
            _ledBuffer[2] = 'a';
            _ledBuffer[3] = ((ledValues.size() - 1) >> 8) & 0xFF; // LED count high byte
            _ledBuffer[4] = (ledValues.size() - 1) & 0xFF;        // LED count low byte
            _ledBuffer[5] = _ledBuffer[3] ^ _ledBuffer[4] ^ 0x55; // Checksum
        }

        // write data
        memcpy(6 + _ledBuffer.data(), ledValues.data(), ledValues.size() * 3);
        return writeBytes(_ledBuffer.size(), _ledBuffer.data());
    }
};