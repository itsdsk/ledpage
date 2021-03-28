#pragma once

#include <vector>
#include <grabber/ColorRgb.h>

class Output
{
  public:
    //
    virtual ~Output()
    {
        //
    }
    virtual int write(std::vector<ColorRgb> &ledValues, float &brightness) = 0;
    void setBrightness(std::vector<ColorRgb> &ledValues, float &brightness)
    {
      for(unsigned i = 0; i < ledValues.size(); i++)
      {
        ledValues[i].red = uint8_t(ledValues[i].red * brightness);
        ledValues[i].green = uint8_t(ledValues[i].green * brightness);
        ledValues[i].blue = uint8_t(ledValues[i].blue * brightness);
      }
    }
};