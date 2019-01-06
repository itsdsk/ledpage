#include <iostream>
#include <fstream>
#include <vector>
#include <unistd.h>

#include <device/DeviceManager.h>
#include <grabber/Image.h>
#include <grabber/ColorRgba.h>
#include <grabber/Grabber.h>

#include <boost/thread/thread.hpp>
#include <thirdparty/json/single_include/nlohmann/json.hpp>
#include <thirdparty/cxxopts/include/cxxopts.hpp>
#include <thirdparty/websocketpp/websocketpp/server.hpp>
#include <websocketpp/config/asio_no_tls.hpp>

using namespace std;
using json = nlohmann::json;

// websocketpp
typedef websocketpp::server<websocketpp::config::asio> server;
using websocketpp::lib::placeholders::_1;
using websocketpp::lib::placeholders::_2;
typedef server::message_ptr message_ptr;

void on_message(server *s, websocketpp::connection_hdl hdl, message_ptr msg)
{
    try
    {
        // parse msg received as json
        auto jdata = json::parse(msg->get_payload());
        //cout << "payload:" << jdata.dump(2) << endl;
        // go through top level of JSON object received
        for (auto &element1 : jdata.items())
        {
            string key1 = element1.key();
            if (key1 == "outputs")
            {
                // received an entry for "outputs", go through items in this array
                for (auto &element2 : (element1.value()).items())
                {
                    // get this output device name
                    string outputDevice = element2.value()["device"];
                    if (element2.value().find("leds") != element2.value().end())
                    {
                        // there is an entry in array "leds", loop through objects within it
                        for (auto &ledElement : element2.value()["leds"].items())
                        {
                            // get new values for LED
                            int index = ledElement.value()["index"];
                            int x = ledElement.value()["x"];
                            int y = ledElement.value()["y"];
                            int r = ledElement.value()["r"];
                            // log
                            cout << "Received LED in device \"" << outputDevice << "\" at index " << index << " position " << x << "," << y << " r:" << r << endl;
                        }
                    }
                }
            }
            else if (key1 == "window")
            {
                cout << "key1 is window" << endl;
            }
        }
    }
    catch (const websocketpp::lib::error_code &e)
    {
        std::cout << "Read failed because: " << e << "(" << e.message() << ")" << std::endl;
    }
}

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

    // websockets server
    server ws_server;
    boost::asio::io_service io_service;
    try
    {
        // todo: add exception handling e.g. https://mayaposch.wordpress.com/2015/09/16/creating-a-websocket-server-with-websocket/
        ws_server.init_asio(&io_service);
        ws_server.set_message_handler(bind(&on_message, &ws_server, ::_1, ::_2));
        ws_server.set_reuse_addr(true);
        ws_server.listen(9002);
        ws_server.start_accept();
        boost::thread t(boost::bind(&boost::asio::io_service::run, boost::ref(io_service)));
    }
    catch (websocketpp::exception const &e)
    {
        std::cout << e.what() << std::endl;
    }
    catch (...)
    {
        std::cout << "other exception" << std::endl;
    }
    while (true)
    {
        // run indefinitely (test for WS)
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