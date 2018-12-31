#include <iostream>
#include <fstream>
#include <vector>

#include <grabber/Image.h>
#include <grabber/ColorRgba.h>
#include <grabber/Grabber.h>
#include <nlohmann/json.hpp>
#include <device/DefaultDevice.h>

using namespace std;
using json = nlohmann::json;

int main()
{
    // read config file
    std::ifstream confFile("../www/engine/config.json");
    json config;
    confFile >> config;
    std::vector<DefaultDevice> devices;
    //DefaultDevice devices [2];
    for(json::iterator it = config["outputs"].begin(); it != config["outputs"].end(); ++it) {
        DefaultDevice device((*it)["device"], /*(*it)["properties"]["rate"]*/460800);
        device.open();
        devices.push_back(device);
        //devices[0] = device;
    }

    //
    unsigned _w = 640;
    unsigned _h = 480;
    FrameGrabber *grabber = new FrameGrabber(_w, _h);
    // The image used for grabbing frames
    Image<ColorRgba> _image(_w, _h);
    //
    grabber->grabFrame(_image);
    //
    // write ppm file
    ofstream myfile;
    myfile.open("screenshot.ppm");
    myfile << "P6"
           << "\n"
           << _w << " " << _h << "\n"
           << 255 << "\n";
    for (uint_least32_t y = 0; y < _image.height(); y++)
    {
        for (uint_least32_t x = 0; x < _image.width(); x++)
        {
            myfile << _image(x, y).red;
            myfile << _image(x, y).green;
            myfile << _image(x, y).blue;
        }
    }
    myfile.close();

    delete grabber;
    return 0;
}