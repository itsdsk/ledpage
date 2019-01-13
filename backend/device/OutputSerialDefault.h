#pragma once

#include <vector>
#include <grabber/ColorRgb.h>
#include <device/Output.h>
#include <device/OutputSerial.h>

class OutputSerialDefault : public OutputSerial
{
  public:
    //
    OutputSerialDefault(const std::string &name, const unsigned baudRate) : OutputSerial(name, baudRate) {}
    int write(const std::vector<ColorRgb> &ledValues)
    {
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