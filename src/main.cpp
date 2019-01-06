#include <iostream>
#include <fstream>
#include <vector>
#include <unistd.h>

#include <device/DeviceManager.h>
#include <grabber/Image.h>
#include <grabber/ColorRgba.h>
#include <grabber/Grabber.h>
#include <thirdparty/json/single_include/nlohmann/json.hpp>
#include <thirdparty/cxxopts/include/cxxopts.hpp>

using namespace std;
using json = nlohmann::json;

int jsonStringToInt(json &value)
{
    return std::stoi(value.get<std::string>());
}

void saveScreenshot(Image<ColorRgba> &_image);

int main(int argc, char *argv[])
{
    // command line options
    cxxopts::Options options("Disk", "Display Web Media on LEDs from Raspberry Pi");
    options.add_options()("s,screenshot", "Save screenshot as .PPM")("d,display", "Display screenshot on device");
    auto result = options.parse(argc, argv);

    // read config file
    std::ifstream confFile("../www/engine/config.json");
    json config;
    confFile >> config;

    // add output objects based on config
    vector<DeviceManager> deviceManagers;
    for (unsigned i = 0; i < config["outputs"].size(); i++)
    {
        deviceManagers.emplace_back(config, i);
    }

    // create framegrabber and image object
    unsigned _w = jsonStringToInt(config["window"]["width"]);
    unsigned _h = jsonStringToInt(config["window"]["height"]);
    cout << "config window size: " << _w << " x " << _h << endl;
    FrameGrabber *grabber = new FrameGrabber(_w, _h);
    Image<ColorRgba> _image(_w, _h);

    // display screen on device
    if (result.count("display") > 0) // runtime loop
    {
        for (int i = 0; i < 1; i++)
        {
            grabber->grabFrame(_image);
            for (auto &deviceManager : deviceManagers)
            {
                deviceManager.update(_image);
            }
        }
    }
    // save screenshot
    if (result.count("screenshot") > 0)
    {
        grabber->grabFrame(_image);
    }

    delete grabber;
    return 0;
}

void saveScreenshot(Image<ColorRgba> &_image)
{
    // write ppm file
    ofstream myfile;
    myfile.open("screenshot.ppm");
    myfile << "P6"
           << "\n"
           << _image.width() << " " << _image.height() << "\n"
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
    cout << "Saving screenshot" << endl;
    myfile.close();
}