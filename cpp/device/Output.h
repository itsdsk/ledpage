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
    virtual int write(const std::vector<ColorRgb> &ledValues) = 0;
};