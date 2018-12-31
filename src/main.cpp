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

int jsonStringToInt(json &value)
{
    return std::stoi(value.get<std::string>());
}

int main()
{
    // read config file
    std::ifstream confFile("../www/engine/config.json");
    json config;
    confFile >> config;
    std::vector<DefaultDevice> devices; // todo: change this vector to array for performance?
    for (json::iterator it = config["outputs"].begin(); it != config["outputs"].end(); ++it)
    {
        DefaultDevice device((*it)["device"], jsonStringToInt((*it)["properties"]["rate"]));
        device.open();
        devices.push_back(device);
    }

    //
    unsigned _w = jsonStringToInt(config["window"]["width"]);
    unsigned _h = jsonStringToInt(config["window"]["height"]);
    cout << "config window size: " << _w << " x " << _h << endl;
    FrameGrabber *grabber = new FrameGrabber(_w, _h);
    // The image used for grabbing frames
    Image<ColorRgba> _image(_w, _h);

    if (true) // runtime loop
    {
        for (int i = 0; i < 1; i++)
        {
            grabber->grabFrame(_image);
        }
    }
    else // save screenshot
    {
        grabber->grabFrame(_image);
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
    }

    delete grabber;
    return 0;
}